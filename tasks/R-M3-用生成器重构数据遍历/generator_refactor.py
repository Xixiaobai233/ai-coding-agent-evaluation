def process_data(data):
    return [transform(x) for x in data if x is not None]
def transform(x):
    return {'value': x * 2, 'squared': x ** 2}