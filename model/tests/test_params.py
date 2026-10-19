"""Tests for forecasting model parameter registry, schema, and loader."""

import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from argmodel.params import (
    Param,
    ParamsError,
    by_component,
    get,
    load_params,
    summary,
)

EXPECTED_PARAM_IDS = [
    # population (5)
    "pop.tfr_target",
    "pop.kappa_f",
    "pop.e0_max",
    "pop.kappa_e",
    "pop.mig_rate",
    # growth (5)
    "gro.alpha",
    "gro.delta",
    "gro.rho",
    "gro.s",
    "gro.gA",
    # hdi (2)
    "hdi.educ_target",
    "hdi.kappa_educ",
    # resources (20)
    "res.pi_a",
    "res.pi_b",
    "res.delay",
    "res.util",
    "res.ramp",
    "res.decline_oil",
    "res.decline_gas",
    "res.yield_g_soy",
    "res.yield_g_wheat",
    "res.yield_g_corn",
    "res.va_unit_lithium",
    "res.va_unit_copper",
    "res.va_unit_gold",
    "res.va_unit_silver",
    "res.va_unit_oil",
    "res.va_unit_gas",
    "res.va_unit_soy",
    "res.va_unit_wheat",
    "res.va_unit_corn",
    "res.va_unit_other",
    # provinces (1)
    "prov.kappa",
    # ai (2)
    "ai.delta",
    "ai.lag",
]

DESIGN_RANGES = {
    "pop.tfr_target": (1.2, 2.1),
    "pop.kappa_f": (0.02, 0.10),
    "pop.e0_max": (85.0, 90.0),
    "pop.kappa_e": (0.01, 0.04),
    "pop.mig_rate": (-1.0, 2.0),
    "gro.alpha": (0.30, 0.45),
    "gro.delta": (0.03, 0.08),
    "gro.rho": (0.0, 0.5),
    "gro.s": (0.12, 0.25),
    "gro.gA": (-0.005, 0.020),
    "hdi.educ_target": (0.85, 1.00),
    "hdi.kappa_educ": (0.01, 0.05),
    "res.delay": (0.0, 6.0),
    "res.util": (0.5, 1.0),
    "res.ramp": (1.0, 5.0),
    "res.yield_g_soy": (-0.005, 0.020),
    "res.yield_g_wheat": (-0.005, 0.020),
    "res.yield_g_corn": (-0.005, 0.020),
    "prov.kappa": (0.0, 1.0),
    "ai.lag": (5.0, 15.0),
}


def _schema() -> dict:
    schema_path = Path(__file__).resolve().parents[1] / "params" / "params.schema.json"
    with open(schema_path, encoding="utf-8") as f:
        return json.load(f)


def _validator() -> Draft202012Validator:
    return Draft202012Validator(_schema())


def _make_base_entry(**kwargs) -> dict:
    base = {
        "name": "pop.tfr_target",
        "symbol": "TFR_T",
        "value": None,
        "unit": "births per woman",
        "distribution": "triangular",
        "low": 1.2,
        "high": 2.1,
        "source_id": None,
        "assumption": True,
        "justification": "Fertility bracket assumption.",
        "component": "population",
        "role": "random",
        "needs_source": False,
        "assumption_id": "A01",
    }
    base.update(kwargs)
    return base


class TestSchemaValidation:
    """Verifies that params.schema.json accepts valid states and rejects each invalid state."""

    def test_accepts_valid_assumption_entry(self):
        val = _validator()
        entry = _make_base_entry()
        assert val.is_valid([entry])

    def test_accepts_valid_sourced_entry(self):
        val = _validator()
        entry = _make_base_entry(
            source_id="wb:SP.DYN.TFRT.IN",
            assumption=False,
            needs_source=False,
            assumption_id=None,
        )
        assert val.is_valid([entry])

    def test_accepts_valid_needs_source_entry(self):
        val = _validator()
        entry = _make_base_entry(
            name="res.pi_a",
            symbol="a",
            value=None,
            unit="logit",
            distribution="fixed",
            low=None,
            high=None,
            source_id=None,
            assumption=False,
            needs_source=True,
            component="resources",
            role="fixed",
            assumption_id="A17",
        )
        assert val.is_valid([entry])

    def test_rejects_missing_required_property(self):
        val = _validator()
        entry = _make_base_entry()
        del entry["symbol"]
        errors = list(val.iter_errors([entry]))
        assert any("symbol" in e.message for e in errors)

    def test_rejects_additional_properties(self):
        val = _validator()
        entry = _make_base_entry(extra_field="disallowed")
        errors = list(val.iter_errors([entry]))
        assert any("extra_field" in e.message for e in errors)

    def test_rejects_invalid_component(self):
        val = _validator()
        entry = _make_base_entry(component="finance")
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_invalid_role(self):
        val = _validator()
        entry = _make_base_entry(role="hypothetical")
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_invalid_distribution(self):
        val = _validator()
        entry = _make_base_entry(distribution="cauchy")
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_both_source_id_and_assumption(self):
        val = _validator()
        entry = _make_base_entry(source_id="wb:SP.DYN.TFRT.IN", assumption=True)
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_neither_source_id_nor_assumption_nor_needs_source(self):
        val = _validator()
        entry = _make_base_entry(source_id=None, assumption=False, needs_source=False)
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_needs_source_with_source_id(self):
        val = _validator()
        entry = _make_base_entry(
            source_id="wb:SP.DYN.TFRT.IN",
            assumption=False,
            needs_source=True,
        )
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_needs_source_with_non_null_value(self):
        val = _validator()
        entry = _make_base_entry(
            value=1.5,
            source_id=None,
            assumption=False,
            needs_source=True,
        )
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_needs_source_with_non_null_range(self):
        val = _validator()
        entry = _make_base_entry(
            low=1.0,
            high=2.0,
            source_id=None,
            assumption=False,
            needs_source=True,
        )
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_random_role_with_fixed_distribution(self):
        val = _validator()
        entry = _make_base_entry(role="random", distribution="fixed")
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_fixed_role_with_non_fixed_distribution(self):
        val = _validator()
        entry = _make_base_entry(role="fixed", distribution="triangular")
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0

    def test_rejects_random_role_with_null_range_when_not_needs_source(self):
        val = _validator()
        entry = _make_base_entry(role="random", low=None, high=None)
        errors = list(val.iter_errors([entry]))
        assert len(errors) > 0


