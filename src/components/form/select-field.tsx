
"use client"
import type { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SelectFieldProps {
  control: Control<any>
  name: string
  label: string
  placeholder?: string
  description?: string
  items: { value: string, label: string }[]
  isRequired?: boolean
}

export function SelectField({ control, name, label, placeholder, description, items, isRequired }: SelectFieldProps) {
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
          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
            <FormControl>
              <SelectTrigger aria-describedby={description ? `${name}-description` : undefined}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {description && <FormDescription id={`${name}-description`}>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
