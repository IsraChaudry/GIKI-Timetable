import urllib.request, json, os

BASE = "http://localhost:8000"

req = urllib.request.Request(
    BASE + "/api/auth/login",
    data=json.dumps({"password": "changeme123"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
token = json.loads(urllib.request.urlopen(req).read())["access_token"]

req2 = urllib.request.Request(
    BASE + "/api/export/pdf/1",
    headers={"Authorization": "Bearer " + token},
    method="GET"
)
response = urllib.request.urlopen(req2)
with open("test_output.pdf", "wb") as f:
    f.write(response.read())

size = os.path.getsize("test_output.pdf")
print("PDF downloaded:", size, "bytes")
if size > 1000:
    print("PDF export: OK")
else:
    print("PDF too small — fix export")
