
"use client"
import type { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface InputFieldProps {
  control: Control<any>
  name: string
  label: string
  placeholder?: string
  description?: string
  type?: string
  isRequired?: boolean
}

export function InputField({ control, name, label, placeholder, description, type = "text", isRequired }: InputFieldProps) {
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
            <Input 
              type={type} 
              placeholder={placeholder} 
              aria-describedby={description ? `${name}-description` : undefined}
              {...field} />
          </FormControl>
          {description && <FormDescription id={`${name}-description`}>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
