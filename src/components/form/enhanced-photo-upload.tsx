"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormDescription, FormLabel } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useRef, useState } from "react";

interface EnhancedPhotoUploadProps {
  onPhotoSelect: (file: File) => Promise<void>;
  photoUrl?: string;
  onRemove: () => void;
  isRequired?: boolean;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export function EnhancedPhotoUpload({
  onPhotoSelect,
  photoUrl,
  onRemove,
  isRequired = false,
  label = "Photo Upload",
  description = "JPG, PNG. Max 10MB. Click or drag and drop to upload.",
  error,
  disabled = false,
  maxSize = 10,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png"],
}: EnhancedPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `Please select a valid image file (${acceptedTypes
          .map((type) => type.split("/")[1].toUpperCase())
          .join(", ")})`;
      }

      if (file.size > maxSize * 1024 * 1024) {
        return `File size must be less than ${maxSize}MB`;
      }

      return null;
    },
    [acceptedTypes, maxSize]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      try {
        await onPhotoSelect(file);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (error) {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onPhotoSelect, validateFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect]
  );

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  if (photoUrl) {
    return (
      <div className="space-y-2">
        <FormLabel>
          {label}
          {isRequired && <span className="text-destructive"> *</span>}
        </FormLabel>
        <div className="relative group">
          <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-dashed border-success/50 bg-success/5">
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Image
                src={photoUrl}
                alt="Uploaded photo"
                width={200}
                height={200}
                className="object-contain max-w-full max-h-full rounded-md"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 opacity-80 hover:opacity-100 z-10 shadow-lg"
              onClick={onRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>Photo uploaded and cropped successfully</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FormLabel>
        {label}
        {isRequired && <span className="text-destructive"> *</span>}
      </FormLabel>

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10",
          error && "border-destructive",
          disabled && "cursor-not-allowed opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFileDialog();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Upload ${label.toLowerCase()}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(",")}
          onChange={handleFileChange}
          disabled={disabled}
          aria-label={`Upload ${label.toLowerCase()}`}
          title={`Upload ${label.toLowerCase()}`}
        />

        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div
            className={cn(
              "rounded-full p-3 mb-4 transition-colors",
              isDragging ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {isUploading ? (
              <Upload className="h-8 w-8 animate-pulse" />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
          </div>

          {isUploading ? (
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-medium">Uploading photo...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                {isDragging ? "Drop your photo here" : "Upload your photo"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to browse
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="pointer-events-none"
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </>
          )}
        </div>
      </div>

      {description && !error && (
        <FormDescription>{description}</FormDescription>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
