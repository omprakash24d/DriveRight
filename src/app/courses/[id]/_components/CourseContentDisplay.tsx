
"use client";

import { useState, useMemo } from 'react';
import type { Module } from '@/services/coursesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { VideoOff } from 'lucide-react';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';
import { LessonButton } from './LessonButton';

const plyrOptions = {
    controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'fullscreen'
    ],
    settings: ['captions', 'quality', 'speed', 'loop'],
    youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1
    }
};

export function CourseContentDisplay({ modules }: { modules: Module[] }) {
    const firstVideoUrl = modules?.[0]?.lessons?.[0]?.videoUrl || null;
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(firstVideoUrl);

    const videoSrc = useMemo(() => currentVideoUrl ? {
      type: 'video' as const,
      sources: [
        {
          src: currentVideoUrl,
          provider: 'youtube' as const,
        },
      ],
    } : null, [currentVideoUrl]);

    if (!modules || modules.length === 0 || modules.every(m => !m.lessons || m.lessons.length === 0)) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Course content is being prepared. Please check back soon!</p>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card className="sticky top-20">
                    <CardContent className="p-2">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden [&_.plyr]:h-full">
                            {videoSrc ? (
                                <Plyr
                                    key={currentVideoUrl}
                                    source={videoSrc}
                                    options={plyrOptions}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4 text-center">
                                    <VideoOff className="h-12 w-12 mb-4" />
                                    <p className="font-semibold">Video Unavailable</p>
                                    <p className="text-sm">Please select a lesson from the curriculum to begin.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader><CardTitle>Course Curriculum</CardTitle></CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="w-full">
                            {modules.map((module) => (
                                <AccordionItem value={module.id} key={module.id}>
                                    <AccordionTrigger className="text-base font-semibold">{module.title}</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-2 mt-2">
                                            {module.lessons.map(lesson => (
                                                <li key={lesson.id}>
                                                   <LessonButton
                                                        lesson={lesson}
                                                        isActive={currentVideoUrl === lesson.videoUrl}
                                                        onClick={() => setCurrentVideoUrl(lesson.videoUrl)}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
