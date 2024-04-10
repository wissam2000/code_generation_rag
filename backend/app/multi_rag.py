from typing import List
from langchain.retrievers.multi_query import LineListOutputParser
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from langchain_community.document_loaders.csv_loader import CSVLoader
from dotenv import load_dotenv
from langchain_core.callbacks.manager import AsyncCallbackManagerForRetrieverRun


load_dotenv()

from uuid import uuid4
from langchain_core.callbacks.manager import AsyncCallbackManagerForRetrieverRun

async def get_docs(query: str):
    output_parser = LineListOutputParser()

    llm = ChatOpenAI(
        temperature=0,
        max_tokens=800,
        model_kwargs={"top_p": 0, "frequency_penalty": 0, "presence_penalty": 0},
    )

    QUERY_PROMPT = PromptTemplate(
        input_variables=["question"],
        template="""You are an AI language model assistant specialized in software development and programming. Your task is to generate five detailed and specific questions related to the given user request for coding. These questions should only request specifically the documentation needed to implement the request. Your goal is to ensure you have all the documentation that would aid in solving the task at hand. Provide these alternative questions separated by newlines. If the user's question is not coding related respond only with "I don't know".

        Original user request: {question}
        """
    )

    llm_chain = LLMChain(llm=llm, prompt=QUERY_PROMPT, output_parser=output_parser)

    embedding = OpenAIEmbeddings(chunk_size=1)
    vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embedding)

    retriever = MultiQueryRetriever(
        retriever=vectorstore.as_retriever(), llm_chain=llm_chain, parser_key="lines"
    )

    # Prepare the run manager
    run_id = uuid4()
    async_callback_manager = AsyncCallbackManagerForRetrieverRun(
        run_id=run_id,
        handlers=[],
        inheritable_handlers=[],
        tags=[],
        inheritable_tags=[],
        metadata={},
        inheritable_metadata={}
    )

    queries = await llm_chain.ainvoke(query)
    print(queries)
    if any("I don't know." in query_response for query_response in queries["text"]):
        return ""
    
    # Pass the run_manager to aretrieve_documents
    unique_docs = await retriever.aretrieve_documents(
        queries=queries,
        run_manager=async_callback_manager  # Pass the initialized run manager here
    )

    print("WE ARE UNIQUE:", len(unique_docs))
    return "\n".join([result.page_content for result in unique_docs])
