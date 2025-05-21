import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Error Code */}
      <div className="text-8xl font-bold text-gray-200 mb-8">404</div>

      {/* Content */}
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
      </div>

      {/* Return Home Button */}
      <Link href="/">
        <Button variant="default" className="flex items-center gap-2">
          <HomeIcon className="h-4 w-4" />
          Return Home
        </Button>
      </Link>
    </div>
  );
}
