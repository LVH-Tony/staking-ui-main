import { useState } from "react";
import { Clipboard, Check } from "lucide-react";

export default function ClickToCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-1 py-1 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      {copied ? (
        <span title="Copied!">
          <Check className="w-4 h-4 text-green-500" />
        </span>
      ) : (
        <span title="Click to copy">
          <Clipboard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </span>
      )}
    </button>
  );
}
