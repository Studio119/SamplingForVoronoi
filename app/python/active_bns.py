from random import random as rand


""" 二维主动蓝噪声采样 """
class ABNS:

  def __init__(self, points, R=1.5e-4, n_cols=8):
    # points: np.array shape=(5, N) --5: id, screenX, screenY, value, kde
    self.points = []
    self.point_index = {}
    self.disks = []
    self.cache_disks = {} # 缓存泊松盘信息
    self.radius = 0.5 / n_cols

    for p in points:
      self.point_index[p[0]] = len(self.points)
      r = float(R) / p[4]
      self.points.append({
        "id": int(p[0]),
        "x": p[1],
        "y": p[2],
        "val": p[3],

        "r": r
      })
    self.indexes = {
      "ready": [p["id"] for p in self.points],
      "active": [],
      "danger": [],
      "seed": [],
      "disactivated": []
    }

  def apply_sample(self, n_cols):
    self.radius = 0.5 / n_cols
    # 迭代
    while len(self.indexes["danger"]) + len(self.indexes["active"]) + len(self.indexes["ready"]) > 0:
      # 取一个种子点
      seed = self._get_next_seed()
      self._create_disk(seed)

    return self.indexes["seed"], self.disks

  def _all_belonging(self):
    sources = [self.points[self.point_index[index]] for index in self.indexes["danger"]]
    # 找到包含危险点的圆盘
    candidate = None
    max_including = 0 # 同时包含的危险点数量

    # 优先选择活跃点
    for _i, i in enumerate(self.indexes["active"]):
      p = self.points[self.point_index[i]]
      r = p["r"]
      including = 0
      for s in sources:
        # 属性值过滤
        if abs(s["val"] - p["val"]) > self.radius:
          continue
        # 矩形过滤
        if abs(s["x"] - p["x"]) > r or abs(s["y"] - p["y"]) > r:
          continue
        # 圆形过滤
        if (s["x"] - p["x"]) ** 2 + (s["y"] - p["y"]) ** 2 > r ** 2:
          continue
        # 可包含
        including += 1
        pass
      if including > max_including:
        max_including = including
        candidate = _i
      pass
    if candidate is not None:
      seed = self.indexes["active"].pop(candidate)
      self.indexes["seed"].append(seed)
      return seed

    # 若不存在，查找就绪点
    for _i, i in enumerate(self.indexes["ready"]):
      p = self.points[self.point_index[i]]
      r = p["r"]
      including = 0
      for s in sources:
        # 属性值过滤
        if abs(s["val"] - p["val"]) > self.radius:
          continue
        # 矩形过滤
        if abs(s["x"] - p["x"]) > r or abs(s["y"] - p["y"]) > r:
          continue
        # 圆形过滤
        if (s["x"] - p["x"]) ** 2 + (s["y"] - p["y"]) ** 2 > r ** 2:
          continue
        # 可包含
        including += 1
        pass
      if including > max_including:
        max_including = including
        candidate = _i
      pass
    if candidate is not None:
      seed = self.indexes["ready"].pop(candidate)
      self.indexes["seed"].append(seed)
      return seed

    # 若不存在，选择危险点
    for _i, i in enumerate(self.indexes["danger"]):
      p = self.points[self.point_index[i]]
      r = p["r"]
      including = 0
      for s in sources:
        # 属性值过滤
        if abs(s["val"] - p["val"]) > self.radius:
          continue
        # 矩形过滤
        if abs(s["x"] - p["x"]) > r or abs(s["y"] - p["y"]) > r:
          continue
        # 圆形过滤
        if (s["x"] - p["x"]) ** 2 + (s["y"] - p["y"]) ** 2 > r ** 2:
          continue
        # 可包含
        including += 1
        pass
      if including > max_including:
        max_including = including
        candidate = _i
      pass
    seed = self.indexes["danger"].pop(candidate)
    self.indexes["seed"].append(seed)
    return seed

  def _get_next_seed(self):
    # 优先解决危险点
    if len(self.indexes["danger"]) > 0:
      return self._all_belonging()
      
    if len(self.indexes["active"]) == 0:
      # 从所有就绪点中随机选一个作为种子点
      seed = self.indexes["ready"].pop(int(rand() * len(self.indexes["ready"])))
      self.indexes["seed"].append(seed)
      return seed
  
    # 从所有活跃点中随机选一个作为种子点
    seed = self.indexes["active"].pop(int(rand() * len(self.indexes["active"])))
    self.indexes["seed"].append(seed)
    return seed

  def _create_disk(self, index):
    seed = self.points[self.point_index[index]]
    r = seed["r"]

    for disk in self.disks:
      dist = (
        (disk["x"] - seed["x"]) ** 2 + (disk["y"] - seed["y"]) ** 2
      ) ** 0.5
      r = min(r, dist)

    next_danger = []
    next_ready = []
    next_active = []

    children = [index]
    
    # 扫描剩余危险点
    for i in self.indexes["danger"]:
      target = self.points[self.point_index[i]]

      dist = (
        (target["x"] - seed["x"]) ** 2 + (target["y"] - seed["y"]) ** 2
      ) ** 0.5

      if dist > r:
        # 放回
        next_danger.append(i)
      else:
        # (0, r]
        if abs(target["val"] - seed["val"]) > self.radius:
          # -> 放回
          next_danger.append(i)
        else:
          # -> 加入失效点
          self.indexes["disactivated"].append(i)
          children.append(i)
    
    # 扫描剩余活跃点
    for i in self.indexes["active"]:
      target = self.points[self.point_index[i]]
      dist = (
        (target["x"] - seed["x"]) ** 2 + (target["y"] - seed["y"]) ** 2
      ) ** 0.5

      if dist < r:
        # (0, r]
        if abs(target["val"] - seed["val"]) > self.radius:
          # -> 加入危险点
          next_danger.append(i)
        else:
          # -> 加入失效点
          self.indexes["disactivated"].append(i)
          children.append(i)
      else:
        # -> 放回
        next_active.append(i)

    # 扫描剩余就绪点
    for i in self.indexes["ready"]:
      target = self.points[self.point_index[i]]

      dist = (
        (target["x"] - seed["x"]) ** 2 + (target["y"] - seed["y"]) ** 2
      ) ** 0.5

      if dist > 2 * r:
        # 放回
        next_ready.append(i)
      elif dist > r:
        # (1r, 2r] -> 加入活跃点
        next_active.append(i)
      else:
        # (0, r]
        if abs(target["val"] - seed["val"]) > self.radius:
          # -> 加入危险点
          next_danger.append(i)
        else:
          # -> 加入失效点
          self.indexes["disactivated"].append(i)
          children.append(i)
            
    self.disks.append({
      "id": len(self.indexes["seed"]) - 1,
      "seedId": index,
      "children": children,
      "x": seed["x"],
      "y": seed["y"],
      "r": r
    })

    self.indexes["danger"] = [i for i in next_danger]
    self.indexes["active"] = [i for i in next_active]
    self.indexes["ready"] = [i for i in next_ready]

    return
