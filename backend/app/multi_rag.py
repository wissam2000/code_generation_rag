from typing import List
from langchain.retrievers.multi_query import LineListOutputParser
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv
from langchain.retrievers import ParentDocumentRetriever
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.storage._lc_store import create_kv_docstore
from langchain.storage import LocalFileStore
import asyncio

load_dotenv()


async def fetch_documents_for_queries(retriever, queries):
    tasks = [retriever.aget_relevant_documents(query) for query in queries]
    results = await asyncio.gather(*tasks)

    # Use a set to track unique document contents
    seen_contents = set()
    unique_docs = []

    for result in results:
        for doc in result:
            # Use the document's content to check for uniqueness
            if doc.page_content not in seen_contents:
                seen_contents.add(doc.page_content)
                unique_docs.append(doc)

    return unique_docs


# Assuming `retriever` is your instance of ParentDocumentRetriever and `queries` is your list of queries
# Call the function with:
# unique_docs = asyncio.run(fetch_documents_for_queries(retriever, queries))

async def get_docs(query: str):
    output_parser = LineListOutputParser()

    llm = ChatOpenAI(
        temperature=0,
        max_tokens=800,
        model_kwargs={"top_p": 0, "frequency_penalty": 0, "presence_penalty": 0},
    )

    QUERY_PROMPT = PromptTemplate(
        input_variables=["question"],
        template="""You are an AI language model assistant specialized in software development and programming. Your task is to generate five detailed and specific questions related to the given user request for coding. These questions should only request specifically the documentation needed to implement the request. Your goal is to ensure you have all the documentation that would aid in solving the task at hand. If specific documentation for something is needed. Make sure to mention the name of it multiple times in a question. Provide these alternative questions separated by newlines. If the user's question is not coding related respond only with "I don't know".

        Original user request: {question}
        """
    )

    llm_chain = LLMChain(llm=llm, prompt=QUERY_PROMPT, output_parser=output_parser)

    embedding = OpenAIEmbeddings()

 
    fs = LocalFileStore("./store")
    store = create_kv_docstore(fs)

    child_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=50)
    parent_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)

    vectorstore = Chroma(
        collection_name="full_documents", embedding_function=embedding,
        persist_directory="./chroma_db"
    )
    retriever = ParentDocumentRetriever(
        vectorstore=vectorstore,
        docstore=store,
        child_splitter=child_splitter,
        parent_splitter=parent_splitter,
    )

    queries = llm_chain.invoke(query)["text"]
    print(queries)
    if any("I don't know" in query_response for query_response in queries):
        return ""
    # print(queries)
    # Pass the run_manager to aretrieve_documents
    unique_docs = await fetch_documents_for_queries(retriever=retriever, queries=queries)
    print(unique_docs)
  
    return "\n".join([result.page_content for result in unique_docs])


