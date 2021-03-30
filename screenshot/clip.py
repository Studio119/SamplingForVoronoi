from PIL import Image

for alg in ['rs', 'bns', 'valmn']:
  for rate in [1, 5, 10]:
    name = alg + "_{}".format(rate)
    source = Image.open(name + ".png")
    target = source.crop((628, 90, 1620, 1040))
    target.save("output/" + name + " (output).png")