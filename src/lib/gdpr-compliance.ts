// src/lib/gdpr-compliance.ts - GDPR Data Subject Rights Implementation
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { auditLogger } from './audit-logger';

export interface DataSubjectRequest {
  id: string;
  userId: string;
  userEmail: string;
  requestType: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: string;
  completionDate?: string;
  requestDetails?: string;
  responseData?: any;
  processingNotes?: string;
  legalBasis?: string;
  retentionPeriod?: string;
  verificationMethod?: 'email' | 'identity_document' | 'phone';
  verifiedAt?: string;
  processedBy?: string;
}

export interface PersonalDataInventory {
  collection: string;
  dataTypes: string[];
  purpose: string;
  legalBasis: string;
  retentionPeriod: string;
  thirdPartySharing: boolean;
  encryption: boolean;
  backups: boolean;
  accessControls: string[];
}

export interface ConsentRecord {
  userId: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: string;
  consentVersion: string;
  ipAddress: string;
  userAgent: string;
  withdrawnDate?: string;
  renewalRequired?: boolean;
  legalBasis: string;
}

class GDPRCompliance {
  private db = getFirestore();
  private storage = getStorage();

  // Data Subject Access Request (Article 15)
  async processAccessRequest(userId: string, requestId: string): Promise<any> {
    try {
      const personalData = await this.collectPersonalData(userId);
      const consentHistory = await this.getConsentHistory(userId);
      const processingActivities = await this.getProcessingActivities(userId);

      const accessReport = {
        personalData,
        consentHistory,
        processingActivities,
        dataRetention: await this.getRetentionSchedule(userId),
        thirdPartySharing: await this.getThirdPartySharing(userId),
        automatedDecisionMaking: await this.getAutomatedDecisions(userId),
        exportDate: new Date().toISOString(),
        requestId
      };

      // Log the access request
      await auditLogger.logPrivacyEvent(
        { userId, ip: '127.0.0.1' },
        'data_export',
        { requestId, dataCategories: Object.keys(personalData) }
      );

      return accessReport;

    } catch (error) {
      console.error('Failed to process access request:', error);
      throw new Error('Failed to generate data access report');
    }
  }

  // Data Portability Request (Article 20)
  async processPortabilityRequest(userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    try {
      const portableData = await this.getPortableData(userId);
      
      let formattedData;
      switch (format) {
        case 'csv':
          formattedData = this.convertToCSV(portableData);
          break;
        case 'xml':
          formattedData = this.convertToXML(portableData);
          break;
        default:
          formattedData = JSON.stringify(portableData, null, 2);
      }

      // Store the export file
      const fileName = `user_data_export_${userId}_${Date.now()}.${format}`;
      const bucket = this.storage.bucket();
      const file = bucket.file(`exports/${fileName}`);
      
      await file.save(formattedData, {
        metadata: {
          contentType: format === 'json' ? 'application/json' : 
                     format === 'csv' ? 'text/csv' : 'application/xml',
          metadata: {
            userId,
            exportDate: new Date().toISOString(),
            dataTypes: Object.keys(portableData).join(',')
          }
        }
      });

      // Generate signed URL for download (expires in 24 hours)
      const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000
      });

      await auditLogger.logPrivacyEvent(
        { userId, ip: '127.0.0.1' },
        'data_export',
        { format, fileName, downloadUrl: 'provided' }
      );

