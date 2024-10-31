export async function GET() {
  const encoder = new TextEncoder();
  const message = "Deploy To Koyeb";
  // Create a streaming response
  const customReadable = new ReadableStream({
    async start(controller) {
      // Emit three notifications after 1 second each
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      await new Promise((r) => setTimeout(r, 1000));
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      await new Promise((r) => setTimeout(r, 1000));
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      // Close the stream after sending the three notifications
      controller.close();
    },
  });
  // Return the stream response and keep the connection alive
  return new Response(customReadable, {
    // Set the headers for Server-Sent Events (SSE)
    headers: {
      Connection: "keep-alive",
      "Content-Encoding": "none",
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
