import sys
import json
from kde import normalizated_array
from bns3d import BNS3d


if __name__ == "__main__":
    filename_origin = sys.argv[1]

    with open("../dataset/" + filename_origin, mode='r') as f_data:
        data_origin = json.load(f_data)
    
    with open("../storage/kde_" + filename_origin, mode='r') as fin:
        kde_data = json.load(fin)
        population = kde_data["population"]
        matrix = kde_data["matrix"]

    bns3d = BNS3d(matrix)

    seeds = bns3d.apply_sample()

    sample = [p[0] for p in population if p[0] in seeds]

    with open("../dataset/" + filename_origin, mode='r') as f1:
        data_origin = json.load(f1)

    data_processed = [data_origin[i] for i in sample]

    with open("../storage/sampled_" + filename_origin, mode='w') as f:
        json.dump(data_processed, f)

    print(0)    # 程序运行完成

    pass
