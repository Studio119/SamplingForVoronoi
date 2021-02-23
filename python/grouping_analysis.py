

""" 通过最近邻关系将点连接为无向连通图 """
def connect_nodes(points, k=10, hash_len=20):
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
      knn.append([n, dist_2])
    knn = [d[0] for d in sorted(knn, key=lambda n: n[1])][:k]
    for target in knn:
      a = min(source[0], target)
      b = max(source[0], target)
      string = "{}_{}".format(a, b)
      if string not in linked:
        links.append((a, b))
        linked[string] = True
    print(source[0], knn)
    
  return {
    "nodes":  map_id_to_node,
    "links":  links,
    "hash_p": hash_points,
    "hash_f": hash_find
  }



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
