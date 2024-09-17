"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { Copy, SquareCheckBig } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SummaryProps {
  summary: string;
}

const Summary: React.FC<SummaryProps> = ({ summary }) => {
  const { toast } = useToast();
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [copyIcon, setCopyIcon] = useState<"copy" | "check">("copy");

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(summary);
    toast({
      title: "Copied to clipboard",
      description: "Summary copied to clipboard",
    });

    setCopyButtonText("Copied");
    setCopyIcon("check");
    setTimeout(() => {
      setCopyButtonText("Copy");
      setCopyIcon("copy");
    }, 2000);
  };

  return (
    <div className="mx-5 h-full relative">
      <Button
        variant="ghost"
        className="absolute -top-10 right-0"
        onClick={copyToClipboard}
      >
        {copyIcon === "copy" ? (
          <Copy className="w-4 h-4 mr-2 flex-none" />
        ) : (
          <SquareCheckBig className="w-4 h-4 mr-2 flex-none" />
        )}
        {copyButtonText}
      </Button>
      <div className="p-4 rounded overflow-auto h-[calc(100vh-200px)]">
        {summary ? (
          <div className="prose prose-md max-w-none dark:prose-invert">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{summary}</ReactMarkdown>
          </div>
        ) : (
          <p>Waiting for summary...</p>
        )}
      </div>
    </div>
  );
};

export default Summary;
