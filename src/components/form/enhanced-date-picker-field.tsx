"use client";

import { Button } from "@/components/ui/button";
import { Calendar, type CalendarProps } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format as formatDate, isValid, parse as parseDate } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import React from "react";
import type { Control } from "react-hook-form";

interface EnhancedDatePickerFieldProps
  extends Omit<CalendarProps, "mode" | "selected" | "onSelect"> {
  control: Control<any>;
  name: string;
  label: string;
  description?: string;
  isRequired?: boolean;
  placeholder?: string;
  variant?: "default" | "enhanced";
}

export function EnhancedDatePickerField({
  control,
  name,
  label,
  description,
  isRequired,
  placeholder = "Select date",
  variant = "enhanced",
  ...calendarProps
}: EnhancedDatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        if (variant === "enhanced") {
          return (
            <EnhancedDateInput
              field={field}
              open={open}
              setOpen={setOpen}
              name={name}
              label={label}
              description={description}
              isRequired={isRequired}
              calendarProps={calendarProps}
            />
          );
        }

        // Default variant (fallback to original behavior)
        return (
          <DefaultDateInput
            field={field}
            open={open}
            setOpen={setOpen}
            name={name}
            label={label}
            description={description}
            isRequired={isRequired}
            placeholder={placeholder}
            calendarProps={calendarProps}
          />
        );
      }}
    />
  );
}

function EnhancedDateInput({
  field,
  open,
  setOpen,
  name,
  label,
  description,
  isRequired,
  calendarProps,
}: any) {
  const [localInputValue, setLocalInputValue] = React.useState("");

  React.useEffect(() => {
    if (field.value && isValid(field.value)) {
      setLocalInputValue(formatDate(field.value, "dd/MM/yyyy"));
    } else {
      setLocalInputValue("");
    }
  }, [field.value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setLocalInputValue(str);

    let parsedDate: Date | undefined = undefined;
    if (/^\d{8}$/.test(str)) {
      // ddmmyyyy
      const day = str.substring(0, 2);
      const month = str.substring(2, 4);
      const year = str.substring(4, 8);
      parsedDate = parseDate(
        `${day}/${month}/${year}`,
        "dd/MM/yyyy",
        new Date()
      );
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      // dd/mm/yyyy
      parsedDate = parseDate(str, "dd/MM/yyyy", new Date());
    }

    if (parsedDate && isValid(parsedDate)) {
      field.onChange(parsedDate);
    } else if (str === "") {
      field.onChange(undefined);
    }
  };

  const handleDateSelect = (date?: Date) => {
    if (date && isValid(date)) {
      field.onChange(date);
      setLocalInputValue(formatDate(date, "dd/MM/yyyy"));
    }
    setOpen(false);
  };

  return (
    <FormItem>
      <FormLabel>
        {label}
        {isRequired && <span className="text-destructive"> *</span>}
      </FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            value={localInputValue}
            onChange={handleInputChange}
            placeholder="DD/MM/YYYY"
            disabled={field.disabled}
            className={cn(
              "w-full pr-10",
              field.value &&
                isValid(field.value) &&
                "text-foreground font-medium border-success"
            )}
            aria-describedby={description ? `${name}-description` : undefined}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-full px-3 hover:bg-muted/50 border-0"
                  aria-label="Open calendar"
                  disabled={field.disabled}
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={handleDateSelect}
                  disabled={field.disabled}
                  initialFocus
                  {...calendarProps}
                />
              </PopoverContent>
            </Popover>
            {/* Removed clock icon for cleaner UI */}
          </div>
        </div>
      </FormControl>
      {description && (
        <FormDescription id={`${name}-description`}>
          {description}
        </FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );
}

function DefaultDateInput({
  field,
  open,
  setOpen,
  name,
  label,
  description,
  isRequired,
  placeholder,
  calendarProps,
}: any) {
  return (
    <FormItem>
      <FormLabel>
        {label}
        {isRequired && <span className="text-destructive"> *</span>}
      </FormLabel>
      <FormControl>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
              disabled={field.disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? (
                formatDate(field.value, "PPP")
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={(date) => {
                field.onChange(date);
                setOpen(false);
              }}
              disabled={field.disabled}
              initialFocus
              {...calendarProps}
            />
          </PopoverContent>
        </Popover>
      </FormControl>
      {description && (
        <FormDescription id={`${name}-description`}>
          {description}
        </FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );
}
