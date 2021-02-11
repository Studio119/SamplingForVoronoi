import sys
import json
from real_time_log import log
import numpy as np
from sklearn.cluster import KMeans


class SKMeans:

  def __init__(self, r_val):
    self.r_val = r_val
    self.nodes = []
    self.cache_by_val = []
    self.hash = None

  def _normalize(self, points):
    self.nodes = []
    self.cache_by_val = []
    self.hash = None
    
    val_min = points[0][3]
    val_max = points[0][3]

    for p in points[1:]:
      val_min = min(val_min, p[3])
      val_max = max(val_max, p[3])
      
    for p in points:
      self.nodes.append({
        "id": int(p[0]),
        "x":  p[1],
        "y":  p[2],
        "v":  (p[3] - val_min) / (val_max - val_min)
      })

    return

  def _walk(self, k):
    # init
    
    each_level = []
    count_all = 0
    for i, level in enumerate(self.cache_by_val):
      if len(level):
        # 先保证属性值对应的每一层都有一个种子点
        start = max(1, int(len(level) * k / len(self.nodes)) - 1)
        each_level.append([i, len(level), start]) # [层索引, 原始大小, 已放入种子]
        count_all += start
      else:
        each_level.append([i, 0, 0])
    # 补足
    while count_all < k:
      # 找出比例差距最大的一组，增加一个点
      _i, _min = -1, -1
      for i, level in enumerate(each_level):
        cur_num = level[2]
        if cur_num == level[1]:
          # 已经取完
          continue
        target_num = len(level) * k / len(self.nodes)
        dif = (target_num - cur_num) / level[1]
        if _i == -1 or dif < _min:
          _i = i
          _min = dif
      # 取点
      each_level[_i][2] += 1
      count_all += 1
    print(each_level)

    groups = []
    centers = []

    for i, level in enumerate(self.cache_by_val):
      print(i, len(level), each_level[i][2])
      if len(level):
        data = np.array([[self.nodes[i]["x"], self.nodes[i]["y"]] for i in level])
        k = each_level[i][2]
        if k == 1:
          groups.append(level)
          x, y = 0, 0
          for i in level:
            x += self.nodes[i]["x"]
            y += self.nodes[i]["y"]
          centers.append([x / len(level), y / len(level)])
        else:
          estimator = KMeans(n_clusters=k)#构造聚类器
          estimator.fit(data)#聚类
          label_pred = estimator.labels_ #获取聚类标签
          centroids = estimator.cluster_centers_ #获取聚类中心
          for j in range(k):
            groups.append([level[i] for i, _ in enumerate(data) if label_pred[i] == j])
            centers.append([centroids[j][0], centroids[j][1]])
      print("{}/{}".format(i, len(self.cache_by_val)))

    return groups, centers

  def _cache(self):
    self.cache_by_val = []

    for i in range(int(1 / self.r_val) + 1):
      self.cache_by_val.append([])
    
    self.hash = lambda node: int(node["v"] / self.r_val)

    for i, node in enumerate(self.nodes):
      self.cache_by_val[self.hash(node)].append(i)

    return
    

  def transform(self, points, k):
    # 归一化
    self._normalize(points)

    self._cache()
    
    groups, centers = self._walk(k)

    return groups, centers



if __name__ == "__main__":
  filename_origin = sys.argv[1]
  k = int(sys.argv[2])
  r_val = float(sys.argv[3])
    
  with open("./storage/snapshot_" + filename_origin + ".json", mode='r') as fin:
    data = json.load(fin)["data"]

  cluster = SKMeans(r_val)
  groups, centroids = cluster.transform(data, k)

  result = []

  with open("./datasets/" + filename_origin + ".json", mode='r') as f:
    source = json.loads(f.read())

  for grp, center in zip(groups, centroids):
    if len(grp) == 0:
      continue
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
    
  with open("./storage/skm_" + filename_origin + "$k=" + sys.argv[2] + ".json", mode='w') as fout:
    json.dump(result, fout)
