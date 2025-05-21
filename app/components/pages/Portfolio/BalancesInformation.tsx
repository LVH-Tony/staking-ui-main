import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface BalancesInformationProps {
  netUid: number;
}

export default function BalancesInformation({
  netUid,
}: BalancesInformationProps) {
  return (
    <div>
      <Link
        href={{
          pathname: "/wallet/history",
          query: {
            subnets: netUid.toString(),
            type: "all",
            timeRange: "all",
          },
        }}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Details
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
