/**
 * Enhanced Security Service
 * Provides comprehensive security monitoring, threat detection, and protection mechanisms
 */

import { CacheService } from './cache-service';
import { ErrorService } from './error-service';

interface SecurityEvent {
  type: 'suspicious_login' | 'rate_limit_exceeded' | 'invalid_input' | 'admin_access_attempt' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  userId?: string;
  timestamp: number;
  details: Record<string, any>;
  action?: string;
}

interface IPBlockEntry {
  ip: string;
  reason: string;
  blockedAt: number;
  expiresAt?: number;
  attempts: number;
}

interface SecurityConfig {
  maxLoginAttempts: number;
  loginLockoutDuration: number; // minutes
  maxRequestsPerMinute: number;
  suspiciousPatterns: RegExp[];
  blockedCountries?: string[];
  adminIPWhitelist?: string[];
}

export class SecurityService {
  private static config: SecurityConfig = {
    maxLoginAttempts: 5,
    loginLockoutDuration: 15,
    maxRequestsPerMinute: 60,
    suspiciousPatterns: [
      /script.*?src/i,
      /<.*?javascript:/i,
      /union.*?select/i,
      /drop.*?table/i,
      /exec.*?\(/i,
      /%3Cscript/i,
    ],
  };

  private static blockedIPs = new Map<string, IPBlockEntry>();
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private static requestCounts = new Map<string, { count: number; windowStart: number }>();

  /**
   * Initialize security service
   */
  static async initialize(): Promise<void> {
    // Load blocked IPs from cache/database
    try {
      const cachedBlocked = await CacheService.get<IPBlockEntry[]>('security:blocked_ips');
      if (cachedBlocked) {
        cachedBlocked.forEach(entry => {
          if (!entry.expiresAt || entry.expiresAt > Date.now()) {
            this.blockedIPs.set(entry.ip, entry);
          }
        });
      }

      // Start cleanup intervals
      this.startPeriodicCleanup();
      
      ErrorService.logInfo('Security service initialized', {
        component: 'SecurityService',
        metadata: { blockedIPCount: this.blockedIPs.size },
      });
    } catch (error) {
      ErrorService.logError('Failed to initialize security service', {
        component: 'SecurityService',
        metadata: { error: (error as Error).message },
      });
    }
  }

  /**
   * Check if IP is blocked
   */
  static isIPBlocked(ip: string): boolean {
    const entry = this.blockedIPs.get(ip);
    
    if (!entry) return false;
    
    // Check if block has expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.blockedIPs.delete(ip);
      this.persistBlockedIPs();
      return false;
    }
    
    return true;
  }

