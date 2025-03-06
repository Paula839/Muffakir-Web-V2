from motor.motor_asyncio import AsyncIOMotorClient
from Config.settings import MONGO_URI

client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()

def get_database():
    print(MONGO_URI, flush=True)
    return db
