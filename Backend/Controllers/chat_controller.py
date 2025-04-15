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

from app import get_rag_manager, get_search_instance, get_final_search, get_quiz_instance

async def post_messages_controller(payload: dict, access_token: str = None):
    message_text = payload.get("message")
    documents_flag = payload.get("documents", False)
    search_flag = payload.get("search", False)
    quiz_flag = payload.get("quiz", False)
    session_id = payload.get("session_id")

    print("1000000000000")  # Payload received
    print(f"quiz_flag: {quiz_flag}")  # Debug quiz_flag
    if not message_text:
        print("1100000000000")  # Missing message_text
        raise HTTPException(status_code=400, detail="Message text is required")
    print("1200000000000")  # Message_text present

    documents = []
    message_response = ""
    quiz_data = None

    if search_flag:
        print("2000000000000")  # Entering search_flag
        print("SEARCHING")
        search_instance = get_search_instance()
        print("2100000000000")  # After get_search_instance
        results = search_instance.deep_search(message_text)
        print("2200000000000")  # After deep_search
        message_response = get_final_search(results, message_text)
        print("2300000000000")  # After get_final_search
        
        sources = results["data"].get("sources", [])
        print("2400000000000")  # After getting sources
        if sources:
            print("2500000000000")  # Sources exist
            resource_links = []
            for source in sources:
                print("2600000000000")  # Inside source loop
                resource_links.append({
                    "title": source['title'],
                    "url": source['url']
                })
            print("2700000000000")  # After building resource_links
            documents.append({
                "type": "resources",
                "title": "Resources",
                "links": resource_links
            })
            print("2800000000000")  # After appending resources document
   
    elif quiz_flag:
        print("4000000000000")  # Entering quiz_flag branch
        try:
            print("4100000000000")  # Start of try block
            quiz = get_quiz_instance()
            print("4200000000000")  # After get_quiz_instance
            quiz_result = quiz.generate_quiz(query=message_text)
            print("4300000000000")  # After generate_quiz
            message_response = "Quiz generated successfully! Redirecting to test page."
            print("4400000000000")  # After setting message_response
            
            # Minimal check for required keys
            print("4500000000000")  # Before structure check
            if not all(
                key in quiz_result 
                for key in ["questions", "options", "correct_answers"]
            ):
                print("4600000000000")  # Invalid structure detected
                raise ValueError("Invalid quiz data structure from generate_quiz")
            print("4700000000000")  # Structure check passed
            
            quiz_data = {
                "questions": quiz_result["questions"],
                "options": quiz_result["options"],
                "correct_answers": quiz_result["correct_answers"],
                "explanations": quiz_result.get("explanations", [])
            }
            print("4800000000000")  # After creating quiz_data
            
            # Add placeholder document for chat panel
            print("4900000000000")  # Before appending document
            documents.append({
                "type": "quiz",
                "title": "Generated Quiz",
                "content": "Quiz questions have been generated. Please proceed to the test page."
            })
            print("5000000000000")  # After appending document
            
            print("5100000000000")  # Quiz data ready
            print(f"QUESTIONSSSS: {quiz_data}")  # Debug quiz_data
            print(f"DOCUMENTSSSS: {documents}")  # Debug documents
        except Exception as e:
            print("5200000000000")  # Exception caught
            print(f"Error generating quiz: {str(e)}", flush=True)
            raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")
        print("5300000000000")  # After try-except (won’t reach if exception raised)
            
    elif documents_flag:
        print("6000000000000")  # Entering documents_flag
        response = get_rag_manager().generate_answer(message_text)
        print("6100000000000")  # After generate_answer
        message_response = response["answer"]
        print("6200000000000")  # After setting message_response
        retrieved_documents = response["retrieved_documents"]
        print("6300000000000")  # After getting retrieved_documents
        source_metadata = response["source_metadata"]
        print("6400000000000")  # After getting source_metadata
        for i in range(len(retrieved_documents)):
            print(f"6500000000000-{i}")  # Inside document loop
            documents.append({
                "type": "document",
                "title": source_metadata[i]["source"],
                "content": retrieved_documents[i]
            })
        print("6600000000000")  # After appending documents

    else:
        print("7000000000000")  # Entering default branch
        response = get_rag_manager().generate_answer(message_text)
        print("7100000000000")  # After generate_answer
        message_response = response["answer"]
        print("7200000000000")  # After setting message_response

    print("8000000000000")  # Before auth check
    if access_token:
        print("8100000000000")  # Authenticated user
        print("Authenticated user detected", flush=True)
        try:
            print("8200000000000")  # Start of auth try block
            decoded_token = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
            print("8300000000000")  # After decoding token
            user_email = decoded_token.get("email")
            print("8400000000000")  # After getting email
            
            if not user_email:
                print("8500000000000")  # Missing email
                raise HTTPException(status_code=401, detail="Invalid token: Email missing")
            print("8600000000000")  # Email present

            db = get_database()
            print("8700000000000")  # After getting database
            chat_collection = db["chat_sessions"]
            print("8800000000000")  # After getting collection

            update_data = {
                "$push": {
                    "messages": {
                        "user_message": message_text,
                        "bot_message": message_response,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$set": {
                    "last_updated": datetime.utcnow(),
                    "title": message_text[:50] + ("..." if len(message_text) > 50 else "")
                }
            }
            print("8900000000000")  # After creating update_data
            if quiz_flag and quiz_data:
                print("9000000000000")  # Quiz data to store
                update_data["$set"]["quiz_data"] = quiz_data
            print("9100000000000")  # After updating quiz_data

            result = await chat_collection.update_one(
                {"_id": ObjectId(session_id), "user_email": user_email},
                update_data
            )
            print("9200000000000")  # After update_one
            
            if result.matched_count == 0:
                print("9300000000000")  # Session not found
                raise HTTPException(status_code=404, detail="Session not found")
            print("9400000000000")  # Session updated

            print("9500000000000")  # Preparing response
            return {
                "response": message_response,
                "documents": documents,
                "session_id": session_id,
                "quiz_data": quiz_data if quiz_flag else None
            }
        except jwt.ExpiredSignatureError:
            print("9600000000000")  # Token expired
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.DecodeError:
            print("9700000000000")  # Invalid token
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        print("9800000000000")  # Guest mode
        updated_title = message_text[:50] + ("..." if len(message_text) > 50 else "")
        print("9900000000000")  # After setting title
        print("10000000000000")  # Preparing guest response
        return {
            "response": message_response,
            "documents": documents,
            "session_id": session_id,
            "title": updated_title,
            "quiz_data": quiz_data if quiz_flag else None
        }

# Other controller functions remain unchanged
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