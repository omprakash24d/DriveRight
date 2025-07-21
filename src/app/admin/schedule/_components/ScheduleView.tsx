
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, PlusCircle, User, Car, Clock, Loader2 } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { getInstructors, type Instructor } from "@/services/instructorsService";
import { getStudents, type Student } from "@/services/studentsService";
import { addLesson, type Lesson, type NewLessonData } from "@/services/lessonsService";
import { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/form/select-field";
import { DatePickerField } from "@/components/form/date-picker-field";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";

const scheduleSchema = z.object({
  studentId: z.string({ required_error: "Please select a student." }),
  instructorId: z.string({ required_error: "Please select an instructor." }),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)."),
  notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleViewProps {
  initialLessons: any[]; // Expecting serialized data
}

export function ScheduleView({ initialLessons }: ScheduleViewProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons.map(l => ({...l, date: parseISO(l.date)})));

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      time: "",
      notes: ""
    }
  });
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch instructors and students once on component mount
  useEffect(() => {
    async function fetchInitialData() {
        setIsDataLoading(true);
        try {
            const [fetchedInstructors, fetchedStudents] = await Promise.all([
                getInstructors(),
                getStudents()
            ]);
            setInstructors(fetchedInstructors);
            setStudents(fetchedStudents.map(s => ({...s, joined: parseISO(s.joined as any)})));
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load instructors and students." });
        } finally {
            setIsDataLoading(false);
        }
    }
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshLessons = useCallback(async () => {
    setIsLessonsLoading(true);
    try {
        const response = await fetch('/api/admin/lessons');
        if (!response.ok) throw new Error("Failed to fetch lessons");
        const data = await response.json();
        const fetchedLessons = data.map((l: any) => ({...l, date: parseISO(l.date)}));
        setLessons(fetchedLessons);
    } catch (error: any) {
        console.error("Failed to fetch lessons:", error);
        toast({ variant: "destructive", title: "Error Fetching Schedule", description: "Could not refresh lessons." });
    } finally {
        setIsLessonsLoading(false);
    }
  }, [toast]);


  const handlePrevWeek = () => setCurrentDate(subDays(currentDate, 7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const onSubmit: SubmitHandler<ScheduleFormValues> = async (data) => {
    setIsSubmitting(true);
    
    const student = students.find(s => s.id === data.studentId);
    const instructor = instructors.find(i => i.id === data.instructorId);

    if (!student || !instructor) {
        toast({ variant: "destructive", title: "Error", description: "Selected student or instructor not found." });
        setIsSubmitting(false);
        return;
    }

    try {
        const newLesson: NewLessonData = {
            studentId: student.id,
            studentName: student.name,
            instructorId: instructor.id,
            instructorName: instructor.name,
            date: Timestamp.fromDate(data.date),
            time: data.time,
            notes: data.notes || '',
        };
        await addLesson(newLesson);
        
        setIsSubmitting(false);
        setIsDialogOpen(false);
        form.reset();
        await refreshLessons();

        toast({
            title: "Lesson Scheduled",
            description: "The new lesson has been added to the calendar.",
        });
    } catch (error) {
        console.error("Failed to schedule lesson:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not schedule the lesson." });
        setIsSubmitting(false);
    }
  };

  const weeklyLessons = lessons.filter(lesson => {
    const lessonDate = lesson.date;
    return lessonDate >= weekStart && lessonDate <= weekEnd;
  });
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Lesson Schedule</h1>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={isDataLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Schedule New Lesson
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Schedule a New Lesson</DialogTitle>
                    <DialogDescription>
                        Fill in the details to add a new lesson to the calendar.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <SelectField
                          control={form.control}
                          name="studentId"
                          label="Student"
                          placeholder="Select a student"
                          items={students.map(s => ({ value: s.id, label: s.name }))}
                          isRequired
                        />
                        <SelectField
                          control={form.control}
                          name="instructorId"
                          label="Instructor"
                          placeholder="Select an instructor"
                          items={instructors.map(i => ({ value: i.id, label: i.name }))}
                          isRequired
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <DatePickerField
                            control={form.control}
                            name="date"
                            label="Date"
                            isRequired
                           />
                           <InputField
                            control={form.control}
                            name="time"
                            label="Time"
                            placeholder="HH:MM"
                            isRequired
                           />
                        </div>
                        <TextareaField
                          control={form.control}
                          name="notes"
                          label="Notes (Optional)"
                          placeholder="e.g., Focus on parking"
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Schedule Lesson"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-center text-xl">
              {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {weekDays.map(day => (
            <div key={day.toString()} className="bg-background p-2 min-h-[200px]">
              <div className="font-bold text-center mb-2">{format(day, "eee")}</div>
              <div className="text-muted-foreground text-sm text-center mb-4">{format(day, "d")}</div>
              <div className="space-y-2">
                {isLessonsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  weeklyLessons
                    .filter(lesson => isSameDay(lesson.date, day))
                    .sort((a: any,b: any) => a.time.localeCompare(b.time))
                    .map((lesson: any) => (
                      <Card key={lesson.id} className="p-2 text-xs shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-bold flex items-center gap-1.5"><Clock className="h-3 w-3" />{lesson.time}</p>
                        <p className="flex items-center gap-1.5 text-primary font-medium"><User className="h-3 w-3" />{lesson.studentName}</p>
                        <p className="flex items-center gap-1.5 text-muted-foreground"><Car className="h-3 w-3" />{lesson.instructorName}</p>
                      </Card>
                    ))
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
