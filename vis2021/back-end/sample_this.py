import sys
import json
from bns3d import BNS3d


if __name__ == "__main__":
    filename_origin = sys.argv[1]
    alpha = float(sys.argv[2])      # 属性值维度的最大容许差异为 1 / alpha (归一化后)

    with open("../dataset/" + filename_origin, mode='r') as f_data:
        data_origin = json.load(f_data)
    
    with open("../storage/kde_" + filename_origin, mode='r') as fin:
        kde_data = json.load(fin)
        population = kde_data["population"]
        matrix = kde_data["matrix"]

    bns3d = BNS3d(matrix)

    seeds, disks = bns3d.apply_sample(alpha)
    
    data_processed = []

    with open("../dataset/" + filename_origin, mode='r') as f1:
        data_origin = json.load(f1)

    for disk in disks:
        point = [{
            "id": p["id"],
            "lng": p["lng"],
            "lat": p["lat"],
            "value": p["value"],
            # 以下是新的字段
            "diskId": disk["id"],
            "children": disk["children"],
            "radius": disk["r"]
        } for p in data_origin if p["id"] == disk["seedId"]][0]
        data_processed.append(point)

    with open("../storage/sampled_" + filename_origin, mode='w') as f:
        json.dump(data_processed, f)

    print(0)    # 程序运行完成

    pass