  /**
   * Block IP address
   */
  static async blockIP(
    ip: string, 
    reason: string, 
    durationMinutes?: number
  ): Promise<void> {
    const expiresAt = durationMinutes 
      ? Date.now() + (durationMinutes * 60 * 1000)
      : undefined;

    const entry: IPBlockEntry = {
      ip,
      reason,
      blockedAt: Date.now(),
      expiresAt,
      attempts: (this.blockedIPs.get(ip)?.attempts || 0) + 1,
    };

    this.blockedIPs.set(ip, entry);
    await this.persistBlockedIPs();

    this.logSecurityEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      ip,
      timestamp: Date.now(),
      details: { reason, durationMinutes },
      action: 'ip_blocked',
    });
  }

  /**
   * Unblock IP address
   */
  static async unblockIP(ip: string): Promise<boolean> {
    const existed = this.blockedIPs.delete(ip);
    
    if (existed) {
      await this.persistBlockedIPs();
      
      this.logSecurityEvent({
        type: 'admin_access_attempt',
        severity: 'low',
        ip: 'admin',
        timestamp: Date.now(),
        details: { unblockedIP: ip },
        action: 'ip_unblocked',
      });
    }
    
    return existed;
  }

  /**
   * Track login attempt
   */
  static async trackLoginAttempt(
    ip: string, 
    email: string, 
    success: boolean,
    userAgent?: string
  ): Promise<{ allowed: boolean; remainingAttempts?: number }> {
    const key = `${ip}:${email}`;
    const now = Date.now();
    
    if (!success) {
      const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
      
      // Reset if last attempt was more than lockout duration ago
      if (now - attempts.lastAttempt > this.config.loginLockoutDuration * 60 * 1000) {
        attempts.count = 0;
      }
      
      attempts.count++;
      attempts.lastAttempt = now;
      this.loginAttempts.set(key, attempts);
      
      // Block if exceeded max attempts
      if (attempts.count >= this.config.maxLoginAttempts) {
        await this.blockIP(
          ip, 
          `Too many failed login attempts for ${email}`,
          this.config.loginLockoutDuration
        );
        
        this.logSecurityEvent({
          type: 'suspicious_login',
          severity: 'high',
          ip,
          userAgent,
          timestamp: now,
          details: { 
            email, 
            attempts: attempts.count,
            action: 'account_locked'
          },
        });
        
        return { allowed: false };
      }
      
      this.logSecurityEvent({
        type: 'suspicious_login',
        severity: 'medium',
        ip,
        userAgent,
        timestamp: now,
        details: { 
          email, 
          attempts: attempts.count,
          remainingAttempts: this.config.maxLoginAttempts - attempts.count
        },
      });
      
      return { 
        allowed: true, 
        remainingAttempts: this.config.maxLoginAttempts - attempts.count 
      };
    } else {
      // Successful login - reset attempts
      this.loginAttempts.delete(key);
      return { allowed: true };
    }
  }

  /**
   * Rate limiting check
   */
  static checkRateLimit(ip: string): { allowed: boolean; remainingRequests: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    const current = this.requestCounts.get(ip) || { count: 0, windowStart: now };
    
    // Reset window if expired
    if (now - current.windowStart >= windowMs) {
      current.count = 0;
      current.windowStart = now;
    }
    
    current.count++;
    this.requestCounts.set(ip, current);
    
    const allowed = current.count <= this.config.maxRequestsPerMinute;
    const remainingRequests = Math.max(0, this.config.maxRequestsPerMinute - current.count);
    
    if (!allowed) {
      this.logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        ip,
        timestamp: now,
        details: { 
          requestCount: current.count,
          limit: this.config.maxRequestsPerMinute
        },
      });
    }
    
    return { allowed, remainingRequests };
  }

  /**
   * Validate input for suspicious patterns
   */
  static validateInput(input: string, context: string): {
    valid: boolean;
    threats: string[];
  } {
    const threats: string[] = [];
    
    for (const pattern of this.config.suspiciousPatterns) {
      if (pattern.test(input)) {
        threats.push(pattern.source);
      }
    }
    
    if (threats.length > 0) {
      this.logSecurityEvent({
        type: 'invalid_input',
        severity: 'high',
        ip: 'unknown',
        timestamp: Date.now(),
        details: { 
          context,
          threats,
          inputLength: input.length,
          inputSample: input.substring(0, 100) // First 100 chars for analysis
        },
      });
    }
    
    return {
      valid: threats.length === 0,
      threats,
    };
  }

  /**
   * Check admin access permissions
   */
  static async checkAdminAccess(
    ip: string,
    userId: string,
    userAgent?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check if IP is in admin whitelist (if configured)
    if (this.config.adminIPWhitelist && this.config.adminIPWhitelist.length > 0) {
      if (!this.config.adminIPWhitelist.includes(ip)) {
        this.logSecurityEvent({
          type: 'admin_access_attempt',
          severity: 'critical',
          ip,
          userAgent,
          userId,
          timestamp: Date.now(),
          details: { reason: 'ip_not_whitelisted' },
        });
        
        return { 
          allowed: false, 
          reason: 'IP address not authorized for admin access' 
        };
      }
    }

    // Additional admin security checks can be added here
    // e.g., time-based access, 2FA verification, etc.
    
    this.logSecurityEvent({
      type: 'admin_access_attempt',
      severity: 'low',
      ip,
      userAgent,
      userId,
      timestamp: Date.now(),
      details: { result: 'allowed' },
    });

    return { allowed: true };
  }

  /**
   * Log security event
   */
  private static logSecurityEvent(event: SecurityEvent): void {
    // Log with ErrorService for Sentry integration
    const logLevel = event.severity === 'critical' ? 'logError' 
      : event.severity === 'high' ? 'logError'
      : event.severity === 'medium' ? 'logWarning' : 'logInfo';

    ErrorService[logLevel](`Security event: ${event.type}`, {
      component: 'SecurityService',
      metadata: {
        type: event.type,
        severity: event.severity,
        ip: event.ip,
        details: event.details,
      },
    });

    // Store in cache for security dashboard
    this.cacheSecurityEvent(event);
  }

  /**
   * Get security events for monitoring
   */
  static async getSecurityEvents(
    limit = 100,
    severity?: SecurityEvent['severity']
  ): Promise<SecurityEvent[]> {
    try {
      const events = await CacheService.get<SecurityEvent[]>('security:events') || [];
      
      let filteredEvents = events;
      if (severity) {
        filteredEvents = events.filter(e => e.severity === severity);
      }
      
      return filteredEvents
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      ErrorService.logError('Failed to retrieve security events', {
        component: 'SecurityService',
        metadata: { error: (error as Error).message },
      });
      return [];
    }
  }

  /**
   * Get security statistics
   */
  static async getSecurityStats(): Promise<{
    blockedIPs: number;
    activeBlocks: number;
    recentEvents: { [key: string]: number };
    topThreats: Array<{ ip: string; events: number }>;
  }> {
    const events = await this.getSecurityEvents(1000);
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = events
      .filter(e => e.timestamp > oneDayAgo)
      .reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    const ipEventCounts = events
      .filter(e => e.timestamp > oneDayAgo)
      .reduce((acc, e) => {
        acc[e.ip] = (acc[e.ip] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    const topThreats = Object.entries(ipEventCounts)
      .map(([ip, events]) => ({ ip, events }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);

    const activeBlocks = Array.from(this.blockedIPs.values())
      .filter(entry => !entry.expiresAt || entry.expiresAt > now).length;

    return {
      blockedIPs: this.blockedIPs.size,
      activeBlocks,
      recentEvents,
      topThreats,
    };
  }

  /**
   * Cache security event
   */
  private static async cacheSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const events = await CacheService.get<SecurityEvent[]>('security:events') || [];
      events.push(event);
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await CacheService.set('security:events', events, { 
        ttl: 24 * 60 * 60, // 24 hours
        tags: ['security'] 
      });
    } catch (error) {
      ErrorService.logError('Failed to cache security event', {
        component: 'SecurityService',
        metadata: { error: (error as Error).message },
      });
    }
  }

  /**
   * Persist blocked IPs to cache
   */
  private static async persistBlockedIPs(): Promise<void> {
    try {
      const entries = Array.from(this.blockedIPs.values());
      await CacheService.set('security:blocked_ips', entries, { 
        ttl: 7 * 24 * 60 * 60, // 7 days
        tags: ['security'] 
      });
    } catch (error) {
      ErrorService.logError('Failed to persist blocked IPs', {
        component: 'SecurityService',
        metadata: { error: (error as Error).message },
      });
    }
  }

  /**
   * Start periodic cleanup
   */
  private static startPeriodicCleanup(): void {
    // Clean up expired blocks and old attempts every 5 minutes
    setInterval(() => {
      const now = Date.now();
      
      // Clean expired IP blocks
      for (const [ip, entry] of this.blockedIPs.entries()) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.blockedIPs.delete(ip);
        }
      }
      
      // Clean old login attempts
      const cutoff = now - (this.config.loginLockoutDuration * 60 * 1000);
      for (const [key, attempts] of this.loginAttempts.entries()) {
        if (attempts.lastAttempt < cutoff) {
          this.loginAttempts.delete(key);
        }
      }
      
      // Clean old rate limit counters
      const rateLimitCutoff = now - (60 * 1000); // 1 minute
      for (const [ip, counter] of this.requestCounts.entries()) {
        if (counter.windowStart < rateLimitCutoff) {
          this.requestCounts.delete(ip);
        }
      }
      
      this.persistBlockedIPs();
    }, 5 * 60 * 1000); // 5 minutes

    ErrorService.logInfo('Security service periodic cleanup started', {
      component: 'SecurityService',
    });
  }

  /**
   * Update security configuration
   */
  static updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    ErrorService.logInfo('Security configuration updated', {
      component: 'SecurityService',
      metadata: { newConfig },
    });
  }

  /**
   * Get current configuration
   */
  static getConfig(): SecurityConfig {
    return { ...this.config };
  }
}
