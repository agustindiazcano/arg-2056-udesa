import numpy as np
import pytest
from terrain.encode import decode_terrarium, encode_terrarium

from terrain import TerrainError


def test_exact_rgb_bytes_for_hand_computed_values():
    # value = height + 32768; R = floor(value / 256); G = floor(value) % 256; B = floor(frac * 256)
    heights = np.array([[0.0, -100.0, 0.5, 6962.0]])
    rgb = encode_terrarium(heights)
    assert rgb.dtype == np.uint8
    assert rgb.shape == (1, 4, 3)
    # 0 m: 32768 -> R=128, G=0, B=0
    assert rgb[0, 0].tolist() == [128, 0, 0]
    # -100 m: 32668 -> R=127 (127*256=32512), G=156, B=0
    assert rgb[0, 1].tolist() == [127, 156, 0]
    # 0.5 m: 32768.5 -> R=128, G=0, B=128
    assert rgb[0, 2].tolist() == [128, 0, 128]
    # 6962 m: 39730 -> R=155 (155*256=39680), G=50, B=0
    assert rgb[0, 3].tolist() == [155, 50, 0]


def test_extremes_of_the_range_encode_exactly():
    rgb = encode_terrarium(np.array([[-32768.0, 32767.0]]))
    assert rgb[0, 0].tolist() == [0, 0, 0]
    assert rgb[0, 1].tolist() == [255, 255, 0]


def test_heights_are_rounded_to_the_nearest_256th_of_a_meter():
    # 1/512 is exactly half a step: ties round to even, so 1/512 -> 0 and 3/512 -> 2/256
    rgb = encode_terrarium(np.array([[1 / 512, 3 / 512, 0.0019]]))
    decoded = decode_terrarium(rgb)
    assert decoded[0, 0] == 0.0
    assert decoded[0, 1] == 2 / 256
    assert decoded[0, 2] == 0.0  # 0.0019 m is 0.49 of a step


@pytest.mark.parametrize("height", [-100.0, 0.0, 0.5, 4999.996, 6962.0, -32768.0, 32767.0, 123.456])
def test_round_trip_is_within_one_256th_of_a_meter(height):
    decoded = decode_terrarium(encode_terrarium(np.array([[height]])))
    assert abs(decoded[0, 0] - height) <= 1 / 256


def test_round_trip_of_values_on_the_grid_is_exact():
    heights = np.array([[k / 256 for k in range(-1000, 1000, 37)]])
    np.testing.assert_array_equal(decode_terrarium(encode_terrarium(heights)), heights)


@pytest.mark.parametrize("bad", [-32768.01, 32767.01, 40000.0, -50000.0, 32767.999])
def test_out_of_range_heights_fail(bad):
    with pytest.raises(TerrainError, match="outside the range -32768..32767"):
        encode_terrarium(np.array([[0.0, bad]]))


def test_nan_heights_fail():
    with pytest.raises(TerrainError, match="not finite"):
        encode_terrarium(np.array([[0.0, np.nan]]))
