const colorMap: Record<string, string> = {
  // Kandidaat statussen
  Beschikbaar: "bg-green-100 text-green-800",
  "Niet beschikbaar": "bg-red-100 text-red-800",
  "In afwachting": "bg-yellow-100 text-yellow-800",
  // Bedrijf statussen
  "Actief contract": "bg-green-100 text-green-800",
  "In aansluiting": "bg-blue-100 text-blue-800",
  Prospect: "bg-gray-100 text-gray-800",
  // Introductie statussen
  "Niet gestuurd": "bg-gray-100 text-gray-600",
  "Ge\u00efntroduceerd": "bg-blue-100 text-blue-800",
  Uitgenodigd: "bg-purple-100 text-purple-800",
  "Gesprek geweest": "bg-indigo-100 text-indigo-800",
  "Afgewezen door bedrijf": "bg-red-100 text-red-800",
  "Afgewezen door kandidaat": "bg-orange-100 text-orange-800",
  Geplaatst: "bg-green-100 text-green-800",
  // Match groepen
  Direct: "bg-green-100 text-green-800",
  Mogelijk: "bg-yellow-100 text-yellow-800",
  Breed: "bg-gray-100 text-gray-700",
};

interface BadgeProps {
  label: string;
  className?: string;
}

export default function Badge({ label, className = "" }: BadgeProps) {
  const color = colorMap[label] || "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}
    >
      {label}
    </span>
  );
}
