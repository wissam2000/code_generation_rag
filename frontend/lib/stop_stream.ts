// This function should be defined in the same component file where your Button is, or imported into it.

export async function stopStream() {
  console.log("Trying to stop the stream via API route...");
  try {
    // Note: The URL is relative, pointing to the Next.js API route.
    const response = await fetch("/api/stopStream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // If the response is not ok, throw an error with the status text
      throw new Error(`Failed to stop the stream: ${response.statusText}`);
    }

    // Optionally, parse the response data
    const data = await response.text(); // or response.json() if you return JSON
    console.log("Stream stopped successfully:", data);
  } catch (error) {
    console.error("Error stopping the stream:", error);
  }
}
