from grouping_analysis import connect_nodes
import json
import sys


def make_grp(filename, num):
  with open("./storage/snapshot_" + filename + ".json", mode='r', encoding='utf-8') as f:
    snapshot = json.load(f)["data"]

  map_id_to_tree = connect_nodes(snapshot, num)

  with open("./datasets/" + filename + ".json", mode='r', encoding='utf-8') as f:
    data = json.load(f)

  for d in data:
    d["ss"] = map_id_to_tree[d["id"]]

  with open("./storage/group_" + filename + "$" + str(num) + ".json", mode='w', encoding='utf-8') as f:
    json.dump(data, f)

  return

