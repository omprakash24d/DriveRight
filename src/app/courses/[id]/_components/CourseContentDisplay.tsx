
"use client";

import { useState } from 'react';
import type { Module } from '@/services/coursesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Video, FileText } from 'lucide-react';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';

export function CourseContentDisplay({ modules }: { modules: Module[] }) {
    const firstVideoId = modules[0]?.lessons[0]?.videoUrl;
    const [currentVideoId, setCurrentVideoId] = useState(firstVideoId);

    if (modules.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Course content is being prepared. Please check back soon!</p>
            </div>
        );
    }

    const videoSrc = currentVideoId ? {
      type: 'video' as const,
      sources: [
        {
          src: currentVideoId,
          provider: 'youtube' as const,
        },
      ],
    } : null;

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
        settings: ['captions', 'quality', 'speed', 'loop'] as const,
        youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card className="sticky top-20">
                    <CardContent className="p-2">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden [&_.plyr]:h-full">
                            {videoSrc ? (
                                <Plyr
                                    key={currentVideoId}
                                    source={videoSrc}
                                    options={plyrOptions}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                    <p>Select a lesson to begin.</p>
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
                                                    <button onClick={() => setCurrentVideoId(lesson.videoUrl)} className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${currentVideoId === lesson.videoUrl ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                <Video className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium">{lesson.title}</p>
                                                                <p className="text-xs text-muted-foreground">{lesson.description}</p>
                                                            </div>
                                                        </div>
                                                        {lesson.attachments && lesson.attachments.length > 0 && (
                                                            <div className="pl-10 mt-2 space-y-1">
                                                                {lesson.attachments.map(att => (
                                                                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                                                                        <FileText className="h-3 w-3"/>
                                                                        <span>{att.name}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </button>
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
