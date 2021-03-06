from random import random as rand
from real_time_log import log
import math


""" 分组蓝噪声采样 """
class SSBNS:

  def __init__(self, points, R=2e-4, min_r=3):
    # points: np.array shape=(5, N) --5: id, screenX, screenY, value, kde
    self.points = []
    self.point_index = {}
    self.disks = []
    self.min_r = min_r
    for p in points:
      self.point_index[p[0]] = len(self.points)
      self.points.append({
        "id": int(p[0]),
        "x": p[1],
        "y": p[2],
        "val": p[3],
        "ss": p[5],

        "r": float(R) / p[4]
      })
    self.indexes = {
      "ready": [p["id"] for p in self.points],
      "active": [],
      "seed": [],
      "disactivated": []
    }

  def apply_sample(self):
    # 迭代
    while len(self.indexes["active"]) + len(self.indexes["ready"]) > 0:
      # 取一个种子点
      log(
        len(self.indexes["seed"]) + len(self.indexes["disactivated"]),
        len(self.points)
      )
      seed = self._get_random_point()
      self._create_disk(seed)

    return self.indexes["seed"], self.disks

  def _get_random_point(self):
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
      if r < self.min_r:
        r = self.min_r
        break

    # 查找邻近包含点
    array = []
    for p in self.points:
      dist = (
        (p["x"] - seed["x"]) ** 2 + (p["y"] - seed["y"]) ** 2
      ) ** 0.5
      if dist <= r:
        array.append(p)

    N_STEPS = 1
    count = 0
    while r > self.min_r and count < N_STEPS:
      count += 1
      each = {}
      contained = []
      for p in array:
        dist = (
          (p["x"] - seed["x"]) ** 2 + (p["y"] - seed["y"]) ** 2
        ) ** 0.5
        if dist <= r:
          contained.append(p)
      entropy = 0
      for p in contained:
        ss = p["ss"]
        if ss in each:
          each[ss] += 1
        else:
          each[ss] = 1
      for ss in each:
        p = each[ss] / len(contained)
        entropy -= p * math.log2(p)
      array = [p for p in contained]

      # variation = math.log2(entropy + 1)
      variation = (entropy)

      # 调整半径
      r = (r - self.min_r) / (1 + variation) + self.min_r

    r = max(r, self.min_r)

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
        # (0, r] -> 加入失效点
        self.indexes["disactivated"].append(i)
        children.append(i)
      else:
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
        # (0, r] -> 加入失效点
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

    self.indexes["ready"] = [i for i in next_ready]
    self.indexes["active"] = [i for i in next_active]

    return
