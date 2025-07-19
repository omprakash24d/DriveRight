
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateAvatarColor } from '@/lib/utils';
import type { Instructor } from '@/services/instructorsService';
import { User, ArrowRight } from 'lucide-react';

interface TeamSectionProps {
  instructors: Instructor[];
}

export function TeamSection({ instructors }: TeamSectionProps) {
  // Show a max of 4 instructors on the about page for a preview
  const featuredInstructors = instructors.slice(0, 4);

  return (
    <section className="w-full py-20 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Meet Our Expert Team</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Our instructors are the best in the business, dedicated to your success.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredInstructors.map((instructor) => (
            <Card key={instructor.id} className="text-center">
              <CardHeader className="items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={instructor.avatar} alt={instructor.name} />
                  <AvatarFallback style={{ backgroundColor: generateAvatarColor(instructor.name) }}>
                    <User className="h-10 w-10 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{instructor.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3">{instructor.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {instructors.length > 4 && (
            <div className="mt-12 text-center">
                <Button asChild>
                    <Link href="/instructors">
                        Meet All Instructors <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        )}
      </div>
    </section>
  );
}
