import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  course: string;
  rating: number;
  text: string;
  location: string;
  date: string;
  image?: string;
  verified: boolean;
}

interface ServicesTestimonialsProps {
  testimonials?: Testimonial[];
}

export function ServicesTestimonials({
  testimonials = [],
}: ServicesTestimonialsProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getCourseColor = (course: string) => {
    if (course.includes("MCWG")) return "bg-blue-100 text-blue-800";
    if (course.includes("LMV")) return "bg-green-100 text-green-800";
    if (course.includes("HMV")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  // If no testimonials are provided, show a placeholder message
  if (testimonials.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <Badge
            variant="secondary"
            className="text-sm font-medium bg-amber-100 text-amber-800"
          >
            Student Success Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            What Our Students Say
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Loading testimonials from our successful students...
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }, (_, starIndex) => (
                    <div
                      key={starIndex}
                      className="w-4 h-4 bg-gray-200 rounded"
                    ></div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <Badge
          variant="secondary"
          className="text-sm font-medium bg-amber-100 text-amber-800"
        >
          Student Success Stories
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          What Our Students Say
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Real testimonials from our successful students who have completed
          their driving training and achieved their goals with our expert
          guidance.
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card
            key={testimonial.id}
            className="group hover:shadow-lg transition-all duration-300 relative"
          >
            <CardContent className="p-6 space-y-4">
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-20">
                <Quote className="w-8 h-8 text-gray-400" />
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {renderStars(testimonial.rating)}
                </div>
                {testimonial.verified && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    Verified
                  </Badge>
                )}
              </div>

              {/* Testimonial Text */}
              <blockquote className="text-gray-700 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>

              {/* Student Info */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge
                    className={`text-xs ${getCourseColor(testimonial.course)}`}
                  >
                    {testimonial.course}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(testimonial.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Statistics - can be made dynamic too */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-8 md:p-12">
        <div className="text-center space-y-4 mb-12">
          <h3 className="text-2xl md:text-3xl font-bold">
            Student Success by the Numbers
          </h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Our commitment to excellence is reflected in our students&rsquo;
            achievements and satisfaction
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
              4.9/5
            </div>
            <div className="text-sm text-gray-300">Average Rating</div>
            <div className="text-xs text-gray-400 mt-1">
              From {testimonials.length}+ Reviews
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
              95%
            </div>
            <div className="text-sm text-gray-300">First-Time Pass</div>
            <div className="text-xs text-gray-400 mt-1">
              Driving Test Success
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
              100%
            </div>
            <div className="text-sm text-gray-300">Satisfied Students</div>
            <div className="text-xs text-gray-400 mt-1">Would Recommend</div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
              {testimonials.length}+
            </div>
            <div className="text-sm text-gray-300">Success Stories</div>
            <div className="text-xs text-gray-400 mt-1">Licensed Drivers</div>
          </div>
        </div>
      </div>

      {/* Course-wise Success - this can also be made dynamic */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-6 text-center">
            <h4 className="font-bold text-xl text-blue-900 mb-2">
              MCWG Training
            </h4>
            <div className="text-3xl font-bold text-blue-600 mb-1">98%</div>
            <p className="text-sm text-blue-700">Success Rate</p>
            <p className="text-xs text-blue-600 mt-2">
              Average completion: 2-3 weeks
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <h4 className="font-bold text-xl text-green-900 mb-2">
              LMV Training
            </h4>
            <div className="text-3xl font-bold text-green-600 mb-1">96%</div>
            <p className="text-sm text-green-700">Success Rate</p>
            <p className="text-xs text-green-600 mt-2">
              Average completion: 3-4 weeks
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-6 text-center">
            <h4 className="font-bold text-xl text-orange-900 mb-2">
              HMV Training
            </h4>
            <div className="text-3xl font-bold text-orange-600 mb-1">92%</div>
            <p className="text-sm text-orange-700">Success Rate</p>
            <p className="text-xs text-orange-600 mt-2">
              Average completion: 4-6 weeks
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
