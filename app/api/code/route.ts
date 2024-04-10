export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Assuming `messages` contains the structure your FastAPI endpoint expects.
    // Adjust the structure if needed based on FastAPI endpoint expectations.
    const payload = {
      messages: body.messages,
    };

    // Replace `localhost` with the appropriate domain if your API is hosted.
    const apiUrl = "http://localhost:8383/stream_chat/";

    // Making a POST request to the FastAPI endpoint
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      // Handling response errors (e.g., non-2xx status codes)
      throw new Error(`API response error: ${apiResponse.status}`);
    }

    // Assuming the response is a stream; adjust if your API returns JSON or another format
    const reader = apiResponse.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain" }, // Adjust based on your actual content type
    });
  } catch (error) {
    console.error(error);
    // Adjust error handling as necessary
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
