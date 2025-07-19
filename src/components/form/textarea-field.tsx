
"use client"
import type { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

interface TextareaFieldProps {
  control: Control<any>
  name: string
  label: string
  placeholder?: string
  description?: string
  rows?: number
  isRequired?: boolean
}

export function TextareaField({ control, name, label, placeholder, description, rows, isRequired }: TextareaFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {isRequired && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Textarea 
              placeholder={placeholder} 
              rows={rows} 
              aria-describedby={description ? `${name}-description` : undefined}
              {...field} 
            />
          </FormControl>
          {description && <FormDescription id={`${name}-description`}>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
