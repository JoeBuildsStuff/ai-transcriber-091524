"use client";
import { v4 as uuidv4 } from "uuid";
import { createClient as supabaseClient } from "@/utils/supabase/client";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";

import { Word } from "./ai-transcriber";

const supabase = supabaseClient();

interface AudioUploadProps {
  onTranscriptionResult: (result: Word[] | null) => void;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onTranscriptionResult }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileAccepted(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".ogg"],
    },
    multiple: false,
  });

  const handleFileAccepted = async (file: File) => {
    const fileName = `${uuidv4()}.${file.name.split(".").pop()}`;
    const { data, error } = await supabase.storage
      .from("ai-transcriber-audio")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    console.log("handleFileAccepted data", data);

    if (error) {
      console.error("Error uploading file:", error);
      return;
    }

    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath: data.path }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Transcription error:", errorData);
      // Handle the error appropriately (e.g., show an error message to the user)
      return;
    }

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
            if (data.status) {
              console.log(data.status);
            } else {
              onTranscriptionResult(
                data.results.channels[0].alternatives[0].words
              );
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
  };

  return (
    <div
      {...getRootProps()}
      className="max-w-lg mx-5 sm:mx-auto border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the audio file here ...</p>
      ) : (
        <div className="space-y-2">
          <p className="my-2">
            Drag n drop an audio file here, or click to select a file
          </p>
          <Button type="button">Select Audio File</Button>
        </div>
      )}
    </div>
  );
};

export default AudioUpload;
