from datetime import datetime, timedelta
from fastapi import FastAPI, Request, WebSocket, Cookie, Query, Depends, HTTPException, status, Form, Body
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse  
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.encoders import jsonable_encoder
from jose import JWTError, jwt
from typing import Optional
import bcrypt
import uuid
from pydantic import BaseModel, ValidationError
import sys
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
import json
from motor.motor_asyncio import AsyncIOMotorClient
import argparse

import os

if __name__ == "__main__":
    # Parse command-line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000, 
                      help='Port number to run the server on (default: 8000)')
    args = parser.parse_args()

    # Get port from environment variable or command line
    port = int(os.getenv("PORT", args.port))
    
    # Validate port number
    if not (1 <= port <= 65535):
        raise ValueError(f"Invalid port number: {port}. Must be between 1 and 65535")


# sys.path.append(r"D:\College\Level 4\Graduation Project\V3\Muffakir\Muffakir-V1")
# from rag_service import get_rag_manager

# FastAPI Application
app = FastAPI()

# app.mount("/static", StaticFiles(directory="backend/static"), name="static")
# templates = Jinja2Templates(directory="templates")





LANGUAGES = {"en": "English", "ar": "العربية"}

env_path = os.path.join(os.path.dirname(__file__), ".env")

# Google OAuth Configuration
config = Config(env_path)  # Create .env file with below values
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET')
GOOGLE_DISCOVERY_URL = config("GOOGLE_DISCOVERY_URL")

SECRET_KEY = config('SECRET_KEY')
ACCESS_TOKEN_EXPIRE_MINUTES = int(config('ACCESS_TOKEN_EXPIRE_MINUTES'))
ALGORITHM = config("ALGORITHM")
PORT = config("PORT")

MONGO_URI = config("MONGO_URI")

app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)


client = AsyncIOMotorClient(MONGO_URI)
db = client["chat_db"]
chat_collection = db["chat_history"]

class ChatMessage(BaseModel):
    content: str
    sender: str  # e.g., "user" or "bot"
    timestamp: str  # ISO format string

class ChatHistory(BaseModel):
    session_id: str
    messages: list[ChatMessage]

@app.post("/chat/save")
async def save_chat_history(history: ChatHistory, request: Request):
    token = request.cookies.get("access_token")
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    email = user.get("email")
    
    # Update the document and ensure user_email and session_id are set
    update_data = {
        "user_email": email,
        "session_id": email,  # Make sure session_id is explicitly set
        "messages": [msg.dict() for msg in history.messages],
        "last_updated": datetime.utcnow()
    }
    
    result = await chat_collection.update_one(
        {"user_email": email, "session_id":  email},
        {"$set": update_data},
        upsert=True
    )
    print("Matched count:", result.matched_count)
    return {"status": "ok", "matched_count": result.matched_count}

@app.get("/chat/history")
async def get_chat_history(session_id: str, request: Request):

    print("LOADING")
    token = request.cookies.get("access_token")
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    email = user.get("email")
    
    chat_doc = await chat_collection.find_one({"user_email": email, "session_id":  email})
    if chat_doc:
        # Exclude MongoDB’s internal _id field from the response if desired.
        chat_doc.pop("_id", None)
        return chat_doc
    else:
        return {"session_id": session_id, "messages": []}

# Configure OAuth
oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url=GOOGLE_DISCOVERY_URL,
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    client_kwargs={
        'scope': 'openid email profile',
        'redirect_uri': f'http://localhost:{PORT}/auth/google/callback',
        'prompt': 'select_account'
    }
)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Add these routes
@app.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError:
        raise HTTPException(status_code=400, detail="Failed to authenticate")
    
    userinfo = token.get('userinfo')
    if not userinfo:
        raise HTTPException(status_code=400, detail="No user information received")
    
    # Extract information from userinfo
    email = userinfo['email']
    username = userinfo.get('name', email.split('@')[0])
    picture = userinfo.get('picture')
    
    # Create JWT token with additional claims
    access_token = create_access_token(
        data={"sub": email, "name": username, "picture": picture},
        expires_delta=timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    )
    
    response = RedirectResponse(url="/chat")
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return response


def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = {
            "email": payload.get("sub"),
            "name": payload.get("name"),
            "picture": payload.get("picture")
        }
        return user
    except JWTError:
        return None
    
@app.get("/logout", response_class=HTMLResponse)
async def logout(request: Request, lang: str = Cookie(default="en")):
 # Create a redirect response to the homepage
    response = RedirectResponse(url="/")
    # Delete the access token cookie to log out the user
    response.delete_cookie("access_token")
    return response



# @app.get("/", response_class=HTMLResponse)
# async def chat_page(request: Request, lang: str = Cookie(default="en"), access_token: Optional[str] = None):
#     # Get the token from cookies
#     token = request.cookies.get("access_token")
#     user = None
#     if token:
#         user = get_current_user(token)
#     # Pass user info (if available) to the template
#     response = templates.TemplateResponse(
#         "index.html", {"request": request, "lang": lang, "languages": LANGUAGES, "user": user}
#     )
#     response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
#     return response


# @app.get("/chat", response_class=HTMLResponse)
# async def chat_page(request: Request, lang: str = Cookie(default="en"), access_token: Optional[str] = None):
#     # Get the token from cookies
#     token = request.cookies.get("access_token")
#     user = None
#     if token:
#         user = get_current_user(token)
#     # Pass user info (if available) to the template
#     response = templates.TemplateResponse(
#         "chat.html", {"request": request, "lang": lang, "languages": LANGUAGES, "user": user}
#     )
#     response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
#     return response

# @app.get("/signin", response_class=HTMLResponse)
# async def chat_page(request: Request, lang: str = Cookie(default="en")):
#     """Render the chat page with language selection"""
#     response = templates.TemplateResponse(
#         "signin.html", {"request": request, "lang": lang, "languages": LANGUAGES}
#     )
#     response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
#     return response



# @app.get("/set-language")
# async def set_language(request: Request, lang: str = Query("en")):
#     if lang not in LANGUAGES:
#         lang = "en"
#     response = RedirectResponse(url=request.headers.get('referer', '/'))
#     response.set_cookie(key="lang", value=lang, max_age=3600 * 24 * 30)
#     return response


# WebSocket Handler
# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()

    
#     try:
#         while True:
#             try:
#                 data = await websocket.receive_text()
#             except Exception as e:
#                 print(f"Client disconnected: {e}")
#                 break
            
#             json_data = json.loads(data)
#             user_message = json_data.get("message")
#             resources = json_data.get("resources")
#             search = json_data.get("search")
            
#             print({"message": user_message, "resources": resources, "search": search})

#             print(f"Received message: {user_message}")
#             print(f"Resources: {resources}")

#             try:
#                 response = get_rag_manager().generate_answer(user_message)
#                 bot_response = response["answer"]
#                 print("Done")
#                 await websocket.send_text(bot_response)
#                 # valid = user_message.find("لا يمكنني الإجابة على هذا السؤال")
#                 # if(valid != -1):
#                 if resources:
#                     await websocket.send_text("المصادر:")
#                     i = 1
#                     for doc in response["retrieved_documents"]:
#                         await websocket.send_text(f"{i}-📄 {doc}")
#                         i += 1
#             except Exception as e:
#                 print(f"Error generating response: {e}")
#                 await websocket.send_text("Sorry, something went wrong. Please try again.")
#     except Exception as e:
#         print(f"WebSocket error: {e}")
#     finally:
#         try:
#             await websocket.close()
#         except Exception:
#             pass

