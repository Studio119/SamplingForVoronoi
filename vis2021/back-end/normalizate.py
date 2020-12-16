
def normalizated_array(array, alpha=1):
    m1 = [d[0] for d in array]
    m2 = [d[1] for d in array]
    m3 = [d[2] for d in array]
    xmin = min(m1)
    xmax = max(m1)
    ymin = min(m2)
    ymax = max(m2)
    vmin = min(m3)
    vmax = max(m3)
    vp = vmax - vmin
    step = ((xmax - xmin) ** 2 + (ymax - ymin) ** 2) ** 0.5 * alpha

    return [[d[0], d[1], (d[2] - vmin) / vp * step] for d in array]
