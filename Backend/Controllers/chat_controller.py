from fastapi import Request, Cookie, HTTPException
import jwt
import sys
import os
from bson import ObjectId
from datetime import datetime
from Database.mongodb import get_database
from Config.settings import SECRET_KEY

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(BACKEND_DIR, "Muffakir-V1-main")
print("PAth = " + TARGET_DIR, flush=True)
sys.path.append(TARGET_DIR)

async def post_messages_controller(payload: dict, access_token: str = None):
    message_text = payload.get("message")
    documents_flag = payload.get("documents", False)
    session_id = payload.get("session_id")

    # Generate bot response (for demonstration, reverse the message)
    bot_response = message_text[::-1]
    documents = [["Document Title", "Document Content"]] if documents_flag else []

    if access_token:
        print("Authenticated user detected", flush=True)
        try:
            decoded_token = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get("email")
            
            if not user_email:
                raise HTTPException(status_code=401, detail="Invalid token: Email missing")

            db = get_database()
            chat_collection = db["chat_sessions"]

            # Update existing session in the database
            result = await chat_collection.update_one(
                {"_id": ObjectId(session_id), "user_email": user_email},
                {
                    "$push": {
                        "messages": {
                            "user_message": message_text,
                            "bot_message": bot_response,
                            "timestamp": datetime.utcnow()
                        }
                    },
                    "$set": {
                        "last_updated": datetime.utcnow(),
                        "title": message_text[:50] + ("..." if len(message_text) > 50 else "")
                    }
                }
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Session not found")

            return {
                "response": bot_response,
                "documents": documents,
                "session_id": session_id
            }

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.DecodeError:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        # Guest mode: simulate title update and return response from backend.
        updated_title = message_text[:50] + ("..." if len(message_text) > 50 else "")
        return {
            "response": bot_response,
            "documents": documents,
            "session_id": session_id,
            "title": updated_title
        }

async def get_messages_controller(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user_info = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_email = user_info.get("email")
    db = get_database()
    
    # Retrieve all sessions for the user (getting only the first message for title generation)
    sessions = await db["chat_sessions"].find(
        {"user_email": user_email},
        {"messages": {"$slice": 1}}
    ).sort("last_updated", -1).to_list(None)
    
    # Format and generate titles from the first message if available
    formatted_sessions = []
    for session in sessions:
        title = session.get("title", "New Chat")
        if session.get("messages"):
            first_message = session["messages"][0]["user_message"]
            title = first_message[:50] + ("..." if len(first_message) > 50 else "")
        formatted_sessions.append({
            "session_id": str(session["_id"]),
            "title": title,
            "created_at": session["created_at"],
            "last_updated": session["last_updated"],
            "message_count": len(session.get("messages", []))
        })
    
    return formatted_sessions

async def get_session_messages_controller(session_id: str, access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user_info = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        user_email = user_info.get("email")
        
        db = get_database()
        session = await db["chat_sessions"].find_one({
            "_id": ObjectId(session_id),
            "user_email": user_email
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": str(session["_id"]),
            "messages": session.get("messages", []),
            "title": session["title"]
        }
        
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
async def create_session_controller(access_token: str):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        decoded_token = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        user_email = decoded_token.get("email")
        
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token: Email missing")

        db = get_database()
        chat_collection = db["chat_sessions"]

        # Create a new empty session
        new_session = {
            "user_email": user_email,
            "title": "New Chat",
            "messages": [],
            "created_at": datetime.utcnow(),
            "last_updated": datetime.utcnow()
        }
        
        result = await chat_collection.insert_one(new_session)
        
        return {
            "session_id": str(result.inserted_id),
            "title": new_session["title"]
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
async def delete_session_controller(session_id: str, access_token: str):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        decoded_token = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        user_email = decoded_token.get("email")
        
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token: Email missing")

        db = get_database()
        chat_collection = db["chat_sessions"]

        # Validate session ID format
        try:
            session_oid = ObjectId(session_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Delete the session if it belongs to the user
        result = await chat_collection.delete_one({
            "_id": session_oid,
            "user_email": user_email
        })

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found or access denied")

        return {"message": "Session deleted successfully"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
