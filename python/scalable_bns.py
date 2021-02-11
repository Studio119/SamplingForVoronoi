from random import random as rand
from real_time_log import log


""" 缩小半径实现纯度保证的蓝噪声采样 """
class SBNS:

  def __init__(self, points, R=1.5e-4, n_cols=8):
    # points: np.array shape=(5, N) --5: id, screenX, screenY, value, kde
    self.points = []
    self.point_index = {}
    self.disks = []
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
      "seed": [],
      "disactivated": []
    }

  def apply_sample(self, n_cols):
    self.radius = 0.5 / n_cols
    # 迭代
    while len(self.indexes["active"]) + len(self.indexes["ready"]) > 0:
      # 取一个种子点
      # print({
      #   "ready": len(self.indexes["ready"]),
      #   "active": len(self.indexes["active"]),
      #   "seed": len(self.indexes["seed"]),
      #   "disactivated": len(self.indexes["disactivated"]),
      #   "total": len(self.points)
      # })
      log(
        len(self.indexes["seed"]) + len(self.indexes["disactivated"]),
        len(self.points)
      )
      seed = self._get_next_seed()
      self._create_disk(seed)

    return self.indexes["seed"], self.disks

  def _get_next_seed(self):
    if len(self.indexes["active"]) > 0:
      # 从所有活跃点中随机选一个作为种子点
      seed = self.indexes["active"].pop(int(rand() * len(self.indexes["active"])))
      self.indexes["seed"].append(seed)
      return seed
    else:
      # 从所有就绪点中随机选一个作为种子点
      seed = self.indexes["ready"].pop(int(rand() * len(self.indexes["ready"])))
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

    # 通过查找内部是否包含其他点缩小半径
    for i in (self.indexes["active"] + self.indexes["ready"]):
      target = self.points[self.point_index[i]]
      dist = (
        (target["x"] - seed["x"]) ** 2 + (target["y"] - seed["y"]) ** 2
      ) ** 0.5
      if dist < r / 2:
        # (0, r]
        if abs(target["val"] - seed["val"]) > self.radius:
          # -> 缩小
          r = min(r, dist * 2)

    r = max(r, 2)
          
    next_ready = []
    next_active = []

    children = [index]
    
    # 扫描剩余活跃点
    for i in self.indexes["active"]:
      target = self.points[self.point_index[i]]
      dist = (
        (target["x"] - seed["x"]) ** 2 + (target["y"] - seed["y"]) ** 2
      ) ** 0.5

      if dist < r:
        # (0, r]
        if abs(target["val"] - seed["val"]) > self.radius:
          # -> 放回
          next_active.append(i)
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
          # -> 加入活跃点
          next_active.append(i)
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

    self.indexes["active"] = [i for i in next_active]
    self.indexes["ready"] = [i for i in next_ready]

    return