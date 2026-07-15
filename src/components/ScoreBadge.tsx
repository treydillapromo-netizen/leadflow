interface ScoreBadgeProps {
  score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-emerald-100 text-emerald-800";
    if (s >= 60) return "bg-green-100 text-green-800";
    if (s >= 40) return "bg-amber-100 text-amber-800";
    if (s >= 20) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getColor(score)}`}
    >
      {score}
    </span>
  );
}