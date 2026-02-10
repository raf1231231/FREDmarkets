import { MarketStatus } from "@/types/market";

const statusStyles: Record<MarketStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  resolved: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-purple-100 text-purple-800",
};

export default function MarketStatusBadge({ status }: { status: MarketStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
