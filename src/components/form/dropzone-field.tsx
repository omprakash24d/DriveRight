
"use client"
import type { Control, UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import { cn } from "@/lib/utils"

interface DropzoneFieldProps {
  control: Control<any>
  form: UseFormReturn<any>
  name: string
  label: string
  maxSizeMb?: number
  isLoading?: boolean
  uploadProgress?: number
}

export function DropzoneField({ control, form, name, label, maxSizeMb = 10, isLoading, uploadProgress }: DropzoneFieldProps) {
  const attachment = form.watch(name);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className={cn({ "hidden": attachment?.[0] })}>
              <label
                htmlFor={`${name}-input`}
                className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">Max file size: {maxSizeMb}MB</p>
                </div>
                <Input
                  id={`${name}-input`}
                  type="file"
                  className="hidden"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  name={field.name}
                  onChange={(e) => field.onChange(e.target.files?.[0] ? e.target.files : undefined)}
                  disabled={isLoading}
                />
              </label>
            </div>
          </FormControl>
          
          {attachment?.[0] && (
            <div className="mt-2">
              <div className="flex items-center justify-between p-2 pl-3 border rounded-md">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment[0].name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment[0].size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-7 w-7 flex-shrink-0"
                  onClick={() => form.setValue(name, undefined, { shouldValidate: true })}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {isLoading && uploadProgress !== undefined && (
                <div className="mt-2 space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
