def log(done, total):
  with open("./storage/log.txt", mode='w') as f:
    f.write("{:.2%}".format(done / total))

def log_text(text):
  with open("./storage/log.txt", mode='w') as f:
    f.write(text)

def clear_log():
  with open("./storage/log.txt", mode='w') as f:
    f.write("")
    