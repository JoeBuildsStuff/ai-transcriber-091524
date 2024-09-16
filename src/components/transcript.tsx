import React from "react";
import { FormattedTranscriptGroup } from "./ai-transcriber";
import { Badge } from "./ui/badge";

interface TranscriptProps {
  formattedTranscript: FormattedTranscriptGroup[];
}

const Transcript: React.FC<TranscriptProps> = ({ formattedTranscript }) => {
  if (formattedTranscript.length === 0) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getSpeakerColor = (speakerNumber: number) => {
    const colors = [
      "bg-blue-400/20 border-blue-600 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      "bg-green-400/20 border-green-600 text-green-800 dark:bg-green-900 dark:text-green-100",
      "bg-yellow-400/20 border-yellow-600 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      "bg-red-400/20 border-red-600 text-red-800 dark:bg-red-900 dark:text-red-100",
      "bg-purple-400/20 border-purple-600 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      "bg-pink-400/20 border-pink-600 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
      "bg-indigo-400/20 border-indigo-600 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
      "bg-teal-400/20 border-teal-600 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
    ];
    return colors[speakerNumber % colors.length];
  };

  return (
    <div className="mx-2 h-full">
      <div className="p-2 rounded overflow-auto h-[calc(100vh-200px)]">
        {formattedTranscript.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={`${getSpeakerColor(
                  group.speaker
                )} border font-medium rounded-md`}
              >
                Speaker {group.speaker}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatTime(group.start)}
              </span>
            </div>
            <p className="ml-4">{group.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transcript;
