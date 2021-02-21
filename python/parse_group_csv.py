import csv
import json


if __name__ == "__main__":
  ss = {}
  data = []

  with open("./storage/group_Occupation.csv", mode='r', encoding='utf-8') as f:
    rows = csv.reader(f)
    for i, row in enumerate(rows):
      if i == 0:
        continue
      ss[i - 1] = int(row[3])

  with open("./datasets/Occupation.json", mode='r', encoding='utf-8') as f:
    data = json.load(f)
    for d in data:
      d["ss"] = ss[d["id"]]
  
  with open("./storage/ss_Occupation.json", mode='w', encoding='utf-8') as f:
    json.dump(data, f)

  pass
