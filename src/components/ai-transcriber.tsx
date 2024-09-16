"use client";

import { useState, useEffect } from "react";
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

export interface FormattedTranscriptGroup {
  speaker: number;
  start: number;
  text: string;
}

export default function AITranscriber() {
  const [transcriptionResult, setTranscriptionResult] = useState<Word[] | null>(
    null
  );
  const [formattedTranscript, setFormattedTranscript] = useState<
    FormattedTranscriptGroup[]
  >([]);

  useEffect(() => {
    if (transcriptionResult) {
      const groupedTranscript = transcriptionResult.reduce((acc, word) => {
        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.speaker === word.speaker) {
          lastGroup.text += ` ${word.punctuated_word}`;
        } else {
          acc.push({
            speaker: word.speaker,
            start: word.start,
            text: word.punctuated_word,
          });
        }
        return acc;
      }, [] as FormattedTranscriptGroup[]);

      setFormattedTranscript(groupedTranscript);
    }
  }, [transcriptionResult]);

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
            <Transcript formattedTranscript={formattedTranscript} />
          </TabsContent>
          <TabsContent value="summary">
            <Summary formattedTranscript={formattedTranscript} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
