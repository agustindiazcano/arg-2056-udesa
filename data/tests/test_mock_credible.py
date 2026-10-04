"""The mock is illustrative but must be believable: orders of magnitude, identities between files, a story a viewer
can read. These tests describe that. The invariants of the contracts stay in test_mock_data.py."""

import json
import subprocess
import sys

import pytest

COUNTRIES = ["ARG", "BRA", "CHL", "COL", "MEX", "PER", "URY"]
PROVINCES = [
    "AR-A", "AR-B", "AR-C", "AR-D", "AR-E", "AR-F", "AR-G", "AR-H", "AR-J", "AR-K", "AR-L", "AR-M",
    "AR-N", "AR-P", "AR-Q", "AR-R", "AR-S", "AR-T", "AR-U", "AR-V", "AR-W", "AR-X", "AR-Y", "AR-Z",
]
RESOURCE_PROVINCES = {
    "lithium": {"AR-A", "AR-Y", "AR-K"},
    "copper": {"AR-K", "AR-J", "AR-A"},
    "gold": {"AR-Z", "AR-J", "AR-K"},
    "oil": {"AR-Q", "AR-U", "AR-Z", "AR-M", "AR-R"},
    "gas": {"AR-Q", "AR-V", "AR-A", "AR-Z"},
    "soy": {"AR-B", "AR-X", "AR-S", "AR-E", "AR-G", "AR-T"},
}
UNITS = {
    "lithium": "kt LCE",
    "copper": "kt Cu",
    "gold": "t Au",
    "oil": "kbbl/d",
    "gas": "Mm3/d",
    "soy": "Mt",
}


@pytest.fixture(scope="module")
def mock(tmp_path_factory):
    out = tmp_path_factory.mktemp("credible")
    subprocess.run([sys.executable, "scripts/gen_mock.py", str(out)], check=True)
    return out


def load(mock, name):
    return json.loads((mock / f"{name}.json").read_text(encoding="utf-8"))


def series(rows, **where):
    return {r["year"]: r["value"] for r in rows if all(r.get(k) == v for k, v in where.items())}


# ---- economy --------------------------------------------------------------------------------------------------


def test_economy_has_the_seven_countries_and_six_indicators(mock):
    rows = load(mock, "economy_series")
    assert sorted({r["country"] for r in rows}) == COUNTRIES
    assert sorted({r["indicator"] for r in rows}) == [
        "exports_usd", "gdp_constant_usd", "gdp_per_capita_usd", "hdi", "imports_usd", "population",
    ]


def test_economy_units_are_real_units_not_mock_units(mock):
    units = {r["indicator"]: r["unit"] for r in load(mock, "economy_series")}
    assert units == {
        "gdp_constant_usd": "USD",
        "gdp_per_capita_usd": "USD",
        "population": "personas",
        "hdi": "índice",
        "exports_usd": "USD",
        "imports_usd": "USD",
    }


def test_argentina_today_is_in_a_believable_range(mock):
    rows = load(mock, "economy_series")
    arg = lambda ind: series(rows, country="ARG", indicator=ind)  # noqa: E731
    assert 38e6 <= arg("population")[2025] <= 52e6
    assert 8000 <= arg("gdp_per_capita_usd")[2025] <= 20000
    assert 0.80 <= arg("hdi")[2025] <= 0.90


def test_gdp_is_gdp_per_capita_times_population_wherever_the_three_exist(mock):
    rows = load(mock, "economy_series")
    for country in COUNTRIES:
        gdp = series(rows, country=country, indicator="gdp_constant_usd")
        per_capita = series(rows, country=country, indicator="gdp_per_capita_usd")
        population = series(rows, country=country, indicator="population")
        checked = 0
        for year, value in gdp.items():
            if value is None or per_capita.get(year) is None or population.get(year) is None:
                continue
            assert value == pytest.approx(per_capita[year] * population[year], rel=1e-3), (country, year)
            checked += 1
        assert checked > 100, country


def test_the_ranking_tells_the_story_argentina_led_in_1913_and_does_not_lead_today(mock):
    rows = load(mock, "economy_series")
    at = lambda year: {  # noqa: E731
        c: series(rows, country=c, indicator="gdp_per_capita_usd").get(year) for c in COUNTRIES
    }
    in_1913 = at(1913)
    assert max(in_1913, key=in_1913.get) == "ARG"
    today = at(2025)
    ranked = sorted(today, key=today.get, reverse=True)
    assert ranked.index("ARG") >= 2, ranked


