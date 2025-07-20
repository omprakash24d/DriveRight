
"use client"

import * as React from "react"
import { format as formatDate, parse as parseDate, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, type CalendarProps } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
    value?: Date;
    onChange: (date?: Date) => void;
    calendarProps?: Omit<CalendarProps, 'mode'|'selected'|'onSelect'>;
    placeholder?: string;
    disabled?: boolean;
    inputType?: 'button' | 'text';
}

export function DatePicker({ value, onChange, calendarProps, disabled, placeholder, inputType = 'button' }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // --- Text Input Variant ---
  if (inputType === 'text') {
    const [inputValue, setInputValue] = React.useState(value && isValid(value) ? formatDate(value, 'dd/MM/yyyy') : '');

    React.useEffect(() => {
        if (value && isValid(value)) {
            setInputValue(formatDate(value, 'dd/MM/yyyy'));
        } else {
            setInputValue('');
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const str = e.target.value;
        setInputValue(str);

        let parsedDate: Date | undefined = undefined;
        if (/^\d{8}$/.test(str)) { // ddmmyyyy
            const day = str.substring(0, 2);
            const month = str.substring(2, 4);
            const year = str.substring(4, 8);
            parsedDate = parseDate(`${day}/${month}/${year}`, 'dd/MM/yyyy', new Date());
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) { // dd/mm/yyyy
            parsedDate = parseDate(str, 'dd/MM/yyyy', new Date());
        }

        if (parsedDate && isValid(parsedDate)) {
            onChange(parsedDate);
        } else if (str === '') {
            onChange(undefined);
        }
    }

    const handleDateSelect = (date?: Date) => {
        if (date && isValid(date)) {
            onChange(date);
            setInputValue(formatDate(date, 'dd/MM/yyyy'));
        }
        setOpen(false);
    }
    
    return (
        <div className="relative">
            <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder || 'DD/MM/YYYY'}
                disabled={disabled}
                className="w-full pr-10"
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant={"ghost"}
                        className="absolute inset-y-0 right-0 h-full px-3"
                        aria-label="Open calendar"
                        disabled={disabled}
                    >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateSelect}
                        disabled={disabled}
                        initialFocus
                        {...calendarProps}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
  }

  // --- Button Variant (default) ---
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDate(value, "PPP") : <span>{placeholder || 'Pick a date'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          disabled={disabled}
          initialFocus
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}