class TestParamsDataset:
    """Verifies that the canonical params.json matches all specifications in model-design.md."""

    def test_params_json_has_exact_35_ids_in_exact_list(self):
        params = load_params()
        assert len(params) == 35
        assert list(params.keys()) == EXPECTED_PARAM_IDS

    def test_params_summary_matches_design_table(self):
        s = summary()
        assert s["total"] == 35
        assert s["by_component"] == {
            "population": 5,
            "growth": 5,
            "hdi": 2,
            "resources": 20,
            "provinces": 1,
            "ai": 2,
        }
        assert s["by_role"] == {
            "fixed": 23,
            "calibrated": 1,
            "random": 11,
        }
        assert s["by_state"] == {
            "sourced": 0,
            "assumption": 20,
            "needs_source": 15,
        }

    def test_every_design_range_is_exactly_transcribed(self):
        params = load_params()
        for name, (expected_low, expected_high) in DESIGN_RANGES.items():
            param = params[name]
            assert param.low == pytest.approx(expected_low), f"{name}: low mismatch"
            assert param.high == pytest.approx(expected_high), f"{name}: high mismatch"

    def test_no_entry_has_source_id_today(self):
        # When verifiable sources arrive, this test will be updated with the newly sourced IDs.
        params = load_params()
        for name, param in params.items():
            assert param.source_id is None, f"{name} unexpectedly has source_id"

    def test_every_assumption_id_exists_in_assumptions_md(self):
        assumptions_file = Path(__file__).resolve().parents[2] / "docs" / "assumptions.md"
        with open(assumptions_file, encoding="utf-8") as f:
            content = f.read()

        params = load_params()
        for name, param in params.items():
            if param.assumption_id is not None:
                assert f"| {param.assumption_id} |" in content, (
                    f"Parameter {name} has assumption_id {param.assumption_id} "
                    "not found in docs/assumptions.md"
                )

    def test_all_parameters_are_in_a_valid_state(self):
        params = load_params()
        for name, param in params.items():
            assert param.state in ("sourced", "assumption", "needs_source")
            if param.state == "assumption":
                assert param.assumption is True
                assert param.source_id is None
                assert param.needs_source is False
            elif param.state == "needs_source":
                assert param.needs_source is True
                assert param.assumption is False
                assert param.source_id is None
            elif param.state == "sourced":
                assert param.source_id is not None
                assert param.assumption is False
                assert param.needs_source is False


class TestParamsLoader:
    """Verifies loader error handling, accessors, and immutability."""

    def test_loader_raises_on_missing_file(self, tmp_path):
        missing = tmp_path / "nonexistent.json"
        with pytest.raises(ParamsError, match="not found"):
            load_params(missing)

    def test_loader_raises_on_invalid_json(self, tmp_path):
        bad_file = tmp_path / "bad.json"
        bad_file.write_text("{invalid json", encoding="utf-8")
        with pytest.raises(ParamsError, match="Invalid JSON"):
            load_params(bad_file)

    def test_loader_raises_on_duplicate_name(self, tmp_path):
        dup_file = tmp_path / "dup.json"
        entry = _make_base_entry()
        dup_file.write_text(json.dumps([entry, entry]), encoding="utf-8")
        with pytest.raises(ParamsError, match="Duplicate parameter name"):
            load_params(dup_file)

    def test_loader_raises_when_low_greater_than_high(self, tmp_path):
        bad_file = tmp_path / "inverted.json"
        entry = _make_base_entry(low=2.5, high=1.5)
        bad_file.write_text(json.dumps([entry]), encoding="utf-8")
        with pytest.raises(ParamsError, match="must be <= high"):
            load_params(bad_file)

    def test_loader_raises_when_value_below_low(self, tmp_path):
        bad_file = tmp_path / "below.json"
        entry = _make_base_entry(value=0.5, low=1.0, high=2.0)
        bad_file.write_text(json.dumps([entry]), encoding="utf-8")
        with pytest.raises(ParamsError, match="must be >= low"):
            load_params(bad_file)

    def test_loader_raises_when_value_above_high(self, tmp_path):
        bad_file = tmp_path / "above.json"
        entry = _make_base_entry(value=3.0, low=1.0, high=2.0)
        bad_file.write_text(json.dumps([entry]), encoding="utf-8")
        with pytest.raises(ParamsError, match="must be <= high"):
            load_params(bad_file)

    def test_get_accessor(self):
        param = get("pop.tfr_target")
        assert isinstance(param, Param)
        assert param.name == "pop.tfr_target"
        assert param.symbol == "TFR_T"

    def test_get_raises_key_error_for_unknown_id(self):
        with pytest.raises(KeyError, match="unknown.param"):
            get("unknown.param")

    def test_by_component_accessor(self):
        pop_params = by_component("population")
        assert len(pop_params) == 5
        assert all(p.component == "population" for p in pop_params)

    def test_load_params_is_immutable(self):
        params = load_params()
        with pytest.raises((TypeError, AttributeError)):
            params["pop.tfr_target"] = None  # type: ignore[index]
