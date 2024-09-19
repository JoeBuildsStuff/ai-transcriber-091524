"use client";
import { v4 as uuidv4 } from "uuid";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Word } from "./ai-transcriber";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as tus from "tus-js-client";

interface AudioUploadProps {
  onTranscriptionResult: (result: Word[] | null) => void;
  setStatus: (status: string) => void;
}

const AudioUpload: React.FC<AudioUploadProps> = ({
  onTranscriptionResult,
  setStatus,
}) => {
  const { toast } = useToast();
  const [isFileDropped, setIsFileDropped] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setIsFileDropped(true);
        setStatus("Dropped File...");
        handleFileAccepted(acceptedFiles[0]);
      } else {
        toast({
          title: "Error",
          description: "No file was dropped. Please try again.",
          variant: "destructive",
        });
      }
    },
    [setStatus, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [
        ".mp3",
        ".mp4",
        ".mp2",
        ".aac",
        ".wav",
        ".flac",
        ".pcm",
        ".m4a",
        ".ogg",
        ".opus",
        ".webm",
      ],
    },
    multiple: false,
  });

  const validateFile = (file: File) => {
    if (!file) {
      throw new Error("No file provided");
    }
  };

  const uploadFile = async (file: File, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "x-upsert": "true", // Set to 'true' if you want to overwrite existing files
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: "ai-transcriber-audio",
          objectName: fileName,
          contentType: file.type,
          cacheControl: "3600",
        },
        chunkSize: 6 * 1024 * 1024, // 6MB chunk size
        onError: (error) => {
          console.error("Failed because: " + error);
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          console.log(`Uploading: ${percentage}%`);
          setStatus(`Uploading: ${percentage}%`);
        },
        onSuccess: () => {
          console.log("Download %s from %s", file.name, upload.url);
          resolve(fileName);
        },
      });

      // Check for previous uploads to resume
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      });
    });
  };

  const processTranscription = async (filePath: string) => {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Transcription error: ${errorData.message}`);
    }

    await handleTranscriptionStream(response);
  };

  const handleTranscriptionStream = async (response: Response) => {
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("Failed to get reader from response body");
    }

    let buffer = "";
    const decoder = new TextDecoder();

    while (true) {
      setStatus("Reading Transcription...");
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        await processTranscriptionChunk(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
    }
  };

  const processTranscriptionChunk = async (chunk: string) => {
    setStatus("Processing Transcription...");
    if (chunk.startsWith("data: ")) {
      try {
        const data = JSON.parse(chunk.slice(6));
        if (data.status) {
          setStatus(data.status);
          console.log(data.status);
        } else if (
          data.results &&
          data.results.channels &&
          data.results.channels[0]?.alternatives
        ) {
          setStatus("");
          onTranscriptionResult(data.results.channels[0].alternatives[0].words);
        } else {
          throw new Error("Unexpected data format from transcriber");
        }
      } catch (error) {
        setStatus("Error from Transcriber.");
        console.error("Error parsing JSON:", error);
        throw error;
      }
    }
  };

  const handleError = (error: unknown) => {
    console.error("Error in file handling:", error);
    setStatus("An error occurred. Please try again.");
    toast({
      title: "Error",
      description:
        error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    setIsFileDropped(false);
  };

  const handleFileAccepted = async (file: File) => {
    setStatus("Handling File...");
    const fileName = `${uuidv4()}.${file.name.split(".").pop()}`;
    try {
      await validateFile(file);
      const filePath = await uploadFile(file, fileName);
      await processTranscription(filePath);
      setStatus("");
    } catch (error) {
      handleError(error);
    }
  };

  const handleNewFile = () => {
    setIsFileDropped(false);
    setStatus("");
  };

  return (
    <>
      {isFileDropped ? (
        <div className="my-2">
          <Button
            variant="link"
            className="p-0 m-0 h-fit w-fit"
            onClick={handleNewFile}
          >
            <ArrowLeft className="w-4 h-4 mr-2 flex-none" /> New File
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`max-w-lg m-5 sm:mx-auto border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400"
              : "border-border hover:border-blue-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <p className="my-2">
              Drag n drop an audio file here, or click to select a file
            </p>
            <Button variant="outline" type="button">
              Select Audio File
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AudioUpload;
