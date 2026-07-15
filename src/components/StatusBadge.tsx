interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  new: {
    label: "New",
    classes: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  contacted: {
    label: "Contacted",
    classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  qualified: {
    label: "Qualified",
    classes: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  converted: {
    label: "Converted",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  lost: {
    label: "Lost",
    classes: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    classes: "bg-gray-50 text-gray-700 ring-gray-600/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.classes}`}
    >
      {config.label}
    </span>
  );
}