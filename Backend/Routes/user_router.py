
from fastapi import APIRouter, Cookie, Response
from Controllers.user_controller import *

userRouter = APIRouter(tags=["user"])

@userRouter.get("/auth/google")
async def google_auth():
    return await google_signin_controller()

@userRouter.get("/auth/google/callback")
async def google_callback(code: str, response: Response):
    
    return await google_callback_controller(code, response)

@userRouter.get("/me")
async def read_user(access_token: str = Cookie(None)):

    return await read_user_controller(access_token)

@userRouter.post("/logout")
async def logout(response: Response):
    return await logout_controller(response)