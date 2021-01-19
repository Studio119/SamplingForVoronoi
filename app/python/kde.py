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
    X, Y = np.mgrid[xmin : xmax : 2, ymin : ymax : 2]

    positions = np.vstack([X.ravel(), Y.ravel()])
    values = np.vstack([m1, m2])
    kernel = stats.gaussian_kde(values)
    Z = np.reshape(kernel(positions).T, X.shape)

    time_end = time.time()

    kde = [kernel([p[1], p[2]])[0] for p in population]
    m4 = np.asarray(kde)
    indexes = [p[0] for p in population]
    mid = np.asarray(indexes)

    matrix = np.vstack([mid, m1, m2, m3, m4])

    return matrix.T
    


def normalizated_array(array):
    m3 = [d[2] for d in array]
    vmin = min(m3)
    vmax = max(m3)
    vp = vmax - vmin

    return [[d[0], d[1], (d[2] - vmin) / vp] for d in array]
    


if __name__ == "__main__":
    
    filename_origin = sys.argv[1]
    
    with open("./storage/snapshot_" + filename_origin, mode='r') as f:
        snapshot = json.load(f)
        data_snapshot = snapshot['data']

    # [id, x, y, val]][]
    indexes = [d[0] for d in data_snapshot]
    values = normalizated_array([[d[1], d[2], d[3]] for d in data_snapshot])
    population = [
        [indexes[i], values[i][0], values[i][1], values[i][2]] for i, _ in enumerate(data_snapshot)
    ]

    matrix = build_matrix(population)
    
    with open("./storage/kde_" + filename_origin, mode='w') as fout:
        json.dump({
            "population": population,
            "matrix": matrix.tolist()
        }, fout)

    print(0)    # 程序运行完成

    pass


def get_kde(filename_origin, n_steps):
    
    with open("./storage/snapshot_" + filename_origin, mode='r') as f:
        snapshot = json.load(f)
        data_snapshot = snapshot['data']

    # [id, x, y, val]][]
    indexes = [d[0] for d in data_snapshot]
    values = normalizated_array([[d[1], d[2], d[3]] for d in data_snapshot])
    population = [
        [indexes[i], values[i][0], values[i][1], values[i][2]] for i, _ in enumerate(data_snapshot)
    ]

    data = []
    
    for i in range(n_steps):
        start = i / n_steps
        end = (i + 1) / n_steps
        plist = [p for p in population if start <= p[3] < end]
        matrix = build_matrix(plist)
        data.append({
            "population": plist,
            "matrix": matrix.tolist()
        })

    return data
