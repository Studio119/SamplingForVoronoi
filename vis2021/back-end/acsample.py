from random import random as rand
import numpy as np
from scipy import stats
import matplotlib.pylab as plt
from normalizate import normalizated_array
import time


def apply_acsample(snapshot, alpha):
    N = len(snapshot)

    # [id, x, y, val]][]
    indexes = [d[0] for d in snapshot]
    values = normalizated_array([[d[1], d[2], d[3]] for d in snapshot], alpha)
    population = [
        [indexes[i], values[i][0], values[i][1], values[i][2]] for i, _ in enumerate(snapshot)
    ]
    sample = []

    build_matrix(population)

    for _ in range(int(N * 0.2)):
        i = int(len(population) * rand())
        item = population.pop(i)
        sample.append(item[0])

    return sample


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
    X, Y, V = np.mgrid[xmin : xmax : 100j, ymin : ymax : 100j, vmin : vmax : 100j]

    positions = np.vstack([X.ravel(), Y.ravel(), V.ravel()])
    values = np.vstack([m1, m2, m3])
    kernel = stats.gaussian_kde(values)
    Z = np.reshape(kernel(positions).T, X.shape)

    time_end = time.time()
    print('size={}, totally cost {}ms'.format(len(population), time_end - time_start))
    print(Z.shape)
    
