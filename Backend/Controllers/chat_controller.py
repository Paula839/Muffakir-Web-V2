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

# from app import get_rag_manager 

# def send_message_controller(body):
#     # return {"response" : "Hello, I am Muffakir. How can I help you?"}
#     response = "Hello, I am Muffakir. How can I help you?"
#     documents = []
#     if(body.get("documents")):
#         documents = [["doc1", "Hello ya basha"], ["doc2", "Hello ya basha"], ["doc3", "Hello ya basha"]]

#     return {
#         "response": response,
#         "documents": documents
#         }
    # try:
    #     # rag_manager = get_rag_manager()
    #     message_request = body["message"]
    #     # documents_request = body["documents"]

    #     response = rag_manager.generate_answer(message_request)
    #     bot_response = response["answer"]
    #     documents_response = []
    #     # if documents_request :
    #         # documents_response = response["source_metadata"]
    #     return {
    #         "response": bot_response,
    #         # "documents": documents_response
    #         }
    # except Exception as e:
    #     print("WHAT THE ", flush=True)
    #     return {"response", (f"Error generating response: {e}")}



async def post_messages_controller(payload: dict, access_token: str = None):
    message_text = payload.get("message")
    documents_flag = payload.get("documents", False)

    # Dummy bot response (replace with actual logic)
    bot_response = message_text[::-1]

    documents = []
    if documents_flag:
        documents = [["Document Title", "Document Content"]]

    if access_token:
        try:
            decoded_token = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get("email")

            if not user_email:
                raise HTTPException(status_code=401, detail="Invalid token: Email missing")

            # Connect to MongoDB and insert message
            db = get_database()
            chat_collection = db["chat_messages"]
            await chat_collection.insert_one({
                "user_email": user_email,  # Save the email in the DB
                "user_message": message_text,
                "bot_message": bot_response,
                "timestamp": datetime.utcnow()
            })
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.DecodeError:
            raise HTTPException(status_code=401, detail="Invalid token")

    return {"response": bot_response, "documents": documents}


def serialize_message(message):
    """ Convert ObjectId to string and return message """
    message["_id"] = str(message["_id"])  # Convert ObjectId to string
    return message

async def get_messages_controller(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user_info = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_email = user_info.get("email")
    db = get_database()
    
    # Retrieve messages and convert ObjectId to string
    messages = await db["chat_messages"].find({"user_email": user_email}).sort("timestamp", 1).to_list(1000)
    
    # Convert each message's ObjectId
    return [serialize_message(msg) for msg in messages]