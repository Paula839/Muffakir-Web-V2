from fastapi import APIRouter, Request
from Controllers.chat_controller import *

chatRouter = APIRouter()

@chatRouter.post("/message", summary="Send a message")
async def send_message(request: Request):
    body = await request.json() 
    return send_message_controller(body)

# Grouped routes related to chat history
@chatRouter.get("/history", summary="Retrieve chat history")
async def get_history(request: Request):
    return get_history_controller(request)

@chatRouter.post("/history", summary="Save chat history")
async def save_history(request: Request):
    return save_history_controller(request)

