"use client";

import React, { useEffect, useState } from "react";
import { FormattedTranscriptGroup } from "./ai-transcriber";

interface SummaryProps {
  formattedTranscript: FormattedTranscriptGroup[];
}

const Summary: React.FC<SummaryProps> = ({ formattedTranscript }) => {
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    handleSummarize();
  }, [formattedTranscript]);

  //when formattedTranscript is ready, call the /summarize endpoint
  //and pass in the formattedTranscript
  //and set the summary to the summary state
  const handleSummarize = async () => {
    const response = await fetch("/api/summarize", {
      method: "POST",
      body: JSON.stringify(formattedTranscript),
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    let buffer = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.summary) {
              setSummary(data.summary);
            }
          } catch (error) {
            console.error("Error in stream processing:", error);
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
  };

  console.log(formattedTranscript);

  return (
    <div className="mx-5 h-full">
      <h2 className="text-xl font-bold mb-2">Meeting Summary</h2>
      <div className="p-4 rounded overflow-auto h-[calc(100vh-200px)]">
        {/* render the raw api response summary here */}
        {summary}
      </div>
    </div>
  );
};

export default Summary;
