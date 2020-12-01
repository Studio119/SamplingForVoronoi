from sklearn.cluster import KMeans
import json
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
import math
import sys


def millerToXY(lon, lat):
    """
    :param lon: 经度
    :param lat: 维度
    :return:
    """
    xy_coordinate = []
    L = 6381372 * math.pi * 2  # 地球周长
    W = L  # 平面展开，将周长视为X轴
    H = L / 2  # Y轴约等于周长一般
    mill = 2.3  # 米勒投影中的一个常数，范围大约在正负2.3之间
    x = lon * math.pi / 180  # 将经度从度数转换为弧度
    y = lat * math.pi / 180
    y = 1.25 * math.log(math.tan(0.25 * math.pi + 0.4 * y))  # 这里是米勒投影的转换

    # 这里将弧度转为实际距离 ，转换结果的单位是公里
    x = (W / 2) + (W / (2 * math.pi)) * x
    y = (H / 2) - (H / (2 * mill)) * y
    return [x, y]


if __name__ == '__main__':
    with open('./storage/Occupation.json', mode='r', encoding='utf8') as f:
        temp = json.load(f)
        clusters = int(sys.argv[1])
        points = np.array([[d['lng'], d['lat']] for d in temp])
        print(points)
        model = KMeans(n_clusters=clusters, init='k-means++').fit(points)
        count = []
        dicts = []

        for i in range(clusters):
            count.append(0)
        for i, label in enumerate(model.labels_):
            count[label] += 1
            dicts.append({
                'id': i,
                'label': int(label)
            })
        points = np.array(points)
        # plt.scatter(points[:, 0], points[:, 1], c=model.labels_)
        # plt.show()
        for i in range(clusters):
            print(count[i])
        with open('./storage/k_temp.json', mode='w', encoding='utf8') as f:
            json.dump(dicts, f)