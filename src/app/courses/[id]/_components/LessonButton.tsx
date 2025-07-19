
"use client";

import type { Lesson } from "@/services/coursesService";
import { cn } from "@/lib/utils";
import { Video, FileText } from "lucide-react";

interface LessonButtonProps {
    lesson: Lesson;
    isActive: boolean;
    onClick: () => void;
}

export function LessonButton({ lesson, isActive, onClick }: LessonButtonProps) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-pressed={isActive}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    'p-2 rounded-full', 
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
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
                        <a 
                            key={att.id} 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()} // Prevent the link click from triggering the button's onClick
                            className="flex items-center gap-2 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                        >
                            <FileText className="h-3 w-3"/>
                            <span>{att.name}</span>
                        </a>
                    ))}
                </div>
            )}
        </button>
    );
}
