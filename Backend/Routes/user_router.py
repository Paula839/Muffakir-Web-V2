
from fastapi import APIRouter, Cookie, Response
from Controllers.user_controller import *

userRouter = APIRouter(tags=["user"])

@userRouter.get("/auth/google")
async def google_auth(request: Request):
    return await google_signin_controller(request)

@userRouter.get("/auth/google/callback")
async def google_callback(code: str, state: str = "/", response: Response = None):
    
    return await google_callback_controller(code, state, response)

@userRouter.get("/me")
async def read_user(access_token: str = Cookie(None)):

    return await read_user_controller(access_token)

@userRouter.post("/logout")
async def logout(response: Response):
    return await logout_controller(response)