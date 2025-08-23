"use client";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  iconType?: string;
}
export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="text-center mb-12 sm:mb-16">
      {/* Title */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
        {title}
      </h2>

      {/* Divider Line */}
      <div className="w-20 sm:w-24 h-1 bg-gray-200 dark:bg-gray-700 mx-auto mb-6 rounded-full"></div>

      {/* Subtitle */}
      <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}
