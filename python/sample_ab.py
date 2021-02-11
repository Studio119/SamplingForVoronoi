import sys
import json
from kde import get_kde
from active_bns import ABNS
from real_time_log import clear_log


if __name__ == "__main__":
    clear_log()

    filename_origin = sys.argv[1]
    n_cols = int(sys.argv[2])      # 属性值维度的最大容许差异为 1 / n_cols (归一化后)
    R = float(sys.argv[3]) * 1e-4
    extending = float(sys.argv[4])
    
    with open("./storage/kde_" + filename_origin + ".json", mode='r') as fin:
        kde_data = json.load(fin)
        population = kde_data["population"]
        matrix = kde_data["matrix"]

    abns = ABNS(matrix, R=R, extending=extending)

    seeds, disks = abns.apply_sample(n_cols)

    clear_log()
    
    point_link = {}
    data_processed = []

    with open("./datasets/" + filename_origin + ".json", mode='r') as f1:
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

    with open(
        "./storage/ab_" + filename_origin + "$n_cols=" + sys.argv[2]
        + "$R=" + sys.argv[3]+ "$extending=" + sys.argv[4] + ".json", mode='w'
    ) as f:
        json.dump(data_processed, f)

    print(0)    # 程序运行完成

    pass