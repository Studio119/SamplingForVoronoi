from random import random as rand
from real_time_log import log


""" 三维蓝噪声采样 """
class BNS3d:

    def __init__(self, points, R=2e-4):
        # points: np.array shape=(5, N) --5: id, screenX, screenY, value, kde
        self.points = []
        self.point_index = {}
        self.disks = []
        for p in points:
            self.point_index[p[0]] = len(self.points)
            self.points.append({
                "id": int(p[0]),
                "x": p[1],
                "y": p[2],
                "val": p[3],

                "r": float(R) / p[4]
            })
        self.indexes = {
            "ready": [p["id"] for p in self.points],
            "active": [],
            "seed": [],
            "ignored": [],
            "disactivated": []
        }

    def apply_sample(self, n_cols):
        # 迭代
        while len(self.indexes["active"]) + len(self.indexes["ready"]) + len(self.indexes["ignored"]) > 0:
            # 取一个种子点
            log(
                len(self.indexes["seed"]) + len(self.indexes["disactivated"]),
                len(self.points)
            )
            seed = self._get_random_point(n_cols)
            if seed == -1:
                continue
            self._create_disk(seed, n_cols)

        return self.indexes["seed"], self.disks

    def _get_random_point(self, n_cols):
        if len(self.indexes["active"]) > 0:
            # 从所有活跃点中随机选一个作为种子点
            seed = self.indexes["active"].pop(int(rand() * len(self.indexes["active"])))
            self.indexes["seed"].append(seed)
            return seed
        elif len(self.indexes["ready"]) > 0:
            # 从所有就绪点中随机选一个作为种子点
            seed = self.indexes["ready"].pop(int(rand() * len(self.indexes["ready"])))
            self.indexes["seed"].append(seed)
            return seed
        else:
            # 处理被忽略的点
            # FIXME
            # 尝试扩充所有盘到 1.5 倍半径
            if self._expand_to_include(n_cols) > 0:
                return -1
            else:
                # 从所有被忽略的点中随机选一个作为种子点
                seed = self.indexes["ignored"].pop(int(rand() * len(self.indexes["ignored"])))
                self.indexes["seed"].append(seed)
                return seed

    def _create_disk(self, index, n_cols):
        seed = self.points[self.point_index[index]]
        
        # 初始化二维空间泊松盘半径
        r2d = seed["r"]

        for disk in self.disks:
            dist = (
                (disk["x"] - seed["x"]) ** 2 + (disk["y"] - seed["y"]) ** 2
            ) ** 0.5
            r2d = min(r2d, dist)

        next_ready = []
        next_active = []

        children = [index]

        for i in self.indexes["active"]:

            target = self.points[self.point_index[i]]
            sq_dist = (
                (target["x"] - seed["x"]) ** 2
                + (target["y"] - seed["y"]) ** 2
            )

            if sq_dist <= 16:
                # 稍后处理
                self.indexes["ignored"].append(i)
                continue

            dist3 = abs(target["val"] - seed["val"])

            if sq_dist <= r2d ** 2:
                """
                - 由于在属性值的维度上，距离上界（椭球的高）是固定的，表示地理位置的两个维度构成正圆，
                - 计算由 (dx, dy) 确定的位置的上界为 r3：
                - 假设图形为球，则高度 h(dx,dy) = sqrt(r2d ^ 2 - (dx^2 + dy^2))
                - 取 dx=dy=0 的位置，有 h(0,0) = r2d
                - 属性值的值域（已经过归一化，即 [0, 1]，半径=差异=1）：h_normalized_max = 1
                - 此时缩放为：h_normalized(dx,dy) = h(dx,dy) / r2d
                - 加入参数 n_cols：r3(dx,dy) = h_normalized(dx,dy) / n_cols
                """
                r3 = (r2d ** 2 - sq_dist) ** 0.5 / r2d / n_cols

                if dist3 <= r3:
                    # (0, 1r] -> 加入失效点
                    self.indexes["disactivated"].append(i)
                    continue

            # 放回
            next_active.append(i)

            pass
        
        # 扫描剩余点
        for i in self.indexes["ready"]:

            target = self.points[self.point_index[i]]
            sq_dist = (
                (target["x"] - seed["x"]) ** 2
                + (target["y"] - seed["y"]) ** 2
            )

            if sq_dist <= 16:
                # 稍后处理
                self.indexes["ignored"].append(i)
                continue

            dist3 = abs(target["val"] - seed["val"])

            if sq_dist <= r2d ** 2:
                """
                - 由于在属性值的维度上，距离上界（椭球的高）是固定的，表示地理位置的两个维度构成正圆，
                - 计算由 (dx, dy) 确定的位置的上界为 r3：
                - 假设图形为球，则高度 h(dx,dy) = sqrt(r2d ^ 2 - (dx^2 + dy^2))
                - 取 dx=dy=0 的位置，有 h(0,0) = r2d
                - 属性值的值域（已经过归一化，即 [0, 1]，半径=差异=1）：h_normalized_max = 1
                - 此时缩放为：h_normalized(dx,dy) = h(dx,dy) / r2d
                - 加入参数 n_cols：r3(dx,dy) = h_normalized(dx,dy) / n_cols
                """
                r3 = (r2d ** 2 - sq_dist) ** 0.5 / r2d / n_cols

                if dist3 <= r3:
                    # (0, 1r] -> 加入失效点
                    children.append(i)
                    self.indexes["disactivated"].append(i)
                    continue

            if sq_dist <= (r2d * 2) ** 2:
                r3 = ((r2d * 2) ** 2 - sq_dist) ** 0.5 / (r2d * 2) / n_cols

                if dist3 <= r3:
                    # (1r, 2r] -> 加入活跃点
                    next_active.append(i)
                    continue

            # 放回
            next_ready.append(i)

            pass

        self.disks.append({
            "id": len(self.indexes["seed"]) - 1,
            "seedId": index,
            "children": children,
            "x": seed["x"],
            "y": seed["y"],
            "r": r2d
        })

        self.indexes["ready"] = [i for i in next_ready]
        self.indexes["active"] = [i for i in next_active]

        return

    def _expand_to_include(self, n_cols):
        next_ignored = []
        included = 0
        for index in self.indexes["ignored"]:
            seed = self.points[self.point_index[index]]
            possible = -1
            nearest = 0
            for i, disk in enumerate(self.disks):
                sq_dist = (disk["x"] - seed["x"]) ** 2 + (disk["y"] - seed["y"]) ** 2
                r2d = disk["r"] * 1.5
                dist3 = abs(self.points[self.point_index[disk["seedId"]]]["val"] - seed["val"])

                if sq_dist <= r2d ** 2:
                    """
                    - 由于在属性值的维度上，距离上界（椭球的高）是固定的，表示地理位置的两个维度构成正圆，
                    - 计算由 (dx, dy) 确定的位置的上界为 r3：
                    - 假设图形为球，则高度 h(dx,dy) = sqrt(r2d ^ 2 - (dx^2 + dy^2))
                    - 取 dx=dy=0 的位置，有 h(0,0) = r2d
                    - 属性值的值域（已经过归一化，即 [0, 1]，半径=差异=1）：h_normalized_max = 1
                    - 此时缩放为：h_normalized(dx,dy) = h(dx,dy) / r2d
                    - 加入参数 n_cols：r3(dx,dy) = h_normalized(dx,dy) / n_cols
                    """
                    r3 = (r2d ** 2 - sq_dist) ** 0.5 / r2d / n_cols

                    if dist3 <= r3:
                        if possible == -1 or sq_dist < nearest:
                            possible = i
                            nearest = sq_dist
            if possible != -1:
                self.indexes["disactivated"].append(index)
                self.disks[possible]["children"].append(index)
                included += 1
            else:
                next_ignored.append(index)
        self.indexes["ignored"] = [i for i in next_ignored]
        print("solved " + str(included) + ", " + str(len(self.indexes["ignored"])) + " left")

        return included
