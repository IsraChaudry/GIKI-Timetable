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

def get(path):
    req = urllib.request.Request(
        BASE + path,
        headers={"Authorization": "Bearer " + token},
        method="GET"
    )
    return json.loads(urllib.request.urlopen(req).read())

faculties   = get("/api/faculties/")
departments = get("/api/departments/")
rooms       = get("/api/rooms/")
batches     = get("/api/batches/")

print(f"2. Faculties:   {len(faculties)}  (should be 6)")
print(f"3. Departments: {len(departments)}  (should be 12)")
print(f"4. Rooms:       {len(rooms)}  (should be 53)")
print(f"5. Batches:     {len(batches)}  (should be 48)")

print()
if len(faculties)==6 and len(departments)==12 and len(rooms)==53 and len(batches)==48:
    print("All seed data verified. Ready for teachers and courses.")
else:
    print("Something is wrong — check the numbers above.")
