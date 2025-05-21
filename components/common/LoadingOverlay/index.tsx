import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // ShadCN utility for conditional classes
import { Shell } from "lucide-react";

interface IProps {
  isLoading: boolean;
  message?: string;
  onCancel?: () => void;
}

export default function LoadingOverlay({
  isLoading,
  message,
  onCancel,
}: IProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-opacity-50 transition-opacity z-[1000]",
        isLoading ? "opacity-100 backdrop-blur visible" : "opacity-0 invisible",
      )}
    >
      <Shell className="w-12 h-12 text-primary opacity-80 animate-spin" />
      {message && (
        <p className="mt-4 font-semibold text-sm text-primary text-center">
          {message}
        </p>
      )}
      {onCancel && (
        <Button onClick={onCancel} variant="link" className="mt-2 text-red-500">
          Cancel
        </Button>
      )}
    </div>
  );
}
