
import type { HomepageStat } from "@/services/settingsService";
import { Award, Users, TrendingUp, type Icon } from "lucide-react";
import type { ElementType } from "react";

interface StatsSectionProps {
  stats: HomepageStat[];
}

const iconMap: { [key: string]: ElementType } = {
    TrendingUp,
    Users,
    Award,
};

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="w-full py-20 md:py-24 bg-secondary/30" aria-labelledby="stats-title">
        <div className="container mx-auto px-4 md:px-6">
            <h2 id="stats-title" className="sr-only">Our Achievements in Numbers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {stats.map((stat, index) => {
                    const IconComponent = iconMap[stat.icon] || TrendingUp;
                    return (
                        <div key={index} className="text-center" role="figure" aria-labelledby={`stat-label-${index}`}>
                            <div className="flex justify-center mb-4" aria-hidden="true"><IconComponent className="h-10 w-10 text-primary" /></div>
                            <p className="text-4xl font-bold text-primary">{stat.value}</p>
                            <p id={`stat-label-${index}`} className="text-base text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    </section>
  );
}
