import sys
import json
from acsample import apply_acsample


def apply_sample(population):
    if True:
        alpha = filename_origin = float(sys.argv[2])
        return apply_acsample(population, alpha)
    return []


if __name__ == "__main__":
    filename_origin = sys.argv[1]
    
    with open("../storage/snapshot_" + filename_origin, mode='r') as f0:
        snapshot = json.load(f0)

    with open("../dataset/" + filename_origin, mode='r') as f1:
        data_all = json.load(f1)
        data_origin = [data_all[d[0]] for d in snapshot]

    sampled_indexes = apply_sample(snapshot)

    data_processed = [data_origin[i] for i in sampled_indexes]

    with open("../storage/sampled_" + filename_origin, mode='w') as f:
        json.dump(data_processed, f)

    print(0)    # 程序运行完成

    pass
