// Function to stop the stream
export async function POST(req: Request) {
  console.log("trying to stop stream...");
  try {
    const stopUrl = `${process.env.API_END_POINT}/stop_stream/`;
    const response = await fetch(stopUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to stop the stream: ${response.statusText}`);
    }

    console.log("Stream stopped successfully");
    return new Response("it stopped");
  } catch (error) {
    console.error("Error stopping the stream:", error);
  }
}
