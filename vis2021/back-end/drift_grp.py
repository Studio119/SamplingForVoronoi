import sys
import json
from math import tan, pi, isinf


class DriftSystemGrp:

    def __init__(self, disks, span=1, min_move=100, max_step=2, k=1e6, min_r=8):
        self.disks = [{
            "diskId": disk["diskId"],
            "origin": disk["origin"],
            "borders": disk["borders"],
            # 状态
            "x": disk["origin"][0],
            "y": disk["origin"][1],
            "vx": 0,
            "vy": 0,
            # 力学属性
            "Q": disk["size"],
            # 运动日志
            "move": []
        } for disk in disks]
        self.span = span            # 时间间隔
        self.max_step = max_step    # 质点单次最大移动距离
        self.min_move = min_move    # 总移动距离小于这个数时，停止更新
        self.k = k
        self.min_r = min_r          # 质点最近距离

    def tick(self, times=10):
        for _ in range(times):
            effect = self._analyze()
            move = self._resolve(effect)
            if move < self.min_move:
                break
        return

    def _analyze(self):
        effect = {}
        # 初始化
        for disk in self.disks:
            # 作用力
            effect[disk["diskId"]] = []

        for i, disk in enumerate(self.disks):
            # 对邻近的质点创建排斥力
            for target in self.disks[i + 1 : ]:
                sq_dist = (
                    (disk["x"] - target["x"]) ** 2 + (disk["y"] - target["y"]) ** 2
                )
                r = sq_dist ** 0.5
                if r < self.min_r:
                    # 受到排斥力-库仑力模型
                    value = self.k * disk["Q"] * target["Q"] / (max(r, 1) ** 2)
                    dx = (disk["x"] - target["x"]) / r
                    dy = (disk["y"] - target["y"]) / r
                    effect[disk["diskId"]].append({
                        "dx": dx,
                        "dy": dy,
                        "value": value
                    })
                    effect[target["diskId"]].append({
                        "dx": -dx,
                        "dy": -dy,
                        "value": value
                    })
                pass
            pass

        return effect

    def _resolve(self, effect):
        next_disks = []
        move = 0

        for disk in self.disks:
            next_state = disk
            e = effect[disk["diskId"]]

            if len(e):
                x = next_state["x"]
                y = next_state["y"]
                fx = 0
                fy = 0
                # 计算合力
                for f in e:
                    fx += f["dx"] * f["value"]
                    fy += f["dy"] * f["value"]
                # 计算加速度
                ax = fx / disk["Q"]
                ay = fy / disk["Q"]
                # 更新位置
                vx2 = disk["vx"] + ax * self.span
                vy2 = disk["vy"] + ay * self.span
                vx = (disk["vx"] + vx2) / 2
                vy = (disk["vy"] + vy2) / 2
                next_state["x"] += vx * self.span
                next_state["y"] += vy * self.span
                # 更新速度
                next_state["vx"] = vx2
                next_state["vy"] = vy2
                # 计算实际移动距离
                sx = next_state["x"] - x
                sy = next_state["y"] - y
                dist = (sx ** 2 + sy ** 2) ** 0.5
                # 判断是否超出单次移动距离上限
                if dist > self.max_step:
                    # 缩短
                    sx = sx / dist * self.max_step
                    sy = sy / dist * self.max_step
                    next_state["x"] = x + sx
                    next_state["y"] = y + sy
                    dist = (sx ** 2 + sy ** 2) ** 0.5
                # 判断是否在多边形内
                dx = next_state["x"] - next_state["origin"][0]
                dy = next_state["y"] - next_state["origin"][1]
                cur_dist = (dx ** 2 + dy ** 2) ** 0.5
                flag, r = DriftSystemGrp._is_point_included(
                    [next_state["x"], next_state["y"]],
                    disk["borders"], dx, dy
                )
                if flag == False:
                    if not isinf(r):
                        # 收缩
                        dx = dx / cur_dist * (cur_dist - r)
                        dy = dy / cur_dist * (cur_dist - r)
                        next_state["x"] = next_state["origin"][0] + dx
                        next_state["y"] = next_state["origin"][1] + dy
                        # 速度重置
                        next_state["vx"] = 0
                        next_state["vy"] = 0
                        # 更新实际移动距离
                        sx = next_state["x"] - x
                        sy = next_state["y"] - y
                        dist = (sx ** 2 + sy ** 2) ** 0.5
                        pass
                    else:
                        # undo
                        next_state["x"] = x
                        next_state["y"] = y
                        # 速度重置
                        next_state["vx"] = 0
                        next_state["vy"] = 0
                        # 更新实际移动距离
                        sx = 0
                        sy = 0
                        dist = 0
                        pass
                    pass
                next_state["move"].append([next_state["x"], next_state["y"]])
                # 统计
                move += dist
                pass

            next_disks.append(next_state)

        self.disks = next_disks
        self.span *= 0.9
        print(move)
        return move

    """ 用射线法判断点距离多边形某方向上最近边的距离（为负数表示已超过此边） """
    @staticmethod
    def _is_point_included(p, borders, dx, dy):
        dist_list = []
        dist_neg_list = []
        if dx == 0:
            if dy == 0:
                return True, float('inf')
            # 射线平行于 y 轴的情况
            elif dy > 0:
                # 向上
                for border in borders:
                    if border[0][0] < p[0] and border[1][0] > p[1]:
                        # 与直线的相交点 y 坐标
                        y = border[0][1] + (
                            border[1][1] - border[0][1]
                        ) * (p[0] - border[0][0]) / (border[1][0] - border[0][0])
                        if y > p[1]:
                            dist = y - p[1]
                            dist_list.append(dist)
                        elif y < p[1]:
                            dist = p[1] - y
                            dist_neg_list.append(dist)
            else:
                # 向下
                for border in borders:
                    if border[0][0] < p[0] and border[1][0] > p[1]:
                        # 与直线的相交点 y 坐标
                        y = border[0][1] + (
                            border[1][1] - border[0][1]
                        ) * (p[0] - border[0][0]) / (border[1][0] - border[0][0])
                        if y < p[1]:
                            dist = p[1] - y
                            dist_list.append(dist)
                        elif y > p[1]:
                            dist = y - p[1]
                            dist_neg_list.append(dist)
        else:
            # 检测射线方程
            # y = dy / dx * (x - p[0]) + p[1]
            # 斜率
            kp = dy / dx
            for border in borders:
                if border[1][0] == border[0][0]:
                    x = border[0][0]
                    y = kp * (x - p[0]) + p[1]
                    if min(border[0][1], border[1][1]) < y < max(border[0][1], border[1][1]):
                        if dx > 0:
                            if x > p[0]:
                                dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                                dist_list.append(dist)
                            elif x < p[0]:
                                dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                                dist_neg_list.append(dist)
                        else:
                            if x < p[0]:
                                dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                                dist_list.append(dist)
                            elif x > p[0]:
                                dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                                dist_neg_list.append(dist)
                    continue
                # 斜率
                k = (border[1][1] - border[0][1]) / (border[1][0] - border[0][0])
                # 方程
                # y = kp * x - kp * p[0] + p[1]
                # y = k * x + border[0][1] - k * border[0][0]
                # 联立得
                # (kp - k) * x = kp * p[0] - p[1] + border[0][1] - k * border[0][0]
                if kp == k:
                    # 平行，无交点
                    continue
                x = (kp * p[0] - p[1] + border[0][1] - k * border[0][0]) / (kp - k)
                y = kp * (x - p[0]) + p[1]
                if min(border[0][1], border[1][1]) < y < max(border[0][1], border[1][1]):
                    if dx > 0:
                        if x > p[0]:
                            dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                            dist_list.append(dist)
                        elif x < p[0]:
                            dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                            dist_neg_list.append(dist)
                    else:
                        if x < p[0]:
                            dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                            dist_list.append(dist)
                        elif x > p[0]:
                            dist = ((p[1] - y) ** 2 + (p[0] - x) ** 2) ** 0.5
                            dist_neg_list.append(dist)
            pass
        # 相交点个数为1则在凸多边形内
        dist_list = sorted(dist_list)
        dist_neg_list = sorted(dist_neg_list)
        if len(dist_list) % 2 == 1:
            return True, dist_list[0]
        elif len(dist_neg_list) >= 1:
            return False, dist_neg_list[0]
        return False, float('inf')



