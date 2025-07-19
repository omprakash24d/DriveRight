
"use client"
import type { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { DatePicker } from "@/components/ui/date-picker"
import type { CalendarProps } from "@/components/ui/calendar"

interface DatePickerFieldProps extends Omit<CalendarProps, 'mode'|'selected'|'onSelect'> {
  control: Control<any>
  name: string
  label: string
  description?: string
  isRequired?: boolean
  inputType?: 'button' | 'text'
}

export function DatePickerField({ control, name, label, description, isRequired, inputType, ...calendarProps }: DatePickerFieldProps) {
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
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              disabled={field.disabled}
              calendarProps={calendarProps}
              inputType={inputType}
              aria-describedby={description ? `${name}-description` : undefined}
            />
          </FormControl>
          {description && <FormDescription id={`${name}-description`}>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
