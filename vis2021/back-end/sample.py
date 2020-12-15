import sys
import json


def apply_sample(population):
    sample = []
    return sample


if __name__ == "__main__":
    filename_origin = sys.argv[1]
    
    with open("../dataset/" + filename_origin, mode='r') as f:
        data_origin = json.load(f)

    data_processed = apply_sample(data_origin)

    with open("../storage/" + filename_origin, mode='w') as f:
        json.dump(data_processed, f)

    print(0)    # 程序运行完成

    pass
