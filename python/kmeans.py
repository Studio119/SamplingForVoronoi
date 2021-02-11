import numpy as np
from sklearn.cluster import KMeans
import json


with open("./storage/snapshot_Occupation.json", mode='r') as f:
    data = np.array([[d[0], d[1]] for d in json.loads(f.read())['data']])


for num in [50, 100, 150, 200, 300, 500, 800, 1200]:
    print(num)
    estimator = KMeans(n_clusters=num)#构造聚类器
    estimator.fit(data)#聚类
    label_pred = estimator.labels_ #获取聚类标签
    centroids = estimator.cluster_centers_ #获取聚类中心

    groups = [[] for _ in range(num)]

    for i, label in enumerate(label_pred):
        groups[label].append(i)

    with open("./storage/oc_Occupation_{}.json".format(num), mode='w') as f:
        json.dump(groups, f)

    print("done")
