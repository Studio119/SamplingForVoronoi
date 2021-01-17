import sys
import json
from kde import get_kde
from bns import BNS


if __name__ == "__main__":
    filename_origin = sys.argv[1]
    alpha = int(sys.argv[2])      # 属性值维度的分层数量

    kde_data = get_kde(filename_origin, alpha)

    disks = []

    for i, kde in enumerate(kde_data):
        population = kde["population"]
        matrix = kde["matrix"]
        bns = BNS(matrix, R=1.5e-4)

        cur_seeds, cur_disks = bns.apply_sample()
        # print(i, len(matrix), len(cur_disks))
        disks += cur_disks
    
    point_link = {}
    data_processed = []

    with open("../dataset/" + filename_origin, mode='r') as f1:
        data_origin = json.load(f1)
        for data in data_origin:
            point_link[data["id"]] = data

    for disk in disks:
        value = 0

        for index in disk["children"]:
            value += point_link[index]["value"]

        p = point_link[disk["seedId"]]

        point = {
            "id": p["id"],
            "lng": p["lng"],
            "lat": p["lat"],
            "value": p["value"],
            # 以下是新的字段
            "diskId": disk["id"],
            "children": disk["children"],
            "radius": disk["r"],
            "averVal": value / len(disk["children"])
        }
        
        data_processed.append(point)

    with open("../storage/sampled_" + filename_origin, mode='w') as f:
        json.dump(data_processed, f)

    print(0)    # 程序运行完成

    pass