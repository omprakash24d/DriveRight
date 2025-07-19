
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MailCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useContactForm } from '../_hooks/use-contact-form';
import { contactFormSchema, type ContactFormValues } from '../_lib/schema';
import { InputField } from '@/components/form/input-field';
import { TextareaField } from '@/components/form/textarea-field';
import { DropzoneField } from '@/components/form/dropzone-field';

export function ContactForm() {
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      attachment: undefined,
      honeypot: "",
    },
  });

  const { 
    isLoading, 
    isSubmitted, 
    uploadProgress, 
    successMessage,
    onSubmit, 
    handleReset 
  } = useContactForm({ form, toast });

  useEffect(() => {
    form.setFocus("name");
  }, [form]);


  if (isSubmitted) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full shadow-lg">
          <CardContent className="flex flex-col items-center justify-center space-y-6 p-10 text-center">
              <MailCheck className="h-16 w-16 text-primary" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Message Sent!</h2>
                <p className="text-muted-foreground">
                  {successMessage}
                </p>
              </div>
              <Button onClick={handleReset} variant="outline" className="mt-4">
                Send Another Message
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl">Send a Message</CardTitle>
            <CardDescription>Fill out the form to get in touch.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <InputField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                isRequired
              />
              <InputField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="your.email@example.com"
                isRequired
              />
              <TextareaField
                control={form.control}
                name="message"
                label="Message"
                placeholder="Tell us what you're thinking about..."
                rows={5}
                isRequired
              />
              <DropzoneField
                control={form.control}
                form={form}
                name="attachment"
                label="Attachment (Optional)"
                isLoading={isLoading}
                uploadProgress={uploadProgress}
              />
              <div className="hidden">
                <InputField
                    control={form.control}
                    name="honeypot"
                    label="Honeypot"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}
