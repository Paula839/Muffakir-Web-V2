from fastapi import APIRouter
from Controllers.test_controller import *

testRouter = APIRouter()

@testRouter.get("/", summary="Generates a random test")
async def generate_test():
    return generate_test_controller()

@testRouter.get("/results", summary="Retrieve test results")
async def get_results():
    return get_results_controller()