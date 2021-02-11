import sys
import json
from real_time_log import log
from random import random as random


class OnlyCluster:

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
    centers = []
    groups = []

    # init
    
    each_level = []
    for i, level in enumerate(self.cache_by_val):
      if len(level):
        # 先保证属性值对应的每一层都有一个种子点
        idx = level[int(random() * len(level))]
        seed = self.nodes[idx]
        centers.append([seed["x"], seed["y"], seed["v"], seed["x"], seed["y"], seed["v"]])
        groups.append([idx])
        each_level.append([i, len(level), [idx]]) # [层索引, 原始大小, 已放入种子]
    # 补足
    while len(centers) < k:
      # 找出比例差距最大的一组，增加一个点
      _i, _idx, _min = -1, -1, -1
      for i, level in enumerate(each_level):
        cur_num = len(level[2])
        if cur_num == level[1]:
          # 已经取完
          continue
        target_num = len(level) * k / len(self.nodes)
        dif = (target_num - cur_num) / level[1]
        if _idx == -1 or dif < _min:
          _idx = level[0]
          _min = dif
          _i = i
      # 取点：选择同类别最远的
      level = self.cache_by_val[_idx]
      idx, _max = -1, -1
      for point in level:
        dist = 0
        for center in centers:
          if abs(self.nodes[point]["v"] - center[2]) > self.r_val:
            continue
          dist += (
            self.nodes[point]["x"] - center[0]
          ) ** 2 + (self.nodes[point]["y"] - center[1]) ** 2
        if idx == -1 or dist > _max:
          idx = point
          _max = dist
      seed = self.nodes[idx]
      centers.append([seed["x"], seed["y"], seed["v"], seed["x"], seed["y"], seed["v"]])
      groups.append([idx])
      each_level[_i][2].append(idx)

    init_center_idx = [d[0] for d in groups]
    array = [d for d, _ in enumerate(self.nodes) if d not in init_center_idx]

    # 开始聚类
    _t = 0
    while True:
      # 重新初始化
      if _t:
        for i, center in enumerate(centers):
          groups[i] = []
        array = [d for d, _ in enumerate(self.nodes)]
      dist_sum = 0
      # 最近包含
      while len(array):
        idx = array.pop(int(random() * len(array))) # 0
        point = self.nodes[idx]
        _pos, _min = -1, -1
        # 计算与最近中心距离
        for i, center in enumerate(centers):
          if abs(point["v"] - center[2]) > self.r_val:
            continue
          dist = (
            (point["x"] - center[0]) ** 2 + (point["y"] - center[1]) ** 2
          )
          if _pos == -1 or dist < _min:
            _pos = i
            _min = dist
        # 归类
        groups[_pos].append(idx)
        dist_sum += _min
        # 更新统计
        centers[_pos][3] += point["x"]
        centers[_pos][4] += point["y"]
        centers[_pos][5] += point["v"]
        pass
      # 更新中心
      updated = False
      for i, center in enumerate(centers):
        size = len(groups[i])
        if size:
          next_x = center[3] / size
          next_y = center[4] / size
          next_v = center[5] / size
          if next_x != centers[i][0] or next_y != centers[i][1] or next_v != centers[i][2]:
            updated = True
          centers[i] = [next_x, next_y, next_v, 0, 0, 0]
        else:
          centers[i] = [center[0], center[1], center[2], 0, 0, 0]
      # log(_t, n_iter)
      _t += 1
      print("{}, total dist^2 = {}, n={}".format(_t, dist_sum, len([d for d in groups if len(d) > 0])))
      if not updated:
        break

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

  cluster = OnlyCluster(r_val)
  groups, centroids = cluster.transform(data, k)
  # print(len(groups))
  # sizes = {}
  # for grp in groups:
  #   size = len(grp)
  #   if size in sizes:
  #     sizes[size] += 1
  #   else:
  #     sizes[size] = 1
  # print(sizes)

  # print(groups)

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
    
  with open("./storage/oc_" + filename_origin + "$k=" + sys.argv[2] + ".json", mode='w') as fout:
    json.dump(result, fout)
