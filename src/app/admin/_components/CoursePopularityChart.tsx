
"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { CardDescription } from '@/components/ui/card';

interface CoursePopularityData {
    name: string;
    value: number;
    fill: string;
}

interface CoursePopularityChartProps {
    data: CoursePopularityData[];
}

export function CoursePopularityChart({ data }: CoursePopularityChartProps) {
    if (!data) {
        return <Skeleton className="h-[250px] w-full" />;
    }
    
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[250px]">
                <CardDescription>No enrollment data available yet.</CardDescription>
            </div>
        );
    }
    
    const chartConfig = useMemo(() => {
        return data.reduce((acc, item) => {
            acc[item.name] = { label: item.name, color: item.fill };
            return acc;
        }, {} as ChartConfig);
    }, [data]);

    const cells = useMemo(() => {
        return data.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
        ));
    }, [data]);

    return (
        <ChartContainer 
          config={chartConfig} 
          className="mx-auto aspect-square h-[250px]"
          role="img"
          aria-label={`Pie chart showing course popularity. The sections are: ${data.map(d => `${d.name} with ${d.value} enrollments`).join(', ')}.`}
        >
            <PieChart>
                <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                      }) => {
                        const RADIAN = Math.PI / 180
                        const radius = 25 + innerRadius + (outerRadius - innerRadius)
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
               
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="hsl(var(--foreground))"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            className="text-xs font-medium"
                          >
                            {data[index].name} ({value})
                          </text>
                        )
                      }}
                >
                    {cells}
                </Pie>
            </PieChart>
        </ChartContainer>
    );
}
