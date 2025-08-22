"use client";

import { SiteSettings } from "@/services/settingsService";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Clock,
  MapPin,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";
import { useCallback, useEffect, useState } from "react";

interface AboutSectionProps {
  settings: SiteSettings;
  isAdmin?: boolean;
  studentStats?: {
    totalEnrollments: number;
    activeStudents: number;
    completedCourses: number;
  };
}

// Enhanced icon mapping with more options
const iconMap: { [key: string]: ElementType } = {
  TrendingUp,
  Users,
  Award,
  MapPin,
  Clock,
  Star,
  Shield,
  BookOpen,
};

// Animation variants for Framer Motion
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export function AboutSectionEnhanced({
  settings,
  isAdmin = false,
  studentStats,
}: AboutSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dynamicStats, setDynamicStats] = useState(settings.homepageStats);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const {
    homepageAboutTitle,
    homepageAboutText1,
    homepageAboutText2,
    homepageStats,
    schoolName,
  } = settings;

  // Update stats with real-time data if available
  useEffect(() => {
    if (studentStats) {
      const updatedStats = homepageStats.map((stat) => {
        if (stat.label.includes("Students")) {
          return {
            ...stat,
            value: `${studentStats.totalEnrollments.toLocaleString()}+`,
          };
        }
        if (stat.label.includes("Active")) {
          return { ...stat, value: `${studentStats.activeStudents}` };
        }
        return stat;
      });
      setDynamicStats(updatedStats);
    }
  }, [studentStats, homepageStats]);

  return (
    <section
      id="about"
      className="w-full py-20 md:py-24 bg-background relative overflow-hidden"
      aria-labelledby="about-title"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="grid md:grid-cols-2 gap-12 items-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          {/* Image Section with Enhanced Features */}
          <motion.div className="relative group" variants={fadeInUp}>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/images/3.jpeg"
                alt={`${schoolName} driving school building exterior - Professional driving instruction facility`}
                data-ai-hint="school building"
                width={600}
                height={400}
                className={`object-cover w-full h-auto transition-all duration-700 ${
                  imageLoaded ? "scale-100" : "scale-105"
                } group-hover:scale-105`}
                onLoad={handleImageLoad}
                priority
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />

              {/* Image overlay with quick actions for admin */}
              {isAdmin && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-2">
                    <Link
                      href="/admin/settings#about-section"
                      className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Edit Content
                    </Link>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      Change Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Trust indicators */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Certified School
                  </p>
                  <p className="text-xs text-gray-500">Licensed & Insured</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Section with Enhanced Features */}
          <motion.div
            className="order-first md:order-last space-y-6"
            variants={fadeInUp}
          >
            <div>
              <motion.h2
                id="about-title"
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
                variants={fadeInUp}
              >
                {homepageAboutTitle}
              </motion.h2>

              <motion.div
                className="space-y-4 text-muted-foreground mb-8"
                variants={fadeInUp}
              >
                <p className="text-lg leading-relaxed">{homepageAboutText1}</p>
                <p className="text-base leading-relaxed">
                  {homepageAboutText2}
                </p>
              </motion.div>
            </div>

            {/* Enhanced Stats Grid with Animation */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border/50"
              variants={staggerContainer}
            >
              {dynamicStats.map((stat, index) => {
                const IconComponent = iconMap[stat.icon] || TrendingUp;
                return (
                  <motion.div
                    key={index}
                    className="text-center group cursor-pointer hover:bg-gray-50/50 p-4 rounded-xl transition-all duration-300"
                    role="figure"
                    aria-labelledby={`stat-label-${index}`}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className="flex justify-center mb-3"
                      aria-hidden="true"
                    >
                      <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-primary mb-1">
                      {stat.value}
                    </p>
                    <p
                      id={`stat-label-${index}`}
                      className="text-sm text-muted-foreground font-medium"
                    >
                      {stat.label}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Call-to-Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-6"
              variants={fadeInUp}
            >
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                View Our Courses
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Visit Our School
              </Link>
            </motion.div>

            {/* Admin Quick Stats (only visible to admins) */}
            {isAdmin && studentStats && (
              <motion.div
                className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200"
                variants={fadeInUp}
              >
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Admin Overview
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-700">
                      {studentStats.totalEnrollments}
                    </p>
                    <p className="text-xs text-blue-600">Total Enrollments</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-700">
                      {studentStats.activeStudents}
                    </p>
                    <p className="text-xs text-blue-600">Active Students</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-700">
                      {studentStats.completedCourses}
                    </p>
                    <p className="text-xs text-blue-600">Completed Courses</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
