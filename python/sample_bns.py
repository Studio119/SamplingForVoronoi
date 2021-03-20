import sys
import json
from kde import get_kde
from bns import BNS
from real_time_log import clear_log


if __name__ == "__main__":
    clear_log()

    filename_origin = sys.argv[1]
    R = float(sys.argv[2]) * 1e-4
    min_r = float(sys.argv[3])
    
    with open("./storage/kde_" + filename_origin + ".json", mode='r') as fin:
        kde_data = json.load(fin)
        population = kde_data["population"]
        matrix = kde_data["matrix"]

    bns = BNS(matrix, R=R, min_r=min_r)

    seeds, disks = bns.apply_sample()

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
        "./storage/bns_" + filename_origin + "$R=" + sys.argv[2]
          + "$min_r=" + sys.argv[3] + ".json", mode='w'
    ) as f:
        json.dump(data_processed, f)

    print(0)    # 程序运行完成

    pass
