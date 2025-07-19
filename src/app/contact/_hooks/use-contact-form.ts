
"use client";

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { useToast } from '@/hooks/use-toast';
import type { ContactFormValues } from '../_lib/schema';

interface UseContactFormProps {
  form: UseFormReturn<ContactFormValues>;
  toast: ReturnType<typeof useToast>['toast'];
}

export function useContactForm({ form, toast }: UseContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (values: ContactFormValues) => {
    setIsLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('email', values.email);
    formData.append('message', values.message);
    formData.append('honeypot', values.honeypot || '');

    const hasAttachment = values.attachment && values.attachment.length > 0;
    if (hasAttachment) {
      formData.append('attachment', values.attachment[0]);
    }

    let progressInterval: NodeJS.Timeout | undefined;

    if (hasAttachment) {
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            if (progressInterval) clearInterval(progressInterval);
            return 95;
          }
          return prev + 10;
        });
      }, 100);
    }

    try {
      const response = await fetch('/contact/api', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      setSuccessMessage(result.personalizedMessage || "Thank you for your message. We'll get back to you shortly.");

      if (hasAttachment) {
        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => setIsSubmitted(true), 400); 
      } else {
        setIsSubmitted(true);
      }
      
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      if (hasAttachment) setUploadProgress(0);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || 'There was a problem with your request. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset();
    form.clearErrors();
    setIsSubmitted(false);
    setUploadProgress(0);
    setSuccessMessage(null);
    form.setFocus("name");
  };
  
  return {
    isLoading,
    isSubmitted,
    uploadProgress,
    successMessage,
    onSubmit,
    handleReset,
  };
}
