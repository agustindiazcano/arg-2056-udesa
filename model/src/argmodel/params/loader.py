"""Loader and validator for forecasting model parameters."""

import json
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from typing import Any, Literal

from jsonschema import Draft202012Validator

ComponentType = Literal["population", "growth", "hdi", "resources", "provinces", "ai"]
RoleType = Literal["fixed", "calibrated", "random"]
DistributionType = Literal["fixed", "truncated_normal", "triangular", "uniform"]
StateType = Literal["sourced", "assumption", "needs_source"]


class ParamsError(Exception):
    """Raised when parameters cannot be loaded, parsed, or validated."""


@dataclass(frozen=True)
class Param:
    """Represents a single model parameter definition."""

    name: str
    symbol: str
    value: float | None
    unit: str
    distribution: DistributionType
    low: float | None
    high: float | None
    source_id: str | None
    assumption: bool
    justification: str
    component: ComponentType
    role: RoleType
    needs_source: bool
    assumption_id: str | None

    @property
    def state(self) -> StateType:
        if self.source_id is not None and not self.assumption and not self.needs_source:
            return "sourced"
        if self.source_id is None and self.assumption and not self.needs_source:
            return "assumption"
        if self.source_id is None and not self.assumption and self.needs_source:
            return "needs_source"
        raise ParamsError(f"Invalid state combination for parameter {self.name}")


def _default_paths() -> tuple[Path, Path]:
    base_dir = Path(__file__).resolve().parents[3] / "params"
    return base_dir / "params.json", base_dir / "params.schema.json"


def load_params(path: str | Path | None = None) -> Mapping[str, Param]:
    """
    Loads, schema-validates, and verifies model parameters.

    Args:
        path: Optional file path to params.json. Defaults to model/params/params.json.

    Returns:
        Immutable mapping of Param instances indexed by name.

    Raises:
        ParamsError: If the file is missing, contains invalid JSON, fails schema validation,
                     or violates cross-field consistency rules.
    """
    default_data_path, schema_path = _default_paths()
    target_path = Path(path) if path is not None else default_data_path

    if not target_path.exists():
        raise ParamsError(f"Parameters file not found: {target_path}")

    try:
        with open(target_path, encoding="utf-8") as f:
            raw_data = json.load(f)
    except json.JSONDecodeError as e:
        raise ParamsError(f"Invalid JSON in {target_path}: {e}") from e

    if not schema_path.exists():
        raise ParamsError(f"Parameters schema file not found: {schema_path}")

    try:
        with open(schema_path, encoding="utf-8") as f:
            schema = json.load(f)
    except json.JSONDecodeError as e:
        raise ParamsError(f"Invalid schema JSON in {schema_path}: {e}") from e

    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(raw_data), key=lambda err: err.path)
    if errors:
        first_error = errors[0]
        path_str = ".".join(str(p) for p in first_error.path)
        raise ParamsError(f"Schema validation error at {path_str}: {first_error.message}")

    if not isinstance(raw_data, list):
        raise ParamsError("Parameters root must be a list of objects")

    params_dict: dict[str, Param] = {}
    seen_names: set[str] = set()

    for item in raw_data:
        name = item["name"]
        if name in seen_names:
            raise ParamsError(f"Duplicate parameter name: {name}")
        seen_names.add(name)

        low = item["low"]
        high = item["high"]
        value = item["value"]

        if low is not None and high is not None and low > high:
            raise ParamsError(f"Parameter '{name}': low ({low}) must be <= high ({high})")

        if value is not None:
            if low is not None and value < low:
                raise ParamsError(f"Parameter '{name}': value ({value}) must be >= low ({low})")
            if high is not None and value > high:
                raise ParamsError(f"Parameter '{name}': value ({value}) must be <= high ({high})")

        param = Param(
            name=name,
            symbol=item["symbol"],
            value=value,
            unit=item["unit"],
            distribution=item["distribution"],
            low=low,
            high=high,
            source_id=item["source_id"],
            assumption=item["assumption"],
            justification=item["justification"],
            component=item["component"],
            role=item["role"],
            needs_source=item["needs_source"],
            assumption_id=item["assumption_id"],
        )
        params_dict[name] = param

    return MappingProxyType(params_dict)


def get(name: str, path: str | Path | None = None) -> Param:
    """Retrieves a single parameter by name, raising KeyError if not found."""
    params = load_params(path)
    if name not in params:
        raise KeyError(f"Parameter '{name}' not found in registry")
    return params[name]


def by_component(component: ComponentType, path: str | Path | None = None) -> tuple[Param, ...]:
    """Retrieves all parameters for a specific component as a tuple."""
    params = load_params(path)
    return tuple(p for p in params.values() if p.component == component)


def summary(path: str | Path | None = None) -> dict[str, Any]:
    """
    Computes summary counts across components, roles, and states.

    Returns:
        dict containing total count and breakdown by component, role, and state.
    """
    params = load_params(path)

    by_comp: dict[str, int] = {
        "population": 0,
        "growth": 0,
        "hdi": 0,
        "resources": 0,
        "provinces": 0,
        "ai": 0,
    }
    by_r: dict[str, int] = {
        "fixed": 0,
        "calibrated": 0,
        "random": 0,
    }
    by_st: dict[str, int] = {
        "sourced": 0,
        "assumption": 0,
        "needs_source": 0,
    }

    for p in params.values():
        by_comp[p.component] += 1
        by_r[p.role] += 1
        by_st[p.state] += 1

    return {
        "total": len(params),
        "by_component": by_comp,
        "by_role": by_r,
        "by_state": by_st,
    }
