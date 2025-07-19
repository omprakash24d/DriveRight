
import type { Metadata } from 'next';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAvatarColor } from "@/lib/utils";
import { getInstructors } from "@/services/instructorsService";
import { User } from "lucide-react";

export const metadata: Metadata = {
  title: 'Meet Our Expert Instructors',
  description: 'Our team of certified, experienced, and friendly driving instructors is dedicated to providing you with the best learning experience.',
};

export default async function InstructorsPage() {
  const instructors = await getInstructors();
  
  const instructorsWithSpecialties = instructors.map((instructor) => ({
    ...instructor,
    specialties: instructor.specialties.split(',').map(s => s.trim()).filter(Boolean),
  }));
  
  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Meet Our Expert Instructors
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Our team of certified, experienced, and friendly instructors is dedicated to your success on the road.
        </p>
      </div>

      {instructorsWithSpecialties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructorsWithSpecialties.map((instructor) => (
            <Card key={instructor.id} className="flex flex-col text-center hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="items-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={instructor.avatar} alt={instructor.name} />
                    <AvatarFallback style={{ backgroundColor: generateAvatarColor(instructor.name) }}>
                    <User className="h-10 w-10 text-primary" />
                    </AvatarFallback>
                </Avatar>
                <CardTitle>{instructor.name}</CardTitle>
                <CardDescription>{instructor.experience}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                <p className="text-muted-foreground">{instructor.bio}</p>
                </CardContent>
                <CardContent>
                    <div className="flex justify-center flex-wrap gap-2">
                        {instructor.specialties.map((specialty, i) => (
                            <Badge key={i} variant="secondary">{specialty}</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>
        ) : (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No instructors have been added yet. Please check back later.</p>
            </div>
        )
      }
    </div>
  );
}
