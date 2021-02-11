import numpy as np
from sklearn.cluster import KMeans
import json
import sys


# with open("./storage/snapshot_Occupation.json", mode='r') as f:
#     data = np.array([[d[0], d[1]] for d in json.loads(f.read())['data']])


# for num in [50, 100, 150, 200, 300, 500, 800, 1200]:
#     print(num)
#     estimator = KMeans(n_clusters=num)#构造聚类器
#     estimator.fit(data)#聚类
#     label_pred = estimator.labels_ #获取聚类标签
#     centroids = estimator.cluster_centers_ #获取聚类中心

#     groups = [[] for _ in range(num)]

#     for i, label in enumerate(label_pred):
#         groups[label].append(i)

#     with open("./storage/oc_Occupation_{}.json".format(num), mode='w') as f:
#         json.dump(groups, f)

#     print("done")


if __name__ == "__main__":
    path = sys.argv[1]
    k = int(sys.argv[2])
    source = []

    with open("./datasets/" + path + ".json", mode='r') as f:
        source = json.loads(f.read())

    with open("./storage/snapshot_" + path + ".json", mode='r') as f:
        data = np.array([[d[0], d[1]] for d in json.loads(f.read())['data']])

    estimator = KMeans(n_clusters=k)#构造聚类器
    estimator.fit(data)#聚类
    label_pred = estimator.labels_ #获取聚类标签
    centroids = estimator.cluster_centers_ #获取聚类中心

    groups = [[] for _ in range(k)]

    for i, label in enumerate(label_pred):
        groups[label].append(i)

    result = []

    # for d, label in zip(source, label_pred):
    #     result.append({
    #         "id":       d["id"],
    #         "lng":      d["lng"],
    #         "lat":      d["lat"],
    #         "value":    d["value"],
    #         "label":    int(label),
    #         "children": [d["id"]],
    #         "averVal":  d["value"]
    #     })

    for grp, center in zip(groups, centroids):
        _idx, _min = -1, -1
        mean = 0
        for i in grp:
            dist = (data[i][0] - center[0]) ** 2 + (data[i][1] - center[1]) ** 2
            if _idx == -1 or dist < _min:
                _min = dist
                _idx = i
            mean += source[i]["value"]
            pass
        seed = source[_idx]
        result.append({
            "id":       seed["id"],
            "lng":      seed["lng"],
            "lat":      seed["lat"],
            "value":    seed["value"],
            "label":    len(result),
            "children": grp,
            "averVal":  mean / len(grp)
        })

    with open("./storage/km_" + path + "$k=" + sys.argv[2] + ".json", mode='w') as f:
        json.dump(result, f)

    pass