def test_argentina_shows_its_crisis_years(mock):
    gdp_pc = series(load(mock, "economy_series"), country="ARG", indicator="gdp_per_capita_usd")
    for year in (1930, 1989, 2001):
        assert gdp_pc[year] <= gdp_pc[year - 1] * 0.95, year


def test_economy_keeps_its_gaps_and_nulls_with_a_note(mock):
    rows = load(mock, "economy_series")
    nulls = [r for r in rows if r["value"] is None]
    assert len(nulls) >= 3 and all(r.get("note") for r in nulls)
    uruguay = series(rows, country="URY", indicator="gdp_constant_usd")
    assert all(year not in uruguay for year in range(1900, 1906))


def test_trade_flows_start_in_1960_and_are_a_plausible_share_of_gdp(mock):
    rows = load(mock, "economy_series")
    exports = series(rows, country="ARG", indicator="exports_usd")
    gdp = series(rows, country="ARG", indicator="gdp_constant_usd")
    assert min(exports) == 1960
    share = exports[2020] / gdp[2020]
    assert 0.08 <= share <= 0.30


# ---- population by province -------------------------------------------------------------------------------------


def test_population_provinces_add_up_to_the_country_and_buenos_aires_is_the_largest(mock):
    rows = load(mock, "population")
    national = series(rows, geo="AR")
    assert 38e6 <= national[2025] <= 52e6
    by_province = {p: series(rows, geo=p)[2025] for p in PROVINCES}
    assert sum(by_province.values()) == pytest.approx(national[2025], rel=0.005)
    assert max(by_province, key=by_province.get) == "AR-B"
    assert min(by_province.values()) < 0.01 * national[2025]
    assert series(rows, geo="AR")[1950] < national[2025] / 2


# ---- resources -------------------------------------------------------------------------------------------------


def test_resources_sit_in_the_provinces_where_they_make_sense(mock):
    rows = load(mock, "resource_production")
    for resource, allowed in RESOURCE_PROVINCES.items():
        provinces = {r["geo"] for r in rows if r["resource"] == resource and r["geo"] != "AR"}
        assert provinces and provinces <= allowed, (resource, provinces)
        assert 3 <= len(provinces) <= 8


def test_resources_have_real_units(mock):
    rows = load(mock, "resource_production")
    units = {}
    for r in rows:
        units.setdefault(r["resource"], set()).add(r["unit"])
    assert units == {resource: {unit} for resource, unit in UNITS.items()}


def test_the_national_series_is_the_sum_of_its_provinces(mock):
    rows = load(mock, "resource_production")
    for resource in RESOURCE_PROVINCES:
        national = series(rows, resource=resource, geo="AR")
        provinces = [series(rows, resource=resource, geo=p) for p in RESOURCE_PROVINCES[resource]]
        for year in (2000, 2015, 2025):
            parts = [s.get(year) for s in provinces if year in s]
            if national.get(year) is None or any(v is None for v in parts):
                continue
            assert national[year] == pytest.approx(sum(parts), rel=1e-3), (resource, year)


def test_neuquen_leads_oil_and_lithium_grew_from_almost_nothing(mock):
    rows = load(mock, "resource_production")
    oil_2025 = {p: series(rows, resource="oil", geo=p).get(2025) or 0 for p in RESOURCE_PROVINCES["oil"]}
    assert max(oil_2025, key=oil_2025.get) == "AR-Q"
    lithium = series(rows, resource="lithium", geo="AR")
    assert lithium[2025] > 10 * lithium[2010]


# ---- forecast ---------------------------------------------------------------------------------------------------


def forecast_series(forecast, indicator, geo, scenario, ai, resource=None):
    for s in forecast["series"]:
        if (s["indicator"], s.get("resource"), s["geo"], s["scenario"], s["ai_overlay"]) == (
            indicator, resource, geo, scenario, ai,
        ):
            return s
    raise AssertionError((indicator, geo, scenario, ai, resource))


def test_the_forecast_continues_from_the_last_observed_value(mock):
    economy = load(mock, "economy_series")
    forecast = load(mock, "forecast_output")
    for indicator in ("gdp_per_capita_usd", "population", "hdi"):
        observed = series(economy, country="ARG", indicator=indicator)[2025]
        first = forecast_series(forecast, indicator, "AR", "expected", "off")["points"][0]
        assert first["year"] == 2026
        assert first["p50"] == pytest.approx(observed, rel=0.03), indicator


