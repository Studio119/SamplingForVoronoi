import sys
import numpy as np
import time
import json
from scipy import stats



""" 生成核密度矩阵 （耗时长） """
def build_matrix(population):
    time_start = time.time()
    a1 = []
    a2 = []
    a3 = []
    for p in population:
        a1.append(p[1])
        a2.append(p[2])
        a3.append(p[3])
    m1 = np.asarray(a1)
    m2 = np.asarray(a2)
    m3 = np.asarray(a3)
    xmin = m1.min()
    xmax = m1.max()
    ymin = m2.min()
    ymax = m2.max()
    vmin = m3.min()
    vmax = m3.max()
    X, Y, V = np.mgrid[xmin : xmax : 2, ymin : ymax : 2, vmin : vmax : 16j]    # 复数的步长代表分段数

    positions = np.vstack([X.ravel(), Y.ravel(), V.ravel()])
    values = np.vstack([m1, m2, m3])
    kernel = stats.gaussian_kde(values)
    Z = np.reshape(kernel(positions).T, X.shape)

    time_end = time.time()
    print('size={}, totally cost {}s'.format(len(population), time_end - time_start))

    kde = [kernel([p[1], p[2], p[3]])[0] for p in population]
    m4 = np.asarray(kde)
    indexes = [p[0] for p in population]
    mid = np.asarray(indexes)

    matrix = np.vstack([mid, m1, m2, m3, m4])

    return matrix.T
    


def normalizated_array(array, size, alpha=1):
    m3 = [d[2] for d in array]
    vmin = min(m3)
    vmax = max(m3)
    vp = vmax - vmin
    step = (size[0] ** 2 + size[1] ** 2) ** 0.5 * alpha

    return [[d[0], d[1], (d[2] - vmin) / vp * step] for d in array]



if __name__ == "__main__":
    
    filename_origin = sys.argv[1]
    alpha = float(sys.argv[2])
    
    with open("../storage/snapshot_" + filename_origin, mode='r') as f:
        snapshot = json.load(f)
        width = snapshot['width']
        height = snapshot['height']
        data_snapshot = snapshot['data']

    # [id, x, y, val]][]
    indexes = [d[0] for d in data_snapshot]
    values = normalizated_array([[d[1], d[2], d[3]] for d in data_snapshot], (width, height), alpha)
    population = [
        [indexes[i], values[i][0], values[i][1], values[i][2]] for i, _ in enumerate(data_snapshot)
    ]

    matrix = build_matrix(population)
    
    with open("../storage/kde_" + filename_origin, mode='w') as fout:
        json.dump({
            "population": population,
            "matrix": matrix.tolist()
        }, fout)

    print(0)    # 程序运行完成

    pass

