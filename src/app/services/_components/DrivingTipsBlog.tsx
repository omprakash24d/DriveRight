import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  publishDate: string;
  tags: string[];
  image?: string;
}

interface DrivingTipsBlogProps {
  blogPosts?: BlogPost[];
}

export function DrivingTipsBlog({ blogPosts = [] }: DrivingTipsBlogProps) {
  // If no blog posts are provided, show a placeholder
  if (blogPosts.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <Badge
            variant="secondary"
            className="text-sm font-medium bg-emerald-100 text-emerald-800"
          >
            Driving Tips & Guides
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Expert Driving Tips & Insights
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Loading the latest driving tips, exam preparation guides, and
            industry insights from our certified instructors and experts.
          </p>
        </div>

        {/* Blog Categories - Static sections that don't need data */}
        <div className="grid md:grid-cols-4 gap-6 bg-gray-50 rounded-xl p-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Exam Guides</h4>
            <p className="text-sm text-gray-600">
              Complete preparation guides for LL and driving tests
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
              <Lightbulb className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Driving Tips</h4>
            <p className="text-sm text-gray-600">
              Expert tips for safe and confident driving
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Career Advice</h4>
            <p className="text-sm text-gray-600">
              Professional driving career opportunities and guidance
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Course Comparison</h4>
            <p className="text-sm text-gray-600">
              Compare different driving courses and make informed decisions
            </p>
          </div>
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
          <CardContent className="text-center p-8">
            <h3 className="text-2xl font-bold mb-4">
              Stay Updated with Driving Tips
            </h3>
            <p className="mb-6 opacity-90 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest driving tips, exam
              updates, and exclusive offers delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500"
              />
              <Button className="bg-white text-emerald-600 hover:bg-gray-100">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <Badge
          variant="secondary"
          className="text-sm font-medium bg-emerald-100 text-emerald-800"
        >
          Driving Tips & Guides
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Expert Driving Tips & Insights
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Stay updated with the latest driving tips, exam preparation guides,
          and industry insights from our certified instructors and experts.
        </p>
      </div>

      {/* Featured Article */}
      {blogPosts.length > 0 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-800">
                  Featured Article
                </Badge>
                <h3 className="text-2xl font-bold text-gray-900">
                  {blogPosts[0].title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(blogPosts[0].publishDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {blogPosts[0].readTime}
                  </div>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href={`/blog/${blogPosts[0].id}`}>
                    Read Full Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src={blogPosts[0].image || "/images/courses.png"}
                  alt={blogPosts[0].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blog Posts Grid */}
      {blogPosts.length > 1 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.slice(1).map((post) => (
            <Card
              key={post.id}
              className="group hover:shadow-lg transition-all duration-300"
            >
              {post.image && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-gray-800">
                      {post.category}
                    </Badge>
                  </div>
                </div>
              )}

              <CardHeader className="space-y-3">
                <CardTitle className="text-lg leading-tight group-hover:text-blue-600 transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(post.publishDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {post.readTime}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full group/button"
                >
                  <Link
                    href={`/blog/${post.id}`}
                    className="flex items-center justify-center"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Blog Categories */}
      <div className="grid md:grid-cols-4 gap-6 bg-gray-50 rounded-xl p-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Exam Guides</h4>
          <p className="text-sm text-gray-600">
            Complete preparation guides for LL and driving tests
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
            <Lightbulb className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Driving Tips</h4>
          <p className="text-sm text-gray-600">
            Expert tips for safe and confident driving
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Career Advice</h4>
          <p className="text-sm text-gray-600">
            Professional driving career opportunities and guidance
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Course Comparison</h4>
          <p className="text-sm text-gray-600">
            Compare different driving courses and make informed decisions
          </p>
        </div>
      </div>

      {/* Newsletter Signup */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
        <CardContent className="text-center p-8">
          <h3 className="text-2xl font-bold mb-4">
            Stay Updated with Driving Tips
          </h3>
          <p className="mb-6 opacity-90 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the latest driving tips, exam
            updates, and exclusive offers delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500"
            />
            <Button className="bg-white text-emerald-600 hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
