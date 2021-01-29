import sys
import json


class Cluster:

  def __init__(self, r_pos, r_val):
    self.r_pos = r_pos
    self.r_val = r_val
    self.nodes = []
    self.cache = {}
    self.hash = None

  def _normalize(self, points):
    self.nodes = []
    
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
        "v":  (p[3] - val_min) / (val_max - val_min),
        "links": []
      })

    return

  # 散列，优化搜索
  def _cache(self):
    self.cache = {}
    self.hash = None

    x_max = self.nodes[0]["x"]
    y_max = self.nodes[0]["y"]

    for node in self.nodes[1:]:
      x_max = max(x_max, node["x"])
      y_max = max(y_max, node["y"])

    self.hash = lambda node: (
      int(node["v"] / self.r_val),
      int(node["y"] / self.r_pos),
      int(node["x"] / self.r_pos)
    )

    for v in range(int(1 / self.r_val) + 1):
      self.cache[v] = {}
      for y in range(int(y_max / self.r_pos) + 1):
        self.cache[v][y] = {}
        for x in range(int(x_max / self.r_pos) + 1):
          self.cache[v][y][x] = []

    for i, node in enumerate(self.nodes):
      idxes = self.hash(node)
      self.cache[idxes[0]][idxes[1]][idxes[2]].append(i)

    return

  def _search_neighbors(self, node):
    neighbors = []
    hashed = self.hash(node)
    for v in [hashed[0] - 1, hashed[0], hashed[0] + 1]:
      if v < 0 or v >= len(self.cache):
        continue
      for y in [hashed[1] - 1, hashed[1], hashed[1] + 1]:
        if y < 0 or y >= len(self.cache[v]):
          continue
        for x in [hashed[2] - 1, hashed[2], hashed[2] + 1]:
          if x < 0 or x >= len(self.cache[v][y]):
            continue
          for i in self.cache[v][y][x]:
            dist2d = (
              (node["x"] - self.nodes[i]["x"]) ** 2
              + (node["y"] - self.nodes[i]["y"]) ** 2
            ) ** 0.5
            if dist2d > self.r_pos:
              continue
            # 求此位置的高度
            r3d_normal = dist2d / self.r_pos
            h3d = (1 - r3d_normal ** 2) ** 0.5 * self.r_val / 2
            dist3d = abs(node["v"] - self.nodes[i]["v"])
            if dist3d > self.r_val:
              continue
            dist = (r3d_normal ** 2 + dist3d) ** (1 / 3)
            neighbors.append({
              "idx":  i,
              "dist": dist2d
            })
    return sorted(neighbors, key=lambda d: d["dist"])

  def _walk(self, k=10000):
    groups = {}
    where_is_node = {}
    for i in range(len(self.nodes)):
      groups[i] = [i]
      where_is_node[i] = i

    # 构建边
    all_links = []
    links = {}
    for i, node in enumerate(self.nodes):
      links[i] = []
    for i, node in enumerate(self.nodes):
      neighbors = self._search_neighbors(node)
      for j, link in enumerate(neighbors):
        if i == j:
          continue
        links[i].append({
          "next": j,
          "dist": link["dist"]
        })
        if i < j:
          continue
        all_links.append({
          "ends": (i, j),
          "dist": link["dist"]
        })
      links[i].sort(key=lambda d: d["dist"])
    all_links.sort(key=lambda d: d["dist"])

    n_links = len(all_links)
    while len(all_links):
      link = all_links.pop(0)
      grp_i = where_is_node[link["ends"][0]]
      grp_j = where_is_node[link["ends"][1]]
      if grp_i == grp_j:
        continue
      farthest = 0
      for node_a in groups[grp_i]:
        if farthest > self.r_pos:
          break
        for node_b in groups[grp_j]:
          if farthest > self.r_pos:
            break
          dist = (
            (self.nodes[node_a]["x"] - self.nodes[node_b]["x"]) ** 2
            + (self.nodes[node_a]["y"] - self.nodes[node_b]["y"]) ** 2
          ) ** 0.5
          farthest = max(farthest, dist)
      if farthest <= self.r_pos:
        # 合并两个类簇
        for node in groups[grp_j]:
          where_is_node[node] = grp_i
        groups[grp_i] += groups[grp_j]
        del groups[grp_j]
      print(
        "{:.2%}".format(min(1, k / len(groups))),
        "{:.2%}".format(1 - len(all_links) / n_links),
        len(groups)
      )
      if len(groups) <= k:
        break

    return groups

  def fit(self, points):
    # 归一化
    self._normalize(points)
    # 记录散列索引
    self._cache()
    return self

  def transform(self, points):
    # 归一化
    self._normalize(points)
    
    # 记录散列索引
    self._cache()
    
    groups = self._walk(10000)

    return groups



if __name__ == "__main__":
  filename_origin = sys.argv[1]
  r_pos = float(sys.argv[2])
  r_val = float(sys.argv[3])
    
  with open("./storage/snapshot_" + filename_origin + ".json", mode='r') as fin:
    data = json.load(fin)["data"]

  cluster = Cluster(r_pos, r_val)
  groups = cluster.transform(data)
  print(len(groups))
    
  with open("./storage/cluster_" + filename_origin + ".json", mode='w') as fout:
    json.dump(groups, fout)
