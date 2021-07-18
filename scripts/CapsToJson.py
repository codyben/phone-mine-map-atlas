import json, requests
from os import major
from xml.etree.ElementTree import fromstring, ElementTree

base_url = "https://data.pasda.psu.edu/server/services/MineMaps/{}/MapServer/WMSServer?request=GetCapabilities&version=1.1.1&service=WMS"
with open("../mapservers.json") as f:
    mapservers = json.load(f)

mapping = dict()

for server in mapservers:
    wms  = base_url.format(server)
    data = requests.get(wms, timeout=240)
    # print(data.text)
    tree = ElementTree(fromstring(data.text))
    # print(tree)
    root = tree.getroot()
    caps = root.find("Capability")
    layer_container = caps.find("Layer")
    for layer in layer_container.findall("Layer"):
        name = layer.find("Title").text.replace(".sid", "")
        id = int(layer.find("Name").text)
        mapping[name] = id

with open("../layerMaps/layers.json", "w") as f:
    json.dump(mapping, f)