from fastapi import APIRouter, HTTPException, Response, Cookie
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from pathlib import Path
import jwt  # PyJWT library for encoding tokens and decoding Google tokens
from jwt import PyJWKClient

# Load .env from the parent directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

userRouter = APIRouter(tags=["user"])

# Google OAuth2 Config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "http://localhost:8000/api/user/auth/google/callback"
SECRET_KEY = os.getenv("SECRET_KEY") 

class GoogleAuthRequest(BaseModel):
    token: str

@userRouter.get("/auth/google")
async def google_auth():
    """Redirect to Google OAuth2 login page."""
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
    authorization_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(url=authorization_url)

@userRouter.get("/auth/google/callback")
async def google_auth_callback(code: str, response: Response):
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
        scopes=[
            "openid", 
            "https://www.googleapis.com/auth/userinfo.profile", 
            "https://www.googleapis.com/auth/userinfo.email"
        ],
        redirect_uri=GOOGLE_REDIRECT_URI,
    )
    flow.fetch_token(code=code)
    credentials = flow.credentials

    # Use PyJWKClient to fetch Google’s public keys and decode the token with a 10-second leeway
    jwks_url = "https://www.googleapis.com/oauth2/v3/certs"
    jwks_client = PyJWKClient(jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(credentials.id_token)
    try:
        id_info = jwt.decode(
            credentials.id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=GOOGLE_CLIENT_ID,
            leeway=10  # allow a 10-second clock skew
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

    # Prepare user info
    user_info = {
        "name": id_info.get("name"),
        "email": id_info.get("email"),
        "picture": id_info.get("picture"),
    }

    # Create a JWT token with user info (for your internal use)
    token = jwt.encode(user_info, SECRET_KEY, algorithm="HS256")

    # Set the token in an HttpOnly cookie and redirect to frontend without query params
    redirect_response = RedirectResponse(url="http://localhost:3000")
    redirect_response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,       # Use secure cookies in production with HTTPS
        samesite="lax"
    )
    return redirect_response

@userRouter.get("/me")
async def read_user(access_token: str = Cookie(None)):
    if access_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user_info = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        return user_info
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@userRouter.post("/logout")
async def logout(response: Response):
    """Logs out the user by clearing the access token cookie."""
    response = RedirectResponse(url="http://localhost:3000/chat")  # Redirect to frontend
    response.delete_cookie(key="access_token")  # Remove the authentication token
    return response