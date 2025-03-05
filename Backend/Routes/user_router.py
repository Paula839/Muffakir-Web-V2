# users/router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import RedirectResponse
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel
import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlencode
import jwt  # PyJWT library for encoding tokens

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

userRouter = APIRouter(tags=["users"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY")
GOOGLE_REDIRECT_URI = "http://localhost:8000/api/user/auth/google/callback"


class GoogleAuthRequest(BaseModel):
    token: str



@userRouter.get("/auth/google")
async def google_auth():
    
    """Redirect to Google OAuth2 login page."""
    print(env_path, flush=True)
    print(GOOGLE_CLIENT_ID, flush=True)
    from google_auth_oauthlib.flow import Flow
    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        },
        scopes=["openid", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        redirect_uri=GOOGLE_REDIRECT_URI,  # Explicitly set redirect_uri

    )
    authorization_url, _ = flow.authorization_url(prompt="consent")
    print("Authorization URL:", authorization_url, flush=True)  # Debug

    return RedirectResponse(url=authorization_url)
    # return {"message": "Google Auth"}

@userRouter.get("/auth/google/callback")
async def google_auth_callback(code: str, response: Response):
    """Handle Google OAuth2 callback."""
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        },
        scopes=["openid", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        redirect_uri=GOOGLE_REDIRECT_URI,
    )
    flow.fetch_token(code=code)
    credentials = flow.credentials
    id_info = id_token.verify_oauth2_token(credentials.id_token, requests.Request(), GOOGLE_CLIENT_ID)

    # Return user info to frontend
    user_info = {
        "name": id_info.get("name"),
        "email": id_info.get("email"),
        "picture": id_info.get("picture"),
    }

    token = jwt.encode(user_info, SECRET_KEY, algorithm="HS256")
    # Redirect to frontend with user info as query parameters
    redirect_response = RedirectResponse(url="http://localhost:3000")
    redirect_response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,       # Only use secure cookies if you're in production with HTTPS
        samesite="lax"
    )
    return redirect_response

from fastapi import Cookie, HTTPException, Depends
@userRouter.get("/me")
async def read_user(access_token: str = Cookie(None)):
    if access_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user_info = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        return user_info
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    