if __name__ == "__main__":
    filename_origin = sys.argv[1]
    ticks = int(sys.argv[2])

    polygons = []

    with open("../storage/voronoi_" + filename_origin, mode='r') as f:
        snapshot = json.load(f)
        voronoi = snapshot["data"]
        for v in voronoi:
            borders = []
            if v != None and len(v) > 2:
                for i in range(len(v) - 1):
                    pa = v[i]
                    pb = v[i + 1]
                    borders.append((pa, pb))
            polygons.append(borders)
            pass

    with open("../storage/snapshot_" + filename_origin, mode='r') as f:
        snapshot = json.load(f)["data"]
        position = {}
        for d in snapshot:
            position[d[0]] = (d[1], d[2])

    with open("../storage/sampled_" + filename_origin, mode='r') as f:
        data = json.load(f)
        disks = [{
            "diskId": d["diskId"],
            "origin": position[d["id"]],
            "radius": d["radius"],
            "size": len(d["children"]),

            "id": d["id"],
            "lng": d["lng"],
            "lat": d["lat"],
            "value": d["value"],
            "children": d["children"],
            "averVal": d["averVal"]
        } for d in data]
        for disk in disks:
            p = disk["origin"]
            idx = -1
            borders = []
            for i, v in enumerate(polygons):
                flag, _ = DriftSystemGrp._is_point_included(p, v, 1, 1)
                if flag:
                    idx = i
                    break
            if idx != -1:
                borders = polygons.pop(idx)
            disk["borders"] = borders

    system = DriftSystemGrp(disks)
    
    system.tick(times=ticks)

    for i, disk in enumerate(system.disks):
        disks[i]["x"] = disk["x"]
        disks[i]["y"] = disk["y"]
        disks[i]["move"] = disk["move"]

    with open("../storage/drifted_" + filename_origin, mode='w') as fout:
        json.dump(disks, fout)

    print(0)    # 程序运行完成

    pass
