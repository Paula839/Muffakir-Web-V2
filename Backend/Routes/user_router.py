from fastapi import APIRouter, Request
from Controllers.user_controller import *

userRouter = APIRouter()

@userRouter.get("/signin", summary="Sign in with Google")
async def signin(request: Request):
    return await signin_controller(request)

@userRouter.get("/auth", summary="OAuth callback")
async def auth(request: Request):
    return await auth_controller(request)

@userRouter.get("/logout", summary="Log out")
async def signin(request: Request):
    return logout_controller(request)



