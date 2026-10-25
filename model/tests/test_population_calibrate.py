import io
import tokenize
from pathlib import Path

import pytest
from argmodel.params import get
from argmodel.population.calibrate import calibrate_kappa_f
from argmodel.population.drivers import tfr_path

SRC = Path(__file__).resolve().parent.parent / "src" / "argmodel" / "population"


def synthetic(kappa, tfr_0=4.0, tfr_target=1.8, first=1990, last=2005):
    path = tfr_path(tfr_0, tfr_target, kappa, last - first)
    return {first + i: float(v) for i, v in enumerate(path)}


def test_recovers_a_known_kappa():
    observed = synthetic(0.05)
    assert calibrate_kappa_f(observed, 4.0, 1.8, 2005) == pytest.approx(0.05, abs=1e-6)


def test_a_value_after_the_cutoff_cannot_change_the_result():
    observed = synthetic(0.05, last=2015)
    base = calibrate_kappa_f(observed, 4.0, 1.8, 2005)
    observed[2012] = 9.0
    assert calibrate_kappa_f(observed, 4.0, 1.8, 2005) == base


def test_a_gap_inside_the_training_window_is_rejected():
    observed = synthetic(0.05)
    observed[1998] = None
    with pytest.raises(ValueError, match="calibrate_kappa_f: observed TFR is missing for year 1998"):
        calibrate_kappa_f(observed, 4.0, 1.8, 2005)


def test_a_gap_after_the_cutoff_is_not_an_error():
    observed = synthetic(0.05, last=2010)
    observed[2008] = None
    assert calibrate_kappa_f(observed, 4.0, 1.8, 2005) == pytest.approx(0.05, abs=1e-6)


def test_the_result_stays_inside_the_bracket_of_the_parameter():
    p = get("pop.kappa_f")
    fast = calibrate_kappa_f(synthetic(0.5), 4.0, 1.8, 2005)
    slow = calibrate_kappa_f(synthetic(0.001), 4.0, 1.8, 2005)
    assert p.low <= slow <= fast <= p.high
    assert fast == p.high
    assert slow == p.low


def test_needs_at_least_two_years_in_the_window():
    with pytest.raises(ValueError, match="calibrate_kappa_f: needs at least 2 years up to 2005"):
        calibrate_kappa_f({2005: 3.0}, 3.0, 1.8, 2005)


ALLOWED = {0, 1, 2, 1000}


def numeric_literals(path):
    """Numeric literals of a source file outside strings and comments, with the line, skipping the definitions of named constants."""
    source = path.read_text(encoding="utf-8")
    found = []
    for tok in tokenize.generate_tokens(io.StringIO(source).readline):
        if tok.type != tokenize.NUMBER:
            continue
        line = tok.line.strip()
        head = line.split("=")[0].strip().split(":")[0].strip()
        if "=" in line and head.isupper() and head.replace("_", "").isalnum():
            continue
        value = float(tok.string.replace("_", ""))
        if value not in ALLOWED:
            found.append((tok.start[0], tok.string, line))
    return found


@pytest.mark.parametrize("name", ["drivers.py", "projection.py", "calibrate.py"])
def test_no_literal_parameter_in_the_code(name):
    bad = numeric_literals(SRC / name)
    assert not bad, f"{name}: numeric literal outside a named constant: " + "; ".join(f"line {n}: {s} in `{line}`" for n, s, line in bad)


def test_the_literal_check_catches_a_literal(tmp_path):
    f = tmp_path / "x.py"
    f.write_text("RATE = 0.05\nvalue = x * 0.07\n", encoding="utf-8")
    assert [s for _, s, _ in numeric_literals(f)] == ["0.07"]
