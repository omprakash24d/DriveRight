
"use client"
import type { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface FileFieldProps {
  control: Control<any>
  name: string
  label: string
  description?: string
  isRequired?: boolean
}

export function FileField({ control, name, label, description, isRequired }: FileFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { value, onChange, ...fieldProps } }) => (
        <FormItem>
          <FormLabel>
            {label}
            {isRequired && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input 
              type="file"
              onChange={(e) => onChange(e.target.files)}
              aria-describedby={description ? `${name}-description` : undefined}
              {...fieldProps}
            />
          </FormControl>
          {description && <FormDescription id={`${name}-description`}>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
