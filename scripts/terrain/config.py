import json
import re
from dataclasses import dataclass
from pathlib import Path

from . import TerrainError


class ConfigError(TerrainError):
    pass


@dataclass(frozen=True)
class Region:
    id: str
    bbox: tuple[float, float, float, float]
    max_size: int


@dataclass(frozen=True)
class Hillshade:
    azimuth_deg: float
    altitude_deg: float
    z_factor: float


@dataclass(frozen=True)
class Config:
    dem_dataset_id: str
    regions: tuple[Region, ...]
    hillshade: Hillshade
    max_bytes_per_region: int


REGION_ID = re.compile(r"^[a-z0-9_]+$")
TOP_FIELDS = ("dem_dataset_id", "regions", "hillshade", "max_bytes_per_region")
REGION_FIELDS = ("id", "bbox", "max_size")
HILLSHADE_FIELDS = ("azimuth_deg", "altitude_deg", "z_factor")


def _is_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_int(value) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _check_fields(doc: dict, allowed: tuple[str, ...], where: str) -> None:
    suffix = f" in {where}" if where else ""
    for field in allowed:
        if field not in doc:
            raise ConfigError(f"missing field {field}{suffix}")
    for field in doc:
        if field not in allowed:
            raise ConfigError(f"unknown field {field}{suffix}")


def _parse_region(raw) -> Region:
    if not isinstance(raw, dict):
        raise ConfigError("each region must be an object")
    rid = raw.get("id")
    if "id" in raw and (not isinstance(rid, str) or not REGION_ID.match(rid)):
        raise ConfigError(f"invalid region id {rid!r}: must match ^[a-z0-9_]+$")
    _check_fields(raw, REGION_FIELDS, f"region {rid}")

    bbox = raw["bbox"]
    if not isinstance(bbox, list) or len(bbox) != 4 or not all(_is_number(v) for v in bbox):
        raise ConfigError(f"region {rid}: bbox must have 4 numbers [west, south, east, north]")
    west, south, east, north = (float(v) for v in bbox)
    if not (-180.0 <= west <= 180.0 and -180.0 <= east <= 180.0):
        raise ConfigError(f"region {rid}: longitude out of range -180..180")
    if not (-90.0 <= south <= 90.0 and -90.0 <= north <= 90.0):
        raise ConfigError(f"region {rid}: latitude out of range -90..90")
    if not west < east:
        raise ConfigError(f"region {rid}: west must be less than east")
    if not south < north:
        raise ConfigError(f"region {rid}: south must be less than north")

    max_size = raw["max_size"]
    if not _is_int(max_size) or not 64 <= max_size <= 4096:
        raise ConfigError(f"region {rid}: max_size must be an integer between 64 and 4096")
    return Region(id=rid, bbox=(west, south, east, north), max_size=max_size)


def load_config(path: Path) -> Config:
    path = Path(path)
    if not path.exists():
        raise ConfigError(f"config file not found: {path}")
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ConfigError(f"config file is not valid JSON: {exc}") from exc
    if not isinstance(doc, dict):
        raise ConfigError("config must be a JSON object")
    _check_fields(doc, TOP_FIELDS, "")

    dataset_id = doc["dem_dataset_id"]
    if not isinstance(dataset_id, str) or not dataset_id:
        raise ConfigError("dem_dataset_id must be a non-empty string")

    raw_regions = doc["regions"]
    if not isinstance(raw_regions, list) or not raw_regions:
        raise ConfigError("regions must be a non-empty list")
    regions = []
    seen = set()
    for raw in raw_regions:
        region = _parse_region(raw)
        if region.id in seen:
            raise ConfigError(f"duplicate region id {region.id}")
        seen.add(region.id)
        regions.append(region)

    raw_shade = doc["hillshade"]
    if not isinstance(raw_shade, dict):
        raise ConfigError("hillshade must be an object")
    _check_fields(raw_shade, HILLSHADE_FIELDS, "hillshade")
    for field in HILLSHADE_FIELDS:
        if not _is_number(raw_shade[field]):
            raise ConfigError(f"hillshade.{field} must be a number")
    hillshade = Hillshade(
        azimuth_deg=raw_shade["azimuth_deg"],
        altitude_deg=raw_shade["altitude_deg"],
        z_factor=raw_shade["z_factor"],
    )

    max_bytes = doc["max_bytes_per_region"]
    if not _is_int(max_bytes) or max_bytes <= 0:
        raise ConfigError("max_bytes_per_region must be a positive integer")

    return Config(
        dem_dataset_id=dataset_id,
        regions=tuple(regions),
        hillshade=hillshade,
        max_bytes_per_region=max_bytes,
    )
