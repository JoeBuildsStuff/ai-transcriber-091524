import { NextRequest, NextResponse } from 'next/server';
import { createClient as deepgramClient } from "@deepgram/sdk";
import { createClient as supabaseClient } from "@/utils/supabase/server";

export const runtime = 'edge';

// Initialize Deepgram client
const deepgram = deepgramClient(process.env.DEEPGRAM_API_KEY!);


export async function POST(req: NextRequest) {

  console.log('Received request to transcribe');

  try {

    const supabase = supabaseClient();

    const { filePath } = await req.json();

    if (!filePath) {
      throw new Error('No file path provided');
    }

    const { data, error } = await supabase.storage
      .from('ai-transcriber-audio')
      .download(filePath);

    if (error) {
      console.error('Supabase download error:', error);
      throw error;
    }

    console.log('File downloaded successfully');

    const arrayBuffer = await data.arrayBuffer();

    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

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


    // Delete the file after processing
    const { data: deletedData, error: deleteError } = await supabase.storage
      .from('ai-transcriber-audio')
      .remove([filePath]);

    console.log('File deleted successfully:', deletedData);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
    }

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'An error occurred', details: error }, { status: 500 });
  }
}

const encoder = new TextEncoder();
