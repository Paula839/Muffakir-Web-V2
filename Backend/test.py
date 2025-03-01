from motor.motor_asyncio import AsyncIOMotorClient
from starlette.config import Config
import os
env_path = os.path.join(os.path.dirname(__file__), ".env")
config = Config(env_path)  # Create .env file with below values

MONGO_URI = config("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
db = client.testDB

async def test_connection():
    try:
        databases = await client.list_database_names()
        print("Connected to MongoDB! Databases:", databases)
    except Exception as e:
        print("Connection failed:", e)

import asyncio
asyncio.run(test_connection())
