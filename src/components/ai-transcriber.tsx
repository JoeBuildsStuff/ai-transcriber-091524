"use client";

import { useState, useEffect } from "react";
import AudioUpload from "@/components/audio-upload";
import Transcript from "@/components/transcript";
import Summary from "@/components/summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const [transcriptionResult, setTranscriptionResult] = useState<Word[] | null>(
    null
  );
  const [formattedTranscript, setFormattedTranscript] = useState<
    FormattedTranscriptGroup[]
  >([]);
  const [summary, setSummary] = useState<string>("");
  const [summaryStatus, setSummaryStatus] = useState<string>("");

  const [statusAudioUpload, setStatusAudioUpload] = useState<string>("");

  useEffect(() => {
    if (transcriptionResult) {
      try {
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
        setSummaryStatus("Transcript generated");
      } catch (error) {
        console.error("Error formatting transcript:", error);
        toast({
          title: "Error",
          description: "Failed to format transcript. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [transcriptionResult]);

  const handleSummarize = async () => {
    if (formattedTranscript.length === 0) {
      toast({
        title: "No transcript",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }

    setSummaryStatus("Requesting AI Summary.");
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        body: JSON.stringify(formattedTranscript),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const decoder = new TextDecoder();

      setSummaryStatus("Processing AI Summary.");
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
                setSummaryStatus("");
                toast({
                  title: "Summary generated",
                  description: "Your transcript has been summarized.",
                });
              }
            } catch (error) {
              console.error("Error in stream processing:", error);
              toast({
                title: "Error",
                description:
                  "Failed to process summary stream. Please try again.",
                variant: "destructive",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in summarization:", error);
      setSummaryStatus("");
      toast({
        title: "Summarization failed",
        description: "An error occurred while summarizing. Please try again.",
        variant: "destructive",
      });
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
      <div className="relative flex flex-col ">
        <div className="absolute right-0 top-2 flex flex-row space-x-2">
          {statusAudioUpload && (
            <Badge variant="outline" className="w-fit py-2 rounded-md">
              {statusAudioUpload}
            </Badge>
          )}
          {summaryStatus && (
            <Badge variant="outline" className="w-fit py-2 rounded-md">
              {summaryStatus}
            </Badge>
          )}
        </div>
        {/* {!summaryStatus && !statusAudioUpload && ( */}
        <section className="w-full ">
          <AudioUpload
            onTranscriptionResult={setTranscriptionResult}
            setStatus={setStatusAudioUpload}
          />
        </section>
        {/* )} */}
        {transcriptionResult && (
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
        )}
      </div>
    </>
  );
}
