import sys
import json
from kde import get_kde
from ssbns import SSBNS
from real_time_log import clear_log


if __name__ == "__main__":
  clear_log()

  filename_origin = sys.argv[1]
  R = float(sys.argv[2]) * 1e-4
  
  with open("./storage/kde_" + filename_origin + ".json", mode='r') as fin:
    kde_data = json.load(fin)
    population = kde_data["population"]
    matrix = kde_data["matrix"]

  with open("./storage/ss_" + filename_origin + ".json", mode='r') as fin:
    for i, p in enumerate(json.load(fin)):
      matrix[i].append(p["ss"])

  ssbns = SSBNS(matrix, R=R)

  seeds, disks = ssbns.apply_sample()

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
    "./storage/ssb_" + filename_origin + "$R=" + sys.argv[2] + ".json", mode='w'
  ) as f:
    json.dump(data_processed, f)

  print(0)    # 程序运行完成

  pass
