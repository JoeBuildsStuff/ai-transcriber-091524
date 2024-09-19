"use client";
import { v4 as uuidv4 } from "uuid";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Word } from "./ai-transcriber";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as tus from "tus-js-client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

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
  const maxSizeInBytes = 50 * 1024 * 1024; // 50 MB

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
    setStatus("Validating File...");
    if (!file) {
      toast({
        title: "Error",
        description: "No file provided",
        variant: "destructive",
      });
      throw new Error("No file provided");
    }
  };

  const trimSilence = async (file: File): Promise<File> => {
    setStatus("Trimming Silence...");
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.AudioContext)();
      const reader = new FileReader();

      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0); // Assuming mono
        const threshold = 0.01; // Silence threshold
        let start = 0;
        let end = channelData.length;

        // Find the start index
        for (let i = 0; i < channelData.length; i++) {
          if (Math.abs(channelData[i]) > threshold) {
            start = i;
            break;
          }
        }

        // Find the end index
        for (let i = channelData.length - 1; i >= 0; i--) {
          if (Math.abs(channelData[i]) > threshold) {
            end = i;
            break;
          }
        }

        const trimmedLength = end - start;
        const trimmedBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          trimmedLength,
          audioBuffer.sampleRate
        );

        for (
          let channel = 0;
          channel < audioBuffer.numberOfChannels;
          channel++
        ) {
          trimmedBuffer.copyToChannel(
            audioBuffer.getChannelData(channel).slice(start, end),
            channel
          );
        }

        const wavBlob = await audioBufferToWav(trimmedBuffer);
        const trimmedFile = new File([wavBlob], file.name, {
          type: "audio/wav",
        });
        resolve(trimmedFile);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const convertToMono = async (file: File): Promise<File> => {
    setStatus("Converting to Mono...");
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.AudioContext)();
      const reader = new FileReader();

      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const numberOfChannels = 1; // Mono
        const monoBuffer = audioContext.createBuffer(
          numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );

        const channelData = new Float32Array(audioBuffer.length);

        for (
          let channel = 0;
          channel < audioBuffer.numberOfChannels;
          channel++
        ) {
          const data = audioBuffer.getChannelData(channel);
          for (let i = 0; i < data.length; i++) {
            channelData[i] += data[i] / audioBuffer.numberOfChannels;
          }
        }

        monoBuffer.copyToChannel(channelData, 0);

        const wavBlob = await audioBufferToWav(monoBuffer);
        const monoFile = new File([wavBlob], file.name, { type: "audio/wav" });
        resolve(monoFile);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const reduceSampleRate = async (
    file: File,
    newSampleRate = 22050
  ): Promise<File> => {
    setStatus("Reducing Sample Rate...");
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.AudioContext)();
      const reader = new FileReader();

      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const offlineContext = new OfflineAudioContext(
          1, // Mono
          audioBuffer.duration * newSampleRate,
          newSampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0);

        const resampledBuffer = await offlineContext.startRendering();

        const wavBlob = await audioBufferToWav(resampledBuffer);
        const resampledFile = new File([wavBlob], file.name, {
          type: "audio/wav",
        });
        resolve(resampledFile);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, length, true);

    // Write PCM audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        view.setInt16(
          offset + (i * numberOfChannels + channel) * 2,
          sample * 0x7fff,
          true
        );
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const ffmpeg = new FFmpeg();

  const processWithFFmpeg = async (file: File): Promise<File> => {
    setStatus("Processing with FFmpeg...");
    if (!ffmpeg.loaded) {
      await ffmpeg.load();
    }

    await ffmpeg.writeFile("input.mp3", await fetchFile(file));

    // Adjust command for MP3 input and output
    await ffmpeg.exec([
      "-i",
      "input.mp3",
      "-af",
      "silenceremove=1:0:-50dB",
      "-ac",
      "1",
      "-ar",
      "22050",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "64k",
      "output.mp3",
    ]);

    const data = await ffmpeg.readFile("output.mp3");
    return new File([data], "output.mp3", { type: "audio/mp3" });
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
          setStatus("Transcription Complete.");
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

    try {
      await validateFile(file);
      console.log("Max size in bytes:", maxSizeInBytes);
      console.log("File size before processing:", file.size);

      file = await processFileSize(file);

      if (file.size > maxSizeInBytes) {
        throw new Error("File size is still over 50 MB after processing.");
      }

      const fileName = `${uuidv4()}.${file.name.split(".").pop()}`;
      const filePath = await uploadFile(file, fileName);
      await processTranscription(filePath);
      setStatus("");
    } catch (error) {
      handleError(error);
    }
  };

  const processFileSize = async (file: File): Promise<File> => {
    if (file.size > maxSizeInBytes) {
      file = await convertToMp3(file);
      logAndToastFileSize("MP3 Conversion", file.size);
    }

    const processingSteps = [
      { name: "Trimming Silence", process: trimSilence },
      { name: "Converting to Mono", process: convertToMono },
      { name: "Reducing Sample Rate", process: reduceSampleRate },
      { name: "FFmpeg Processing", process: processWithFFmpeg },
    ];

    for (const step of processingSteps) {
      if (file.size <= maxSizeInBytes) break;

      file = await step.process(file);
      logAndToastFileSize(step.name, file.size);
    }

    return file;
  };

  const convertToMp3 = async (file: File): Promise<File> => {
    setStatus("Converting to MP3...");
    if (!ffmpeg.loaded) {
      await ffmpeg.load();
    }

    await ffmpeg.writeFile("input", await fetchFile(file));

    await ffmpeg.exec([
      "-i",
      "input",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      "output.mp3",
    ]);

    const data = await ffmpeg.readFile("output.mp3");
    return new File([data], "output.mp3", { type: "audio/mp3" });
  };

  const logAndToastFileSize = (stepName: string, fileSize: number) => {
    console.log(`File size after ${stepName.toLowerCase()}:`, fileSize);
    toast({
      title: `File Size After ${stepName}`,
      description: `File size: ${fileSize} bytes`,
      variant: "default",
    });
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
