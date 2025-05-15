from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uuid import uuid4

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NX, NY = 100, 100  

grilles = {} 
users = {}   
deltas = {}   

def generate_empty_grid(nx, ny):
    return [[[255, 255, 255] for _ in range(nx)] for _ in range(ny)]


@app.get("/api/v1/{mapid}/preinit")
async def preinit(mapid: str):
    key = str(uuid4())
    users[key] = None
    if mapid not in grilles:
        grilles[mapid] = generate_empty_grid(NX, NY)
    return {"key": key}


@app.get("/api/v1/{mapid}/init")
async def init(mapid: str, key: str):
    user_id = str(uuid4())
    users[key] = user_id
    deltas[user_id] = []  
    grille = grilles[mapid]
    return {"id": user_id, "nx": NX, "ny": NY, "data": grille}


@app.get("/api/v1/{mapid}/set/{user_id}/{y}/{x}/{r}/{g}/{b}")
async def set_pixel(mapid: str, user_id: str, y: int, x: int, r: int, g: int, b: int):
    if mapid not in grilles or user_id not in deltas:
        return JSONResponse(status_code=400, content={"error": "invalid request"})

    grilles[mapid][y][x] = [r, g, b]

    for uid in deltas:
        if uid != user_id:
            deltas[uid].append([y, x, r, g, b])
    return 0  


@app.get("/api/v1/{mapid}/deltas")
async def get_deltas(mapid: str, id: str):
    if id not in deltas:
        return {"deltas": []}
    result = deltas[id]  
    deltas[id] = []    
    return {"deltas": result}

