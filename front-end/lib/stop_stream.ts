// Function to stop the stream
export async function stopStream() {
  try {
    const stopUrl = "http://localhost:8383/stop_stream/";
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
  } catch (error) {
    console.error("Error stopping the stream:", error);
  }
}
