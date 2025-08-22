"use client";

import { Car, FileCheck2 } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  iconType: "training" | "online";
}

export function SectionHeader({
  title,
  subtitle,
  iconType,
}: SectionHeaderProps) {
  const Icon = iconType === "training" ? Car : FileCheck2;
  const gradientFrom =
    iconType === "training"
      ? "from-blue-500 to-blue-600"
      : "from-emerald-500 to-teal-600";
  const textGradient =
    iconType === "training"
      ? "from-blue-600 via-blue-700 to-blue-800"
      : "from-emerald-600 via-teal-600 to-blue-600";
  const lineGradient =
    iconType === "training"
      ? "from-blue-500 to-blue-600"
      : "from-emerald-500 to-teal-600";

  return (
    <div className="text-center mb-12 sm:mb-16">
      {/* Icon */}
      <div
        className={`inline-flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br ${gradientFrom} rounded-xl mb-6 shadow-sm`}
      >
        <Icon className="h-8 w-8 sm:h-9 sm:w-9 text-white" />
      </div>

      {/* Title */}
      <h2
        className={`text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r ${textGradient} bg-clip-text text-transparent mb-4 leading-tight`}
      >
        {title}
      </h2>

      {/* Decorative Line */}
      <div
        className={`w-20 sm:w-24 h-1 bg-gradient-to-r ${lineGradient} mx-auto mb-6 rounded-full`}
      ></div>

      {/* Subtitle */}
      <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}
