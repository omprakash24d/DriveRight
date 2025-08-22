// src/lib/compliance.ts - GDPR and data protection compliance
export interface DataProcessingRecord {
  id: string;
  userId: string;
  dataType: 'personal' | 'sensitive' | 'biometric' | 'contact';
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  retentionPeriod: number; // in days
  timestamp: string;
  action: 'collected' | 'processed' | 'shared' | 'deleted' | 'anonymized';
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'cookies' | 'third_party_sharing';
  granted: boolean;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  withdrawnAt?: string;
}

class ComplianceService {
  private static instance: ComplianceService;
  
  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  // GDPR Article 30 - Records of processing activities
  async recordDataProcessing(record: Omit<DataProcessingRecord, 'id' | 'timestamp'>): Promise<void> {
    const processingRecord: DataProcessingRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    try {
      // Store in compliance audit log
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      await db.collection('compliance_logs').doc(processingRecord.id).set(processingRecord);
      

    } catch (error) {
      console.error('Failed to record data processing:', error);
      // In production, this should trigger an alert
    }
  }

  // GDPR Article 7 - Consent management
  async recordConsent(consent: Omit<ConsentRecord, 'id' | 'timestamp'>): Promise<string> {
    const consentRecord: ConsentRecord = {
      ...consent,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      await db.collection('user_consents').doc(consentRecord.id).set(consentRecord);
      
      // Update user's current consent status
      await db.collection('users').doc(consent.userId).update({
        [`consents.${consent.consentType}`]: {
          granted: consent.granted,
          recordId: consentRecord.id,
          timestamp: consentRecord.timestamp
        }
      });

      return consentRecord.id;
    } catch (error) {
      console.error('Failed to record consent:', error);
      throw new Error('Consent recording failed');
    }
  }

  // GDPR Article 17 - Right to erasure (Right to be forgotten)
  async handleDataDeletionRequest(userId: string, requestReason: string): Promise<void> {
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      // Create deletion request record
      const deletionRequest = {
        id: crypto.randomUUID(),
        userId,
        requestReason,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        processedAt: null
      };

      await db.collection('deletion_requests').doc(deletionRequest.id).set(deletionRequest);

      // Record the data processing activity
      await this.recordDataProcessing({
        userId,
        dataType: 'personal',
        purpose: 'GDPR Article 17 - Right to erasure',
        legalBasis: 'legal_obligation',
        retentionPeriod: 0,
        action: 'deleted'
      });

      // In production, this would trigger a workflow to:
      // 1. Backup data for legal retention requirements
      // 2. Anonymize or delete personal data
      // 3. Notify third parties if data was shared
      // 4. Update deletion request status


    } catch (error) {
      console.error('Failed to handle data deletion request:', error);
      throw new Error('Data deletion request failed');
    }
  }

  // GDPR Article 15 - Right of access
  async generateDataExport(userId: string): Promise<any> {
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      // Collect all user data
      const collections = ['users', 'enrollments', 'certificates', 'results', 'user_consents'];
      const userData: any = {};

      for (const collection of collections) {
        const snapshot = await db.collection(collection)
          .where('userId', '==', userId)
          .get();
        
        userData[collection] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Record the data access
      await this.recordDataProcessing({
        userId,
        dataType: 'personal',
        purpose: 'GDPR Article 15 - Right of access',
        legalBasis: 'legal_obligation',
        retentionPeriod: 30,
        action: 'processed'
      });

      return {
        exportedAt: new Date().toISOString(),
        userId,
        data: userData,
        consentHistory: await this.getConsentHistory(userId)
      };
    } catch (error) {
      console.error('Failed to generate data export:', error);
      throw new Error('Data export failed');
    }
  }

  private async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      const snapshot = await db.collection('user_consents')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => doc.data() as ConsentRecord);
    } catch (error) {
      console.error('Failed to get consent history:', error);
      return [];
    }
  }

  // Data retention policy enforcement
  async enforceRetentionPolicy(): Promise<void> {
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 7); // 7 years default retention
      
      // Find expired records
      const expiredRecords = await db.collection('compliance_logs')
        .where('timestamp', '<', cutoffDate.toISOString())
        .get();

      for (const doc of expiredRecords.docs) {
        const record = doc.data() as DataProcessingRecord;
        
        // Check if record is past retention period
        const recordDate = new Date(record.timestamp);
        const retentionEnd = new Date(recordDate.getTime() + (record.retentionPeriod * 24 * 60 * 60 * 1000));
        
        if (retentionEnd < new Date()) {
          await doc.ref.delete();

        }
      }
    } catch (error) {
      console.error('Failed to enforce retention policy:', error);
    }
  }
}

export const compliance = ComplianceService.getInstance();

// Data protection impact assessment helpers
export const DPIA_TRIGGERS = {
  BIOMETRIC_DATA: 'Processing of biometric data (photos, signatures)',
  AUTOMATED_DECISION: 'Automated decision making affecting individuals',
  VULNERABLE_GROUPS: 'Processing data of minors (under 18)',
  LARGE_SCALE: 'Large scale processing of personal data',
  HIGH_RISK: 'High risk to rights and freedoms of individuals'
} as const;

// Legal basis for processing personal data
export const LEGAL_BASIS = {
  CONSENT: 'User has given clear consent',
  CONTRACT: 'Processing is necessary for contract performance',
  LEGAL_OBLIGATION: 'Processing is required by law',
  VITAL_INTERESTS: 'Processing is necessary to protect vital interests',
  PUBLIC_TASK: 'Processing is necessary for public interest',
  LEGITIMATE_INTERESTS: 'Processing is necessary for legitimate interests'
} as const;
