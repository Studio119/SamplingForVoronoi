from random import random as rand


""" 三维蓝噪声采样 """
class BNS3d:

    def __init__(self, points, R=2e-7):
        # points: np.array shape=(5, N) --5: id, screenX, screenY, value, kde
        self.points = []
        self.point_index = {}
        for p in points:
            self.point_index[p[0]] = len(self.points)
            self.points.append({
                "id": int(p[0]),
                "x": p[1],
                "y": p[2],
                "val": p[3],

                "r": float(R) / p[4],

                "state": 0  # @state: 0 for 就绪, 1 for 种子点, 2 for 被覆盖点(<1r)
            })
        self.indexes = {
            "ready": [p["id"] for p in self.points],
            "active": [],
            "seed": [],
            "disactivated": []
        }

    def apply_sample(self):
        # 迭代
        while len(self.indexes["ready"]) > 0:
            # 取一个种子点
            seed = self._get_random_point()
            print("seed {}({})".format(len(self.indexes["seed"]), int(seed)))
            self._create_disk(seed)
            print()

        print("done")
        return self.indexes["seed"]

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

        next_ready = []
        a = b = 0
        
        # 扫描剩余点
        for i in self.indexes["ready"]:
            target = self.points[self.point_index[i]]
            dist = (
                (target["x"] - seed["x"]) ** 2
                + (target["y"] - seed["y"]) ** 2
                + (target["val"] - seed["val"]) ** 2
            ) ** 0.5

            if dist > 2 * r:
                # 放回
                next_ready.append(i)
            elif dist > r:
                # (1r, 2r] -> 加入活跃点
                self.indexes["active"].append(i)
                b += 1
            else:
                # (0, r] -> 加入失效点
                self.indexes["disactivated"].append(i)
                a += 1

        print("r = {}, 0~1r: {}, 1r~2r: {}".format(r, a, b))

        self.indexes["ready"] = [i for i in next_ready]

        return
