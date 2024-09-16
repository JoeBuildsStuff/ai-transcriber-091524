import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@deepgram/sdk";

export const runtime = 'edge';

// Initialize Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file uploaded');
    }

    const arrayBuffer = await file.arrayBuffer();

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial processing message
          controller.enqueue(encoder.encode('data: {"status": "Processing started"}\n\n'));

          // Call Deepgram API
          const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            Buffer.from(arrayBuffer),
            {
              model: "nova-2",
              diarize: true,
              punctuate: true,
              utterances: true,
            }
          );

          if (error) {
            throw error;
          }

          console.log("Full Deepgram result:", result);

          // Send the complete result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));

          controller.enqueue(encoder.encode('data: {"status": "Processing completed"}\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in stream processing:', error);
          controller.error(error);
        }
      }
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

const encoder = new TextEncoder();
