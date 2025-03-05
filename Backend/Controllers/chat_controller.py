from fastapi import Request
import sys
import os


BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(BACKEND_DIR, "Muffakir-V1-main")
print("PAth = " + TARGET_DIR, flush=True)
sys.path.append(TARGET_DIR)

from app import get_rag_manager 

def send_message_controller(body):
    # return {"response" : "Hello, I am Muffakir. How can I help you?"}
    try:
        rag_manager = get_rag_manager()
        message_request = body["message"]
        # documents_request = body["documents"]

        response = rag_manager.generate_answer(message_request)
        bot_response = response["answer"]
        documents_response = []
        # if documents_request :
            # documents_response = response["source_metadata"]
        return {
            "response": bot_response,
            # "documents": documents_response
            }
    except Exception as e:
        print("WHAT THE ", flush=True)
        return {"response", (f"Error generating response: {e}")}



def get_history_controller(request: Request):
    return {"message": "Chat history"}

def save_history_controller(request: Request):


    return {"message": "Chat history saved"}