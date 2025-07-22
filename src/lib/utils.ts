
import { storage } from "@/lib/firebase";
import { clsx, type ClassValue } from "clsx";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAvatarColor(name: string) {
  if (!name) return 'hsl(0, 0%, 90%)'; // A default gray for empty names
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  // Using light pastel colors for the background
  return `hsl(${h}, 80%, 90%)`;
}

/**
 * Strips HTML tags from a string to prevent XSS attacks.
 * @param str The input string.
 * @returns The sanitized string.
 */
export const sanitize = (str: string) => (str ? str.replace(/<[^>]*>?/gm, '') : '');


/**
 * Resizes an image file on the client-side.
 * @param file The image file to resize.
 * @param maxSize The maximum width or height of the resized image.
 * @param outputType The desired output format, 'dataUrl' or 'file'.
 * @returns A promise that resolves with a Base64 encoded Data URI or a File object.
 */
export function resizeImage(file: File, maxSize: number, outputType: 'dataUrl'): Promise<string>;
export function resizeImage(file: File, maxSize: number, outputType: 'file'): Promise<File>;
export function resizeImage(file: File, maxSize: number): Promise<string>; // Overload for default 'dataUrl'
export function resizeImage(file: File, maxSize: number, outputType: 'dataUrl' | 'file' = 'dataUrl'): Promise<string | File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        if (outputType === 'dataUrl') {
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas to Blob conversion failed'));
                }
                const newFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                resolve(newFile);
            }, 'image/jpeg', 0.9);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Uploads a file to Firebase Storage using the client SDK.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be stored.
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
}