def test_the_fan_is_asymmetric_and_the_units_are_real(mock):
    forecast = load(mock, "forecast_output")
    s = forecast_series(forecast, "gdp_per_capita_usd", "AR", "expected", "off")
    assert s["unit"] == "USD"
    last = s["points"][-1]
    assert (last["p50"] - last["p10"]) > (last["p90"] - last["p50"])
    assert forecast_series(forecast, "population", "AR", "expected", "off")["unit"] == "personas"
    assert forecast_series(forecast, "hdi", "AR", "expected", "off")["unit"] == "índice"


def test_scenarios_diverge_and_the_ai_overlay_adds_a_visible_but_modest_gain(mock):
    forecast = load(mock, "forecast_output")
    end = lambda scen, ai: forecast_series(  # noqa: E731
        forecast, "gdp_per_capita_usd", "AR", scen, ai)["points"][-1]["p50"]
    assert end("optimistic", "off") > 1.3 * end("pessimistic", "off")
    gain = end("expected", "on") / end("expected", "off") - 1
    assert 0.03 <= gain <= 0.25
    # the overlay changes the economy, not the number of people
    population_off = forecast_series(forecast, "population", "AR", "expected", "off")["points"][-1]["p50"]
    population_on = forecast_series(forecast, "population", "AR", "expected", "on")["points"][-1]["p50"]
    assert population_on == population_off


def test_every_province_has_gdp_gdp_per_capita_and_population_but_no_hdi(mock):
    forecast = load(mock, "forecast_output")
    for province in PROVINCES:
        for indicator in ("gdp_constant_usd", "gdp_per_capita_usd", "population"):
            for scenario in ("pessimistic", "expected", "optimistic"):
                for ai in ("off", "on"):
                    forecast_series(forecast, indicator, province, scenario, ai)
    assert not [s for s in forecast["series"] if s["indicator"] == "hdi" and s["geo"] != "AR"]


def test_province_population_adds_up_to_the_national_p50_in_every_year(mock):
    forecast = load(mock, "forecast_output")
    national = forecast_series(forecast, "population", "AR", "expected", "off")["points"]
    parts = [forecast_series(forecast, "population", p, "expected", "off")["points"] for p in PROVINCES]
    for i in (0, 15, 30):
        assert sum(part[i]["p50"] for part in parts) == pytest.approx(national[i]["p50"], rel=0.005)


def test_resource_forecasts_start_where_the_history_ends(mock):
    rows = load(mock, "resource_production")
    forecast = load(mock, "forecast_output")
    for resource in RESOURCE_PROVINCES:
        observed = series(rows, resource=resource, geo="AR")[2025]
        first = forecast_series(forecast, "resource_production", "AR", "expected", "off", resource)["points"][0]
        assert first["p50"] == pytest.approx(observed, rel=0.15), resource


def test_the_forecast_file_stays_under_the_per_file_data_budget(mock):
    assert (mock / "forecast_output.json").stat().st_size < 1_500_000
    for path in mock.glob("*.json"):
        assert path.stat().st_size < 1_500_000, path.name


# ---- composition, projects, Andes --------------------------------------------------------------------------------


def test_composition_uses_real_sector_and_product_names(mock):
    rows = load(mock, "composition")
    assert not [r for r in rows if "Mock" in r["label"] or "mock" in r["group"].lower()]
    groups = {r["group"] for r in rows if r["kind"] == "exports_by_product"}
    assert {"Agro", "Energía", "Minería", "Industria"} <= groups


def test_projects_have_names_and_sit_in_the_right_provinces(mock):
    projects = load(mock, "projects")
    assert not [p for p in projects if "Mock" in p["name"]]
    for p in projects:
        assert p["geo"] in RESOURCE_PROVINCES[p["resource"]], (p["id"], p["resource"], p["geo"])


def test_andes_route_is_a_coherent_three_week_march_from_east_to_west(mock):
    events = load(mock, "andes_events")
    assert [e["day_of_campaign"] for e in events] == sorted(e["day_of_campaign"] for e in events)
    assert events[0]["day_of_campaign"] == 0 and events[-1]["day_of_campaign"] == 21
    longitudes = [e["lon"] for e in events]
    assert longitudes == sorted(longitudes, reverse=True)
    assert all(-34.0 <= e["lat"] <= -32.0 for e in events)
    assert not [e for e in events if "MOCK" in e["name"]]
    assert all(e["note"] for e in events if e["elevation_m"] is None)
