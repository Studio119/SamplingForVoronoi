import json
from grouping_analysis import connect_nodes


if __name__ == "__main__":
  with open("./storage/snapshot_Occupation.json", mode='r', encoding='utf-8') as f:
    data = json.load(f)["data"]

  connect_nodes(data, 200)
  
  pass
