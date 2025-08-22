// Default course data module
import type { Course } from "./courseTypes";

export const DEFAULT_COURSES: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Heavy Motor Vehicle (HMV) Training",
    description: "Professional training for heavy motor vehicles including trucks, buses, and commercial vehicles. Get certified to drive heavy vehicles safely and professionally.",
    price: "₹25000",
    value: "hmv",
    icon: "Truck",
    isActive: true,
    enrollmentCount: 0,
    rating: 0,
    modules: [
      {
        id: "mod1_hmv",
        title: "Module 1: Heavy Vehicle Fundamentals",
        lessons: [
          {
            id: "les11_hmv",
            title: "Understanding Heavy Motor Vehicles",
            videoUrl: "dQw4w9WgXcQ",
            description: "Comprehensive introduction to heavy motor vehicles, their types, and applications in commercial transport.",
            attachments: [
              { 
                id: 'att111_hmv', 
                name: "HMV Vehicle Types Guide.pdf", 
                url: "https://example.com/hmv-types.pdf" 
              }
            ]
          },
          {
            id: "les12_hmv",
            title: "Mastering the Air Brake System",
            videoUrl: "SJSe0TbdhHo",
            description: "A deep dive into the air brake system, a critical component of heavy vehicle safety. Includes practical exercises.",
            attachments: []
          }
        ]
      },
      {
        id: "mod2_hmv",
        title: "Advanced On-Road Skills",
        lessons: [
          {
            id: "les21_hmv",
            title: "Highway Driving and Defensive Techniques",
            videoUrl: "your_youtube_video_id_3",
            description: "Learn to safely manage your vehicle at high speeds, handle lane changes, and anticipate hazards on the highway.",
            attachments: []
          }
        ]
      }
    ]
  },
  {
    title: "Light Motor Vehicle (LMV) Training",
    description: "Everything you need to get your LMV license, from foundational theory to advanced on-road practice. This course covers all aspects of safe driving, preparing you for your test and beyond.",
    price: "₹15000",
    value: "lmv",
    icon: "Car",
    isActive: true,
    enrollmentCount: 0,
    rating: 0,
    modules: [
      {
        id: "mod1_lmv",
        title: "Module 1: Getting Started",
        lessons: [
          {
            id: "les11_lmv",
            title: "Introduction to Your Vehicle",
            videoUrl: "your_youtube_video_id_1",
            description: "Learn about the basic components of your car, from the dashboard controls to what's under the hood. A foundational lesson for every new driver.",
            attachments: [
              { 
                id: 'att111_lmv', 
                name: "Vehicle Pre-Drive Checklist.pdf", 
                url: "https://example.com/pre-drive-checklist.pdf" 
              }
            ]
          },
          {
            id: "les12_lmv",
            title: "Basic Controls: Steering, Pedals, and Gears",
            videoUrl: "your_youtube_video_id_2",
            description: "Master the fundamentals of controlling your vehicle smoothly and safely on our practice track before heading to the road.",
            attachments: []
          }
        ]
      },
      {
        id: "mod2_lmv",
        title: "Module 2: On-Road Skills",
        lessons: [
          {
            id: "les21_lmv",
            title: "Navigating Junctions and Roundabouts",
            videoUrl: "your_youtube_video_id_3",
            description: "Techniques for safely approaching, observing, and navigating different types of intersections and roundabouts.",
            attachments: [
              { 
                id: 'att211_lmv', 
                name: "Junction Priority Rules.pdf", 
                url: "https://example.com/junction-rules.pdf" 
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: "Motorcycle with Gear (MCWG) Training",
    description: "Master the art of two-wheeling with our comprehensive motorcycle course. We cover everything from basic balance and control to advanced safety maneuvers for city and highway riding.",
    price: "Free",
    value: "mcwg",
    icon: "Bike",
    isActive: true,
    enrollmentCount: 0,
    rating: 0,
    modules: [
      {
        id: "mod1_mcwg",
        title: "Module 1: Motorcycle Fundamentals",
        lessons: [
          {
            id: "les11_mcwg",
            title: "Motorcycle Controls and Balance",
            videoUrl: "your_youtube_video_id_4",
            description: "Learn the basics of motorcycle operation, from throttle control to maintaining balance at different speeds.",
            attachments: []
          },
          {
            id: "les12_mcwg",
            title: "Gear Shifting Techniques",
            videoUrl: "your_youtube_video_id_5",
            description: "Master smooth gear transitions and engine braking techniques for better control and fuel efficiency.",
            attachments: [
              { 
                id: 'att121_mcwg', 
                name: "Gear Shifting Pattern Chart.pdf", 
                url: "https://example.com/gear-chart.pdf" 
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: "Refresher Course",
    description: "Regain your confidence on the road. This course is perfect for licensed drivers who haven't driven in a while or want to brush up on specific skills like parking or highway driving.",
    price: "Free",
    value: "refresher",
    icon: "Route",
    isActive: true,
    enrollmentCount: 0,
    rating: 0,
    modules: [
      {
        id: "mod1_refresher",
        title: "Core Skills Review",
        lessons: [
          {
            id: "les11_ref",
            title: "Modern Vehicle Technology Update",
            videoUrl: "your_youtube_video_id_6",
            description: "A look at modern car features like ABS, airbags, and parking sensors to get you up to speed.",
            attachments: []
          },
          {
            id: "les12_ref",
            title: "Advanced Parking Techniques",
            videoUrl: "your_youtube_video_id_7",
            description: "Master parallel, perpendicular, and angle parking in a controlled environment.",
            attachments: [
              { 
                id: 'att121_ref', 
                name: "Parking Reference Guide.pdf", 
                url: "https://example.com/parking-guide.pdf" 
              }
            ]
          }
        ]
      }
    ]
  }
];

// Helper function to get course by value
export function getCourseByValue(value: string): Omit<Course, 'id' | 'createdAt' | 'updatedAt'> | undefined {
  return DEFAULT_COURSES.find(course => course.value === value);
}

// Helper function to get courses by category
export function getCoursesByCategory(category: string): Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[] {
  return DEFAULT_COURSES.filter(course => 
    course.value.toLowerCase().includes(category.toLowerCase())
  );
}

// Helper function to get free courses
export function getFreeCourses(): Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[] {
  return DEFAULT_COURSES.filter(course => 
    course.price.toLowerCase() === 'free'
  );
}

// Helper function to get paid courses
export function getPaidCourses(): Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[] {
  return DEFAULT_COURSES.filter(course => 
    course.price.toLowerCase() !== 'free'
  );
}

// Course metadata
export const COURSE_METADATA = {
  totalCourses: DEFAULT_COURSES.length,
  categories: [...new Set(DEFAULT_COURSES.map(course => course.value))],
  icons: [...new Set(DEFAULT_COURSES.map(course => course.icon))],
  priceRange: {
    min: 0,
    max: Math.max(...DEFAULT_COURSES
      .filter(course => course.price !== 'Free')
      .map(course => parseFloat(course.price.replace(/[^\d.]/g, '')) || 0)
    )
  },
  moduleCount: DEFAULT_COURSES.reduce((total, course) => total + course.modules.length, 0),
  lessonCount: DEFAULT_COURSES.reduce((total, course) => 
    total + course.modules.reduce((moduleTotal, module) => 
      moduleTotal + module.lessons.length, 0
    ), 0
  )
};
