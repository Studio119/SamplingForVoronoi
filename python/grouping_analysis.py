import math
from real_time_log import log_text



ENV_DEV = False


""" 将点连接为最小生成树 """
def connect_nodes(points, num, k=10, hash_len=40):
  points, extend = normalize_values(points)
  map_id_to_node = {}
  
  # 二维散列优化查找
  hash_points = []
  for i in range(hash_len):
    hash_points.append([])
    for j in range(hash_len):
      hash_points[-1].append([])
  hash_find = lambda y, x: (
    min(hash_len - 1, int((y - extend[1][0]) / (extend[1][1] - extend[1][0]) * hash_len)),
    min(hash_len - 1, int((x - extend[0][0]) / (extend[0][1] - extend[0][0]) * hash_len))
  )
  
  for point in points:
    _id, x, y, val = point
    map_id_to_node[_id] = {
      "x":  x,
      "y":  y,
      "v":  val
    }
    pos = hash_find(y, x)
    hash_points[pos[0]][pos[1]].append(_id)

  # 连接邻近点
  links = []
  linked = {} # 记录已连接的边 a<->b，id 小的在前，字符串形式为 'a_b'
  for source in points:
    neighbors = []
    search_r = 0
    search_y, search_x = hash_find(source[2], source[1])
    while len(neighbors) < k * 2:
      # 扩大搜索范围
      search_r += 1
      if search_r == 1:
        neighbors += [i for i in hash_points[search_y][search_x] if i != source[0]]
      else:
        top = search_y - (search_r - 1)
        left = search_x - (search_r - 1)
        bottom = search_y + (search_r - 1)
        right = search_x + (search_r - 1)
        # 上边界
        if top >= 0:
          for x in range(max(0, left), min(hash_len - 1, right) + 1):
            neighbors += hash_points[top][x]
        # 下边界
        if bottom < hash_len:
          for x in range(max(0, left), min(hash_len - 1, right) + 1):
            neighbors += hash_points[bottom][x]
        # 左侧
        if left >= 0:
          for y in range(max(0, top), min(hash_len - 1, bottom) + 1):
            neighbors += hash_points[y][left]
        # 右侧
        if right < hash_len:
          for y in range(max(0, top), min(hash_len - 1, bottom) + 1):
            neighbors += hash_points[y][right]
      pass
    # 选出 k 近邻
    knn = []
    for n in neighbors:
      p = map_id_to_node[n]
      dist_2 = (p["x"] - source[1]) ** 2 + (p["y"] - source[2]) ** 2
      # dist_2 = (p["v"] - source[3]) ** 2
      knn.append([n, dist_2])
    knn = [d[0] for d in sorted(knn, key=lambda n: n[1])][:k]
    for target in knn:
      a = min(source[0], target)
      b = max(source[0], target)
      string = "{}_{}".format(a, b)
      if string not in linked:
        links.append((a, b))
        linked[string] = abs(map_id_to_node[a]["v"] - map_id_to_node[b]["v"])
    
  trees = prun(map_id_to_node, kruskal(map_id_to_node, links, linked), num)

  map_id_to_tree = {}

  for t, tree in enumerate(trees):
    for node in tree["nodes"]:
      map_id_to_tree[node] = t

  return map_id_to_tree


""" Kruskal 算法 - 最小生成树 """
def kruskal(nodes, links, weight):
  result = []
  map_id_to_tree = {}
  for p in nodes:
    map_id_to_tree[p] = p
  wl = sorted([(w, weight[w]) for w in weight], key=lambda d : d[1])
  for i in range(len(nodes) - 1):
    log_text("building spanning trees... {:.2%}".format(i / (len(nodes) - 1)))
    if ENV_DEV:
      print("\r" * 100 + "building spanning trees... {:.2%}".format(i / (len(nodes) - 1)), end="")
    while True:
      if len(wl) == 0:
        break
      # 取出权重最小的边
      link = wl.pop(0)
      # 判断两端点是否位于同一树
      a, b = [int(e) for e in link[0].split("_")]
      if map_id_to_tree[a] != map_id_to_tree[b]:
        result.append({
          "source": a,
          "target": b,
          "weight": link[1]
        })
        origin = map_id_to_tree[b]
        for p in map_id_to_tree:
          if map_id_to_tree[p] == origin:
            map_id_to_tree[p] = map_id_to_tree[a]
        break
    if len(wl) == 0:
      break
  if ENV_DEV:
    print("\r" * 100 + "finished building spanning trees")
  trees = []
  map_tree_id = {}
  for i in map_id_to_tree:
    pos = map_id_to_tree[i]
    if pos not in map_tree_id:
      map_tree_id[pos] = len(trees)
      trees.append([])
  for link in result:
    trees[map_tree_id[map_id_to_tree[link["source"]]]].append(link)
  
  return trees


