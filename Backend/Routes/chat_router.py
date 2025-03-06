from fastapi import APIRouter, Request
from Controllers.chat_controller import *

chatRouter = APIRouter(tags=["chat"])

@chatRouter.post("/messages", summary="Send messages")
async def post_messages(payload: dict, access_token: str = Cookie(None)):
    return await post_messages_controller(payload, access_token)


@chatRouter.get("/messages", summary="get chat history")
async def get_messages(access_token: str = Cookie(None)):
    
    return await get_messages_controller(access_token)

@chatRouter.get("/sessions", summary="Get chat sessions list")
async def get_sessions(access_token: str = Cookie(None)):
    return await get_messages_controller(access_token)

@chatRouter.get("/sessions/{session_id}", summary="Get specific session messages")
async def get_session_messages(session_id: str, access_token: str = Cookie(None)):
    return await get_session_messages_controller(session_id, access_token)

@chatRouter.post("/sessions", summary="Create new chat session")
async def create_session(access_token: str = Cookie(None)):
    return await create_session_controller(access_token)

@chatRouter.delete("/sessions/{session_id}", summary="Delete a chat session")
async def delete_session(session_id: str, access_token: str = Cookie(None)):
    return await delete_session_controller(session_id, access_token)