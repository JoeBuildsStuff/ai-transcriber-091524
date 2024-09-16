import React from "react";

interface Word {
  speaker: number;
  start: number;
  punctuated_word: string;
}

interface SummaryProps {
  transcriptionResult: Word[] | null;
}

const Summary: React.FC<SummaryProps> = ({ transcriptionResult }) => {
  if (!transcriptionResult) return null;

  return (
    <div className="mx-5 h-full">
      <h2 className="text-xl font-bold mb-2">Meeting Summary:</h2>
      <div className="p-4 rounded overflow-auto h-[calc(100vh-200px)]">
        {transcriptionResult
          .reduce<string[]>((acc, word, index) => {
            if (
              index === 0 ||
              word.speaker !== transcriptionResult[index - 1].speaker
            ) {
              acc.push(
                `\n\nSpeaker ${word.speaker} (${word.start}): ${word.punctuated_word}`
              );
            } else {
              acc[acc.length - 1] += ` ${word.punctuated_word}`;
            }
            return acc;
          }, [])
          .map((line, index) => (
            <p className="my-2 py-2" key={index}>
              {line}
            </p>
          ))}
      </div>
    </div>
  );
};

export default Summary;
