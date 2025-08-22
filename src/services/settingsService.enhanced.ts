// Enhanced settings service with real-time stats and caching
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, onSnapshot, query } from "firebase/firestore";

export interface HomepageStat {
  icon: string;
  value: string;
  label: string;
  realTimeKey?: string; // For linking to real-time data
  isRealTime?: boolean;
}

export interface AboutSectionMetrics {
  totalEnrollments: number;
  activeStudents: number;
  completedCourses: number;
  passRate: number;
  avgRating: number;
  yearsActive: number;
}

// Enhanced settings service
export class SettingsServiceEnhanced {
  private static instance: SettingsServiceEnhanced;
  private settingsCache: any = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SettingsServiceEnhanced {
    if (!SettingsServiceEnhanced.instance) {
      SettingsServiceEnhanced.instance = new SettingsServiceEnhanced();
    }
    return SettingsServiceEnhanced.instance;
  }

  // Get settings with caching
  async getSettings(useCache = true): Promise<any> {
    const now = Date.now();
    
    if (useCache && this.settingsCache && now < this.cacheExpiry) {
      return this.settingsCache;
    }

    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'siteConfiguration'));
      const settings = settingsDoc.exists() ? settingsDoc.data() : null;
      
      // Update cache
      this.settingsCache = settings;
      this.cacheExpiry = now + this.CACHE_DURATION;
      
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return this.settingsCache; // Return cached version if available
    }
  }

  // Get real-time about section metrics
  async getAboutSectionMetrics(): Promise<AboutSectionMetrics> {
    try {
      // Parallel queries for better performance
      const [enrollments, students, results] = await Promise.all([
        this.getTotalEnrollments(),
        this.getActiveStudents(),
        this.getPassRateData()
      ]);

      const schoolFoundedYear = 2014; // This should come from settings
      const yearsActive = new Date().getFullYear() - schoolFoundedYear;

      return {
        totalEnrollments: enrollments,
        activeStudents: students.active,
        completedCourses: students.completed,
        passRate: results.passRate,
        avgRating: results.avgRating,
        yearsActive
      };
    } catch (error) {
      console.error('Error fetching about section metrics:', error);
      // Return default values
      return {
        totalEnrollments: 0,
        activeStudents: 0,
        completedCourses: 0,
        passRate: 0,
        avgRating: 0,
        yearsActive: 10
      };
    }
  }

  private async getTotalEnrollments(): Promise<number> {
    // Return 0 during build or when Firestore is not accessible
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return 0;
    }
    
    try {
      const enrollmentsQuery = query(collection(db, 'enrollments'));
      const snapshot = await getDocs(enrollmentsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return 0;
    }
  }

  private async getActiveStudents(): Promise<{ active: number; completed: number }> {
    // Return defaults during build or when Firestore is not accessible
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return { active: 0, completed: 0 };
    }
    
    try {
      const studentsQuery = query(collection(db, 'students'));
      const snapshot = await getDocs(studentsQuery);
      
      let active = 0;
      let completed = 0;
      
      snapshot.forEach(doc => {
        const student = doc.data();
        if (student.status === 'active') active++;
        if (student.status === 'completed') completed++;
      });

      return { active, completed };
    } catch (error) {
      console.error('Error fetching student data:', error);
      return { active: 0, completed: 0 };
    }
  }

  private async getPassRateData(): Promise<{ passRate: number; avgRating: number }> {
    // Return defaults during build or when Firestore is not accessible
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return { passRate: 92, avgRating: 4.5 };
    }
    
    try {
      const resultsQuery = query(collection(db, 'testResults'));
      const snapshot = await getDocs(resultsQuery);
      
      let totalTests = 0;
      let passedTests = 0;
      let totalRating = 0;
      let ratingCount = 0;
      
      snapshot.forEach(doc => {
        const result = doc.data();
        totalTests++;
        if (result.passed) passedTests++;
        if (result.rating) {
          totalRating += result.rating;
          ratingCount++;
        }
      });

      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
      const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      return { passRate, avgRating };
    } catch (error) {
      console.error('Error fetching pass rate data:', error);
      return { passRate: 0, avgRating: 0 };
    }
  }

  // Update homepage stats with real-time data
  async getEnhancedHomepageStats(baseStats: HomepageStat[]): Promise<HomepageStat[]> {
    try {
      const metrics = await this.getAboutSectionMetrics();
      
      return baseStats.map(stat => {
        // Update stats based on real-time data
        if (stat.label.toLowerCase().includes('students') || stat.label.toLowerCase().includes('trained')) {
          return { ...stat, value: `${metrics.totalEnrollments.toLocaleString()}+`, isRealTime: true };
        }
        if (stat.label.toLowerCase().includes('pass rate') || stat.label.toLowerCase().includes('success')) {
          return { ...stat, value: `${metrics.passRate}%`, isRealTime: true };
        }
        if (stat.label.toLowerCase().includes('years') || stat.label.toLowerCase().includes('experience')) {
          return { ...stat, value: `${metrics.yearsActive}+`, isRealTime: true };
        }
        if (stat.label.toLowerCase().includes('rating') || stat.label.toLowerCase().includes('satisfaction')) {
          return { ...stat, value: `${metrics.avgRating.toFixed(1)}/5`, isRealTime: true };
        }
        return stat;
      });
    } catch (error) {
      console.error('Error enhancing homepage stats:', error);
      return baseStats;
    }
  }

  // Clear cache (useful for admin updates)
  clearCache(): void {
    this.settingsCache = null;
    this.cacheExpiry = 0;
  }

  // Subscribe to settings changes (for real-time updates)
  subscribeToSettings(callback: (settings: any) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'siteConfiguration'),
      (doc) => {
        if (doc.exists()) {
          this.settingsCache = doc.data();
          this.cacheExpiry = Date.now() + this.CACHE_DURATION;
          callback(doc.data());
        }
      },
      (error) => {
        console.error('Error subscribing to settings:', error);
      }
    );

    return unsubscribe;
  }
}

// Export singleton instance
export const settingsService = SettingsServiceEnhanced.getInstance();
