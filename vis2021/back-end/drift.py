import sys
import json
from math import tan, pi


class DriftSystem:

    def __init__(self, disks, span=1, min_move=100, max_step=2, k1=1, k2=10, min_r=8):
        self.disks = [{
            "diskId": disk["diskId"],
            "origin": disk["origin"],
            "r": max(disk["radius"], 1),
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
        self.k1 = k1
        self.k2 = k2
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
            # 找出被含的圆盘
            for j, target in enumerate(self.disks):
                if i == j:
                    continue
                sq_dist = (
                    (disk["x"] - target["origin"][0]) ** 2 + (disk["y"] - target["origin"][1]) ** 2
                )
                dist = sq_dist ** 0.5
                l = disk["r"] + target["r"] - dist
                if l > 0:
                    # 受到排斥力-弹力模型
                    value = self.k1 * l
                    dx = (disk["x"] - target["origin"][0]) / dist
                    dy = (disk["y"] - target["origin"][1]) / dist
                    effect[disk["diskId"]].append({
                        "dx": dx,
                        "dy": dy,
                        "value": value
                    })
                pass
            # 对邻近的质点创建排斥力
            for target in self.disks[i + 1 : ]:
                sq_dist = (
                    (disk["x"] - target["x"]) ** 2 + (disk["y"] - target["y"]) ** 2
                )
                r = sq_dist ** 0.5
                if r < self.min_r:
                    # 受到排斥力-库仑力模型
                    value = 1e6 * self.k2 * disk["Q"] * target["Q"] / (max(r, 1) ** 2)
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

        for disk in self.disks:
            # 排除不受力的实体
            if len(effect[disk["diskId"]]) == 0:
                continue

            # 受簇内引力-库仑力模型
            s = (
                (disk["x"] - disk["origin"][0]) ** 2 + (disk["y"] - disk["origin"][1]) ** 2
            ) ** 0.5
            if s == 0:
                continue
            l = disk["r"] - s
            value = self.k2 * (disk["Q"] ** 2) / (l ** 2)
            dx = (disk["origin"][0] - disk["x"]) / s
            dy = (disk["origin"][1] - disk["y"]) / s
            effect[disk["diskId"]].append({
                "dx": dx,
                "dy": dy,
                "value": value
            })
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
                # 判断是否出圈（额外向内收敛一个像素）
                dx = next_state["x"] - next_state["origin"][0]
                dy = next_state["y"] - next_state["origin"][1]
                cur_dist = (dx ** 2 + dy ** 2) ** 0.5
                if cur_dist > disk["r"] - 1:
                    # 收缩回圆周
                    dx = dx / cur_dist * (disk["r"] - 1)
                    dy = dy / cur_dist * (disk["r"] - 1)
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
                next_state["move"].append([next_state["x"], next_state["y"]])
                # 统计
                move += dist
                pass

            next_disks.append(next_state)

        self.disks = next_disks
        self.span *= 0.9
        print(move)
        return move



if __name__ == "__main__":
    filename_origin = sys.argv[1]
    ticks = int(sys.argv[2])

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
            "averVal": d["averVal"],
        } for d in data]

    system = DriftSystem(disks)
    
    system.tick(times=ticks)

    for i, disk in enumerate(system.disks):
        disks[i]["x"] = disk["x"]
        disks[i]["y"] = disk["y"]
        disks[i]["move"] = disk["move"]

    with open("../storage/drifted_" + filename_origin, mode='w') as fout:
        json.dump(disks, fout)

    print(0)    # 程序运行完成

    pass
