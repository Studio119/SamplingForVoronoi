def log(done, total):
  with open("./storage/log.txt", mode='w') as f:
    f.write("{:.2%}".format(done / total))

def clear_log():
  with open("./storage/log.txt", mode='w') as f:
    f.write("")
    