""" 切割树 """
def prun(nodes, trees, num):
  trees_with_cost = []
  for tree in trees:
    node_list = set()
    for link in tree:
      a, b = link["source"], link["target"]
      node_list.add(a)
      node_list.add(b)
    trees_with_cost.append({
      "nodes":  list(node_list),
      "links":  tree,
      "cost":   None
    })
  n_op, step = num - len(trees_with_cost), 0
  while len(trees_with_cost) < num:
    # 选择类内差距最大的将其拆分
    _max, _idx = 0, 0
    for i, tree in enumerate(trees_with_cost):
      if tree["cost"] == None:
        # 计算代价
        cost = std([nodes[j]["v"] for j in tree["nodes"]])
        tree["cost"] = cost
      if len(tree["nodes"]) > 1 and tree["cost"] > _max:
        _max = tree["cost"]
        _idx = i
    tree_to_prun = trees_with_cost.pop(_idx)
    # 找出最适合的拆分
    _min = None
    next_cut = [None, None]
    tree_to_prun["links"] = sorted(tree_to_prun["links"], key=lambda d : d["weight"], reverse=True)
    for i in range(len(tree_to_prun["links"])):
      # FIXME 太多了跑不起来
      if range(len(tree_to_prun["links"]) > 200) and i == 1:
        break
      # 迭代移除一条边
      use_links = [link for j, link in enumerate(tree_to_prun["links"]) if j != i]
      tree_a, tree_b = tree_cut(tree_to_prun["nodes"], use_links)
      # 计算新的代价（最大值）
      cost_a = std([nodes[j]["v"] for j in tree_a["nodes"]])
      cost_b = std([nodes[j]["v"] for j in tree_b["nodes"]])
      tree_a["cost"] = cost_a
      tree_b["cost"] = cost_b
      cost = max(cost_a, cost_b)
      if _min == None or cost < _min:
        _min = cost
        next_cut = [tree_a, tree_b]
    # 应用切割
    trees_with_cost.append(next_cut[0])
    trees_with_cost.append(next_cut[1])
    if ENV_DEV:
      print("{}/{} --- cut {} into {}+{}".format(
        len(trees_with_cost), num,
        len(tree_to_prun["nodes"]), len(next_cut[0]["nodes"]), len(next_cut[1]["nodes"])
      ))
      print("punning... {:.2%}".format(step / n_op))
    log_text("punning... {:.2%}".format(step / n_op))
    step += 1
    pass
  return trees_with_cost


""" 构建切割后的树 """
def tree_cut(nodes, links):
  _links = [link for link in links]
  tree_a = {
    "nodes":  [],
    "links":  [],
    "cost":   None  
  }
  tree_b = {
    "nodes":  [],
    "links":  [],
    "cost":   None
  }
  tree_a["nodes"].append(nodes[0])
  flag = 0  # tree_a["nodes"] 中索引小于 flag 的已完成遍历
  while flag < len(tree_a["nodes"]):
    _next_links = []
    cur_node = tree_a["nodes"][flag]
    # 把这个位置的点的相邻点添加进去
    for link in _links:
      if link["source"] == cur_node:
        next_node = link["target"]
        tree_a["links"].append(link)
        if next_node not in tree_a["nodes"]:
          tree_a["nodes"].append(next_node)
      elif link["target"] == cur_node:
        next_node = link["source"]
        tree_a["links"].append(link)
        if next_node not in tree_a["nodes"]:
          tree_a["nodes"].append(next_node)
      else:
        _next_links.append(link)
    flag += 1
    _links = [link for link in _next_links]
  # 剩下的全部放到另一个树
  for node in nodes:
    if node not in tree_a["nodes"]:
      tree_b["nodes"].append(node)
  tree_b["links"] = _links
  
  return tree_a, tree_b


""" 计算均值 """
def std(array):
  mean = 0
  for d in array:
    mean += d
  mean /= len(array)
  std = 0
  for d in array:
    std += (d - mean) ** 2
  # TODO 这里把总数开了个根号，尝试让数量大的更容易被划分
  # （接上条）还是算了
  # std = (std / len(array) ** 0.5) ** 0.5
  std = (std / len(array)) ** 0.5
  return std


""" 归一化属性值 """
def normalize_values(points):
  _min = _max = points[0][3]
  _minLng = _maxLng = points[0][1]
  _minLat = _maxLat = points[0][2]
  for point in points[1:]:
    if point[3] > _max:
      _max = point[3]
    if point[3] < _min:
      _min = point[3]
    if point[1] > _maxLng:
      _maxLng = point[1]
    if point[1] < _minLng:
      _minLng = point[1]
    if point[2] > _maxLat:
      _maxLat = point[2]
    if point[2] < _minLat:
      _minLat = point[2]
  for point in points:
    point[3] = (point[3] - _min) / (_max - _min)
  
  return points, ((_minLng, _maxLng), (_minLat, _maxLat))
