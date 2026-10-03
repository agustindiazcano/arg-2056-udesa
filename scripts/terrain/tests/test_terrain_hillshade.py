import math

import numpy as np
import pytest
from terrain.hillshade import EARTH_RADIUS_M, hillshade

PIXEL_DEG = 0.001
METERS_PER_DEGREE_LAT = math.pi * EARTH_RADIUS_M / 180


def dx_m(lat):
    return PIXEL_DEG * METERS_PER_DEGREE_LAT * math.cos(math.radians(lat))


def dy_m():
    return PIXEL_DEG * METERS_PER_DEGREE_LAT


def shade(heights, north=0.0025, az=0.0, alt=45.0, z=1.0):
    return hillshade(np.asarray(heights, dtype="float64"), north, PIXEL_DEG, PIXEL_DEG, az, alt, z)


def plane_south_up(slope, size=5):
    """Height rises toward the south (rows increasing): the surface faces north. slope = rise / run."""
    rows = np.arange(size)[:, None] * slope * dy_m()
    return np.repeat(rows, size, axis=1)


def plane_north_up(slope, size=5):
    return plane_south_up(slope, size)[::-1]


def test_shape_dtype_and_range():
    out = shade(np.random.default_rng(1).uniform(0, 100, size=(7, 9)))
    assert out.shape == (7, 9)
    assert out.dtype == np.uint8


@pytest.mark.parametrize("alt", [0.0, 30.0, 45.0, 60.0, 90.0])
def test_flat_terrain_is_exactly_round_255_sin_altitude(alt):
    expected = round(255 * math.sin(math.radians(alt)))
    out = shade(np.full((6, 6), 123.0), alt=alt)
    assert (out == expected).all()


def test_flat_terrain_value_for_the_default_altitude():
    assert (shade(np.zeros((4, 4))) == 180).all()


def test_forty_five_degree_plane_facing_the_sun_is_white_and_away_is_black():
    facing = shade(plane_south_up(1.0))  # sun azimuth 0 (north), altitude 45
    away = shade(plane_north_up(1.0))
    assert (facing == 255).all()  # also the border pixels: planes are exact up to the edge
    assert (away == 0).all()


def test_gentle_plane_exact_values_and_ordering():
    facing = shade(plane_south_up(0.2))
    away = shade(plane_north_up(0.2))
    assert (facing == 212).all()
    assert (away == 141).all()
    assert facing[2, 2] > away[2, 2]


def test_azimuth_is_measured_clockwise_from_north():
    # sun from the east (az 90): a plane rising to the east is the dark side, rising to the west is the bright side
    east_up = np.repeat((np.arange(5)[None, :] * 0.2 * dx_m(0.0)), 5, axis=0)
    assert (shade(east_up, az=90.0)[1:-1, 1:-1] == 141).all()
    assert (shade(east_up[:, ::-1], az=90.0)[1:-1, 1:-1] == 212).all()


def test_z_factor_changes_contrast_monotonically():
    contrasts = []
    for z in (0.5, 1.0, 2.0):  # effective slopes 0.1, 0.2, 0.4
        facing = int(shade(plane_south_up(0.2), z=z)[2, 2])
        away = int(shade(plane_north_up(0.2), z=z)[2, 2])
        contrasts.append((facing, away, facing - away))
    assert contrasts == [(197, 161, 36), (212, 141, 71), (234, 100, 134)]
    assert contrasts[0][2] < contrasts[1][2] < contrasts[2][2]


def test_ground_distance_scales_with_latitude():
    # The same height gradient per pixel to the east is steeper on the ground at 60 degrees north, where a
    # degree of longitude is half as long, so the slope doubles and the east-rising face gets darker.
    gradient_per_pixel = 0.2 * dx_m(0.0)
    plane = np.repeat(np.arange(5)[None, :] * gradient_per_pixel, 5, axis=0)
    equator = shade(plane, north=0.0025, az=90.0)[2, 2]
    sixty = shade(plane, north=60.0025, az=90.0)[2, 2]
    assert equator == 141  # slope 0.2
    assert sixty == 100  # slope 0.4: dx on the ground is cos(60) = 0.5 of the equator value
    assert sixty < equator


def test_single_pixel_input_is_flat():
    assert shade(np.array([[50.0]])).tolist() == [[180]]
