from fastapi import APIRouter, Request
from Controllers.chat_controller import *

chatRouter = APIRouter(tags=["chat"])

@chatRouter.post("/messages", summary="Send messages")
async def post_messages(payload: dict, access_token: str = Cookie(None)):
    return await post_messages_controller(payload, access_token)


@chatRouter.get("/messages", summary="get chat history")
async def get_messages(access_token: str = Cookie(None)):
    return await get_messages_controller(access_token)

# Grouped routes related to chat history