      return { downloadUrl, fileName, format, expiresIn: '24 hours' };

    } catch (error) {
      console.error('Failed to process portability request:', error);
      throw new Error('Failed to generate portable data export');
    }
  }

  // Right to Rectification (Article 16)
  async processRectificationRequest(
    userId: string, 
    corrections: Record<string, any>,
    requestId: string
  ): Promise<void> {
    try {
      const batch = this.db.batch();
      const collectionsToUpdate = ['users', 'enrollments', 'certificates', 'results'];

      for (const collection of collectionsToUpdate) {
        const userDoc = await this.db.collection(collection).doc(userId).get();
        if (userDoc.exists) {
          const updates: any = {};
          
          // Apply corrections
          for (const [field, newValue] of Object.entries(corrections)) {
            if (userDoc.data()![field] !== undefined) {
              updates[field] = newValue;
              updates[`${field}_corrected_at`] = new Date().toISOString();
              updates[`${field}_correction_request`] = requestId;
            }
          }

          if (Object.keys(updates).length > 0) {
            batch.update(userDoc.ref, updates);
          }
        }
      }

      await batch.commit();

      await auditLogger.logPrivacyEvent(
        { userId, ip: '127.0.0.1' },
        'data_rectification',
        { requestId, corrections: Object.keys(corrections) }
      );

    } catch (error) {
      console.error('Failed to process rectification request:', error);
      throw new Error('Failed to apply data corrections');
    }
  }

  // Right to Erasure (Article 17)
  async processErasureRequest(
    userId: string, 
    requestId: string,
    retainAuditTrail: boolean = true
  ): Promise<void> {
    try {
      const collectionsToErase = [
        'users', 'enrollments', 'certificates', 'results', 
        'payments', 'communications', 'preferences', 'sessions'
      ];

      const batch = this.db.batch();
      const erasureLog: any = {
        userId,
        requestId,
        erasureDate: new Date().toISOString(),
        collectionsErased: [],
        filesDeleted: []
      };

      // Erase data from collections
      for (const collection of collectionsToErase) {
        const userDoc = await this.db.collection(collection).doc(userId).get();
        if (userDoc.exists) {
          if (retainAuditTrail) {
            // Anonymize instead of delete for audit purposes
            const anonymizedData = this.anonymizeData(userDoc.data()!);
            batch.update(userDoc.ref, {
              ...anonymizedData,
              _erased: true,
              _erasureDate: new Date().toISOString(),
              _erasureRequest: requestId
            });
          } else {
            batch.delete(userDoc.ref);
          }
          erasureLog.collectionsErased.push(collection);
        }
      }

      // Delete user files
      const bucket = this.storage.bucket();
      const [files] = await bucket.getFiles({ prefix: `users/${userId}/` });
      
      for (const file of files) {
        await file.delete();
        erasureLog.filesDeleted.push(file.name);
      }

      await batch.commit();

      // Log the erasure (this will be retained for legal compliance)
      await auditLogger.logPrivacyEvent(
        { userId: 'ERASED', ip: '127.0.0.1' },
        'data_deletion',
        erasureLog
      );

    } catch (error) {
      console.error('Failed to process erasure request:', error);
      throw new Error('Failed to erase user data');
    }
  }

  // Consent Management
  async recordConsent(consent: Omit<ConsentRecord, 'consentDate'>): Promise<void> {
    try {
      const consentRecord: ConsentRecord = {
        ...consent,
        consentDate: new Date().toISOString()
      };

      await this.db.collection('consent_records').add(consentRecord);

      await auditLogger.logPrivacyEvent(
        { userId: consent.userId, ip: consent.ipAddress },
        'consent_given',
        { purpose: consent.purpose, legalBasis: consent.legalBasis }
      );

    } catch (error) {
      console.error('Failed to record consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  async withdrawConsent(userId: string, purpose: string, ip: string): Promise<void> {
    try {
      const consentQuery = await this.db.collection('consent_records')
        .where('userId', '==', userId)
        .where('purpose', '==', purpose)
        .where('consentGiven', '==', true)
        .orderBy('consentDate', 'desc')
        .limit(1)
        .get();

      if (!consentQuery.empty) {
        const consentDoc = consentQuery.docs[0];
        await consentDoc.ref.update({
          consentGiven: false,
          withdrawnDate: new Date().toISOString()
        });

        await auditLogger.logPrivacyEvent(
          { userId, ip },
          'consent_withdrawn',
          { purpose }
        );
      }

    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      throw new Error('Failed to withdraw consent');
    }
  }

  // Data Breach Notification
  async reportDataBreach(breach: {
    description: string;
    affectedUsers: string[];
    dataCategories: string[];
    riskLevel: 'low' | 'medium' | 'high';
    containmentMeasures: string[];
    reportedBy: string;
  }): Promise<string> {
    try {
      const breachId = crypto.randomUUID();
      const breachReport = {
        id: breachId,
        ...breach,
        reportDate: new Date().toISOString(),
        status: 'reported',
        authorityNotified: false,
        usersNotified: false
      };

      await this.db.collection('data_breaches').doc(breachId).set(breachReport);

      // Log critical security event
      await auditLogger.logSecurityEvent(
        { userId: breach.reportedBy, ip: '127.0.0.1' },
        'data_breach_reported',
        'critical',
        { breachId, affectedCount: breach.affectedUsers.length }
      );

      return breachId;

    } catch (error) {
      console.error('Failed to report data breach:', error);
      throw new Error('Failed to report data breach');
    }
  }

  // Private helper methods
  private async collectPersonalData(userId: string): Promise<any> {
    const collections = ['users', 'enrollments', 'certificates', 'results', 'payments'];
    const personalData: any = {};

    for (const collection of collections) {
      const doc = await this.db.collection(collection).doc(userId).get();
      if (doc.exists) {
        personalData[collection] = doc.data();
      }
    }

    return personalData;
  }

  private async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    const snapshot = await this.db.collection('consent_records')
      .where('userId', '==', userId)
      .orderBy('consentDate', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as ConsentRecord);
  }

  private async getProcessingActivities(userId: string): Promise<any[]> {
    const activities = [
      {
        purpose: 'Driving Course Management',
        legalBasis: 'Contract Performance',
        dataCategories: ['Personal Details', 'Contact Information', 'Course Progress'],
        retention: '7 years after course completion'
      },
      {
        purpose: 'Certificate Issuance',
        legalBasis: 'Legal Obligation',
        dataCategories: ['Personal Details', 'Test Results', 'Certificate Data'],
        retention: 'Permanent (regulatory requirement)'
      },
      {
        purpose: 'Marketing Communications',
        legalBasis: 'Consent',
        dataCategories: ['Contact Information', 'Preferences'],
        retention: 'Until consent withdrawn'
      }
    ];

    return activities;
  }

  private async getRetentionSchedule(userId: string): Promise<any> {
    return {
      personalData: '7 years after last interaction',
      courseRecords: '7 years after completion',
      certificates: 'Permanent (regulatory requirement)',
      paymentRecords: '7 years (legal requirement)',
      marketingData: 'Until consent withdrawn'
    };
  }

  private async getThirdPartySharing(userId: string): Promise<any[]> {
    return [
      {
        party: 'Payment Processor',
        purpose: 'Payment Processing',
        dataShared: ['Name', 'Email', 'Payment Details'],
        legalBasis: 'Contract Performance'
      },
      {
        party: 'Government Agency',
        purpose: 'Regulatory Compliance',
        dataShared: ['Certificate Records', 'Test Results'],
        legalBasis: 'Legal Obligation'
      }
    ];
  }

  private async getAutomatedDecisions(userId: string): Promise<any[]> {
    return [
      {
        decision: 'Course Recommendation',
        logic: 'Based on test scores and learning progress',
        significance: 'Affects course suggestions',
        userRights: 'Can request manual review'
      }
    ];
  }

  private async getPortableData(userId: string): Promise<any> {
    const personalData = await this.collectPersonalData(userId);
    
    // Filter out system fields and include only user-provided data
    const portableData: any = {};
    
    for (const [collection, data] of Object.entries(personalData)) {
      if (data && typeof data === 'object') {
        portableData[collection] = this.filterPortableFields(data as any);
      }
    }

    return portableData;
  }

  private filterPortableFields(data: any): any {
    const excludeFields = [
      'createdAt', 'updatedAt', '_id', 'id', 'systemGenerated',
      'internalNotes', 'adminFlags', 'securityFlags'
    ];

    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (!excludeFields.includes(key) && !key.startsWith('_')) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  private anonymizeData(data: any): any {
    const anonymized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (this.isPII(key)) {
        anonymized[key] = this.generateAnonymizedValue(key, value);
      } else {
        anonymized[key] = value;
      }
    }

    return anonymized;
  }

  private isPII(fieldName: string): boolean {
    const piiFields = [
      'name', 'email', 'phone', 'address', 'dateOfBirth',
      'ssn', 'licenseNumber', 'emergencyContact'
    ];
    
    return piiFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  private generateAnonymizedValue(fieldName: string, originalValue: any): string {
    if (fieldName.toLowerCase().includes('email')) {
      return 'anonymized@example.com';
    }
    if (fieldName.toLowerCase().includes('phone')) {
      return 'XXX-XXX-XXXX';
    }
    if (fieldName.toLowerCase().includes('name')) {
      return 'ANONYMIZED USER';
    }
    
    return '[REDACTED]';
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion
    const rows: string[] = [];
    
    function flattenObject(obj: any, prefix: string = ''): any {
      const flattened: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }
      return flattened;
    }

    const flattened = flattenObject(data);
    const headers = Object.keys(flattened);
    const values = Object.values(flattened);

    rows.push(headers.join(','));
    rows.push(values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return rows.join('\n');
  }

  private convertToXML(data: any): string {
    function objectToXML(obj: any, rootName: string = 'data'): string {
      let xml = `<${rootName}>`;
      
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          xml += objectToXML(value, key);
        } else if (Array.isArray(value)) {
          xml += `<${key}>`;
          value.forEach(item => {
            xml += typeof item === 'object' ? objectToXML(item, 'item') : `<item>${item}</item>`;
          });
          xml += `</${key}>`;
        } else {
          xml += `<${key}>${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${key}>`;
        }
      }
      
      xml += `</${rootName}>`;
      return xml;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n${objectToXML(data, 'userDataExport')}`;
  }
}

// Export singleton instance
export const gdprCompliance = new GDPRCompliance();

// Personal Data Inventory for compliance documentation
export const personalDataInventory: PersonalDataInventory[] = [
  {
    collection: 'users',
    dataTypes: ['Name', 'Email', 'Phone', 'Address', 'Date of Birth'],
    purpose: 'User Account Management',
    legalBasis: 'Contract Performance',
    retentionPeriod: '7 years after account closure',
    thirdPartySharing: false,
    encryption: true,
    backups: true,
    accessControls: ['Admin', 'User Self-Access']
  },
  {
    collection: 'enrollments',
    dataTypes: ['Course Selection', 'Progress Data', 'Instructor Assignments'],
    purpose: 'Course Management',
    legalBasis: 'Contract Performance',
    retentionPeriod: '7 years after course completion',
    thirdPartySharing: false,
    encryption: true,
    backups: true,
    accessControls: ['Admin', 'Instructor', 'Student']
  },
  {
    collection: 'certificates',
    dataTypes: ['Certificate Details', 'Issue Date', 'Verification Codes'],
    purpose: 'Certificate Issuance',
    legalBasis: 'Legal Obligation',
    retentionPeriod: 'Permanent',
    thirdPartySharing: true,
    encryption: true,
    backups: true,
    accessControls: ['Admin', 'Government Agencies']
  }
];
