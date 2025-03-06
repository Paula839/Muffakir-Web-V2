
from google_auth_oauthlib.flow import Flow
from fastapi import HTTPException, Request, Response, Cookie
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import jwt  
from Config.settings import SECRET_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI 
from jwt import PyJWKClient


async def google_signin_controller(request: Request):

    redirect_path = request.query_params.get("redirect", "/")

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
    authorization_url, _ = flow.authorization_url(prompt="consent", state=redirect_path)
    return RedirectResponse(url=authorization_url)

async def google_callback_controller(code: str, state:str, response:Response):

    safe_redirect = state if state.startswith("/") else "/"

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
    redirect_response = RedirectResponse(url=f"http://localhost:3000{safe_redirect}")
    redirect_response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,       # Use secure cookies in production with HTTPS
        samesite="lax"
    )
    return redirect_response

async def read_user_controller(access_token: str = Cookie(None)):
    if access_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user_info = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        return user_info
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
async def logout_controller(response: Response):
    """Logs out the user by clearing the access token cookie."""
    response.delete_cookie(
        key="access_token", 
        httponly=True, 
        secure=True,       # Ensure secure flag matches cookie setting
        samesite="Lax",
        path="/"           # Set path if needed
    )
    return {"message": "Logged out successfully"}