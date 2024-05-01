import asyncio
from fastapi import FastAPI
from typing import List, AsyncIterable
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain_openai import ChatOpenAI
from langchain.schema import ChatMessage
from dotenv import load_dotenv
from multi_rag import get_docs
from langchain_core.prompts import PromptTemplate

# Server-side

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

async def create_prompt(query):
    context = await get_docs(query)
    if context == "":
        return query
    QUERY_PROMPT = PromptTemplate(
        input_variables=["context", "question"],
    template  = """You are an expert programmer well-versed in the latest React documentation and development practices. Use the most current documentation and information provided in the context below to answer React-related questions. If the question cannot be directly answered with the given context, please attempt to provide a general answer based on your comprehensive understanding of React's most recent standards and practices. Should a question be unanswerable even with this approach, kindly explain the necessity of additional context or documentation to provide a specific answer. Additionally, when answering questions, if applicable, elaborate on your answers by providing explanations, examples, or reasoning to ensure clarity and depth of understanding.

Context:

{context}

---

Question: {question}

Answer: """


    )
# Assuming QUERY_PROMPT is your PromptTemplate instance
    formatted_prompt = QUERY_PROMPT.format(context=context, question=query)
    return formatted_prompt



global task  # Declare the task globally if needed elsewhere

async def send_message(messages: List[ChatMessage]) -> AsyncIterable[str]:
    global streaming_active, task
    messages[-1].content = await create_prompt(messages[-1].content)

    callback = AsyncIteratorCallbackHandler()
    model = ChatOpenAI(
        model_name="gpt-4-turbo-2024-04-09",
        streaming=True,
        verbose=True,
        callbacks=[callback],
    )

    task = asyncio.create_task(
        model.agenerate(messages=[messages])  # Assuming `agenerate` accepts a list of `ChatMessage` directly
    )

    try:
        async for token in callback.aiter():
            yield token
            if not streaming_active:
                break  # Signal to break the loop when streaming is to be stopped
    except Exception as e:
        print(f"Caught exception: {e}", flush=True)
    finally:
        if not streaming_active and task:  # Check if the streaming is stopped and task exists
            task.cancel()  # Cancel the task if streaming is stopped
        try:
            await task  # Await the task to handle any cleanup after cancellation
        except asyncio.CancelledError:
            print("Task cancelled successfully", flush=True)
        callback.done.set()
        streaming_active = True  # Reset the flag when done or when stopping the stream


@app.post("/stream_chat/")
async def stream_chat(message: Message):
    global streaming_active
    streaming_active = True
    generator = send_message(message.messages)
    headers = {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream'
    }
    return StreamingResponse(generator, media_type="text/event-stream", headers=headers)

@app.post("/stop_stream/")
def stop_stream():
    global streaming_active
    streaming_active = False  # Set the flag to false to stop the stream
    return {"message": "Stream stopping"}
