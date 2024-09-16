"use client";

import { useState } from "react";
import AudioUpload from "@/components/audio-upload";
import Transcript from "@/components/transcript";
import Summary from "@/components/summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Word {
  speaker: number;
  start: number;
  punctuated_word: string;
  confidence: number;
  end: number;
  speaker_confidence: number;
  word: string;
}

export default function AITranscriber() {
  const [transcriptionResult, setTranscriptionResult] = useState<Word[] | null>(
    null
  );

  return (
    <>
      <div className="flex flex-col ">
        <section className="w-full">
          <AudioUpload onTranscriptionResult={setTranscriptionResult} />
        </section>
        <Tabs defaultValue="transcript" className="">
          <TabsList>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          <TabsContent value="transcript">
            <Transcript transcriptionResult={transcriptionResult} />
          </TabsContent>
          <TabsContent value="summary">
            <Summary transcriptionResult={transcriptionResult} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
