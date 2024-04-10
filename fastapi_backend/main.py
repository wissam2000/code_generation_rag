import asyncio
from fastapi import FastAPI, HTTPException
from typing import List, AsyncIterable
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain_openai import ChatOpenAI
from langchain.schema import ChatMessage
from dotenv import load_dotenv

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


load_dotenv()

# Global flag to control streaming state
streaming_active = True

class Message(BaseModel):
    messages: List[ChatMessage]

async def send_message(messages: List[ChatMessage]) -> AsyncIterable[str]:
    global streaming_active
    callback = AsyncIteratorCallbackHandler()
    model = ChatOpenAI(
        streaming=True,
        verbose=True,
        callbacks=[callback],
    )

    task = asyncio.create_task(
        model.agenerate(messages=[messages])  # Assuming `agenerate` accepts a list of `ChatMessage` directly
    )

    try:
        async for token in callback.aiter():
            if not streaming_active:
                break  # Stop streaming if the global flag indicates
            yield token
    except Exception as e:
        print(f"caught exception: {e}")
    finally:
        callback.done.set()
        streaming_active = True  # Reset the flag when done or when stopping the stream
    await task

@app.post("/stream_chat/")
async def stream_chat(message: Message):
    global streaming_active
    streaming_active = True  # Ensure the stream is active when starting
    generator = send_message(message.messages)
    return StreamingResponse(generator, media_type="text/event-stream")

@app.post("/stop_stream/")
def stop_stream():
    global streaming_active
    streaming_active = False  # Set the flag to false to stop the stream
    return {"message": "Stream stopping"}
