import pytest
def sort_numbers(arr):
    return sorted(arr)
@pytest.mark.parametrize('input,expected', [
    ([3,1,2], [1,2,3]), ([], []), ([1], [1]), ([5,5,5], [5,5,5]), ([-1,0,1], [-1,0,1])
])
def test_sort(input, expected):
    assert sort_numbers(input) == expected