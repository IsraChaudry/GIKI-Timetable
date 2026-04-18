import urllib.request, json

BASE = "http://localhost:8000"

req = urllib.request.Request(
    BASE + "/api/auth/login",
    data=json.dumps({"password": "changeme123"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
token = json.loads(urllib.request.urlopen(req).read())["access_token"]
print("1. Auth: OK")

req2 = urllib.request.Request(
    BASE + "/api/timetable/1",
    headers={"Authorization": "Bearer " + token},
    method="GET"
)
timetable = json.loads(urllib.request.urlopen(req2).read())
grid = timetable["grid"]
print("2. Timetable:", len(grid), "slots filled")
first_key = list(grid.keys())[0]
print("   Sample cell:", grid[first_key])

req3 = urllib.request.Request(
    BASE + "/api/conflicts/1",
    headers={"Authorization": "Bearer " + token},
    method="GET"
)
conflicts = json.loads(urllib.request.urlopen(req3).read())
print("3. Conflicts:", len(conflicts["conflicts"]), "found (should be 0)")

if len(conflicts["conflicts"]) == 0:
    print("\nBackend complete and verified!")
else:
    print("\nConflicts found — fix before frontend!")
