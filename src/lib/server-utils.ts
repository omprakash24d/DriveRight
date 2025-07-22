/**
 * Server-side utilities that can only be used in API routes or server components.
 * DO NOT import this file in client-side components.
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

/**
 * Development fallback: Save file locally when Firebase Storage is unavailable
 */
async function saveFileLocally(file: File, path: string): Promise<string> {
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const fullPath = join(uploadDir, path);
    
    // Create directory if it doesn't exist
    const dir = dirname(fullPath);
    console.log('📁 Creating directory:', dir);
    await mkdir(dir, { recursive: true });
    
    // Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('💾 Saving file to:', fullPath);
    await writeFile(fullPath, buffer);
    
    // Return public URL
    const publicUrl = `/uploads/${path}`;
    console.log('🔗 Public URL:', publicUrl);
    return publicUrl;
}

/**
 * Uploads a file to Firebase Storage using the Admin SDK (server-side only).
 * Falls back to local storage in development if Firebase Storage is unavailable.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be stored.
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export async function uploadFileAdmin(file: File, path: string): Promise<string> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    try {
        const { getAdminApp } = await import('./firebase-admin');
        const admin = await import('firebase-admin');
        
        const adminApp = getAdminApp();
        const storage = admin.storage(adminApp);
        const bucket = storage.bucket();
        
        console.log('🔍 Upload Debug Info:', {
            bucketName: bucket.name,
            projectId: adminApp.options.projectId,
            filePath: path,
            fileSize: file.size,
            fileType: file.type,
            isDevelopment
        });
        
        // Validate file
        if (!file || file.size === 0) {
            throw new Error('Invalid file: File is empty or undefined');
        }
        
        // Try Firebase Storage first
        try {
            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Create a file reference in the bucket
            const fileRef = bucket.file(path);
            
            // Upload the file with proper metadata
            await fileRef.save(buffer, {
                metadata: {
                    contentType: file.type,
                    cacheControl: 'public, max-age=31536000', // 1 year cache
                },
                validation: 'md5', // Ensure file integrity
            });
            
            // Make the file publicly readable
            await fileRef.makePublic();
            
            // Return the public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
            console.log('✅ File uploaded to Firebase Storage:', publicUrl);
            return publicUrl;
            
        } catch (storageError: any) {
            console.log('⚠️ Firebase Storage upload failed:', storageError.message);
            
            // In development, fall back to local storage
            if (isDevelopment) {
                console.log('🔄 Falling back to local file storage...');
                const localUrl = await saveFileLocally(file, path);
                console.log('✅ File saved locally:', localUrl);
                return localUrl;
            }
            
            // In production, throw the error
            throw storageError;
        }
        
    } catch (error: any) {
        console.error('File upload error:', error);
        
        // In development, try local storage as fallback
        if (isDevelopment) {
            try {
                console.log('🔄 Using local storage fallback...');
                const localUrl = await saveFileLocally(file, path);
                console.log('✅ File saved locally as fallback:', localUrl);
                return localUrl;
            } catch (localError: any) {
                console.error('Local storage fallback failed:', localError);
                throw new Error(`File upload failed completely: ${error.message}`);
            }
        }
        
        // Provide more specific error messages for production
        if (error.message?.includes('bucket does not exist')) {
            throw new Error(`Firebase Storage bucket not found. Please enable Firebase Storage in the Firebase Console for project '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}'.`);
        }
        
        throw new Error(`File upload failed: ${error.message}`);
    }
}
