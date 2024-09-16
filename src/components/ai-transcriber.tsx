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
  const [summary, setSummary] = useState<string>("");
  const [summaryStatus, setSummaryStatus] = useState<string>("");

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

  const handleSummarize = async () => {
    if (formattedTranscript.length === 0) return;

    setSummaryStatus("Generating summary...");
    const response = await fetch("/api/summarize", {
      method: "POST",
      body: JSON.stringify(formattedTranscript),
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.message) {
              setSummaryStatus(data.message);
            } else if (data.summary) {
              setSummary(data.summary);
              setSummaryStatus("Summary generated");
            }
          } catch (error) {
            console.error("Error in stream processing:", error);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (formattedTranscript.length > 0) {
      handleSummarize();
    }
  }, [formattedTranscript]);

  useEffect(() => {
    console.log("Summary Status:", summaryStatus);
  }, [summaryStatus]);

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
            <Summary summary={summary} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
