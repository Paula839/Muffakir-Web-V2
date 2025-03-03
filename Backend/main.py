from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Routes.chat_router import chatRouter
from Routes.test_router import testRouter
from Routes.user_router import userRouter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins. Replace "*" with your frontend URL for better security.
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

app.include_router(chatRouter, prefix="/api/chat")
app.include_router(testRouter, prefix="/api/test")
app.include_router(userRouter, prefix="/api/user")