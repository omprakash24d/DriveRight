
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Image as ImageIcon, X } from "lucide-react";
import { useState } from "react";
import type { User } from 'firebase/auth';
import { InputField } from "@/components/form/input-field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { updateUserProfileAction } from "../actions";
import { resizeImage } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  avatar: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditorProps {
    user: User;
}

export function ProfileEditor({ user }: ProfileEditorProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { user: authUser, userProfile, refreshUserProfile, getIdToken } = useAuth();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: userProfile?.name || user?.displayName || '',
            avatar: userProfile?.avatar || user?.photoURL || '',
        },
    });

    const avatarValue = form.watch('avatar');

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedDataUrl = await resizeImage(file, 256);
                form.setValue('avatar', resizedDataUrl, { shouldValidate: true });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Image Error', description: 'Could not process the image.' });
            }
        }
    };
    
    const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
        if (!authUser) return;
        setIsLoading(true);

        try {
            const token = await getIdToken();
            if (!token) {
                throw new Error("Authentication token not available.");
            }

            const result = await updateUserProfileAction(authUser.uid, token, { 
                name: data.name, 
                avatar: data.avatar 
            });

            if (result.success) {
                await refreshUserProfile(); 
                toast({ title: "Profile Updated", description: "Your changes have been saved." });
                form.reset({ name: data.name, avatar: data.avatar });
            } else {
                 throw new Error(result.error);
            }
        } catch (error: any) {
             toast({ variant: "destructive", title: "Update Failed", description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <InputField
                            control={form.control}
                            name="name"
                            label="Full Name"
                            isRequired
                        />
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Avatar</label>
                            {avatarValue ? (
                            <div className="flex items-center gap-4">
                                <Image src={avatarValue} alt="Avatar preview" width={64} height={64} className="rounded-full object-cover aspect-square" />
                                <Button variant="outline" onClick={() => form.setValue('avatar', '')}>
                                <X className="mr-2 h-4 w-4" /> Remove
                                </Button>
                            </div>
                            ) : (
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                <Input type="file" accept="image/png, image/jpeg" onChange={handleAvatarChange} />
                            </div>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
