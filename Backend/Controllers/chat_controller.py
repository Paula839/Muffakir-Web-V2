from fastapi import Request
import sys
import os


BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(BACKEND_DIR, "Muffakir-V1-main")
print("PAth = " + TARGET_DIR, flush=True)
sys.path.append(TARGET_DIR)

from app import get_rag_manager 

def send_message_controller(body):
    try:
        user_request = body["message"]
        print(user_request, flush=True)
        response = get_rag_manager().generate_answer(user_request)
        bot_response = response["answer"]
        return {"response": bot_response}
    except Exception as e:
        return {"Error", (f"Error generating response: {e}")}



def get_history_controller(request: Request):
    return {"message": "Chat history"}

def save_history_controller(request: Request):

    return {"message": "Chat history saved"}