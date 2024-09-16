import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(body);
    
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Your stream processing logic here
          // For example:
          for (let i = 0; i < 5; i++) {
            const chunk = { message: `Chunk ${i}` };
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
          }
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Error in stream processing:", error);
          controller.error(error);
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
