import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { dateUtils } from '@/services/cursor-api';

interface DateRangePickerProps {
  startDate: number;
  endDate: number;
  onDateRangeChange: (startDate: number, endDate: number) => void;
  className?: string;
}

type DateRangePreset = {
  label: string;
  value: string;
  getRange: () => { startDate: number; endDate: number };
};

const dateRangePresets: DateRangePreset[] = [
  {
    label: 'Last 7 days',
    value: 'last-7-days',
    getRange: () => dateUtils.getLast7Days(),
  },
  {
    label: 'Last 30 days',
    value: 'last-30-days',
    getRange: () => dateUtils.getLast30Days(),
  },
  {
    label: 'Last 90 days',
    value: 'last-90-days',
    getRange: () => {
      const endDate = dateUtils.getEndOfDay(Date.now());
      const startDate = dateUtils.getStartOfDay(dateUtils.getDaysAgo(90));
      return { startDate, endDate };
    },
  },
  {
    label: 'This month',
    value: 'this-month',
    getRange: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: dateUtils.getStartOfDay(startOfMonth.getTime()),
        endDate: dateUtils.getEndOfDay(endOfMonth.getTime()),
      };
    },
  },
  {
    label: 'Last month',
    value: 'last-month',
    getRange: () => {
      const now = new Date();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: dateUtils.getStartOfDay(startOfLastMonth.getTime()),
        endDate: dateUtils.getEndOfDay(endOfLastMonth.getTime()),
      };
    },
  },
  {
    label: 'Custom range',
    value: 'custom',
    getRange: () => ({ startDate: 0, endDate: 0 }), // Placeholder
  },
];

export const DateRangePicker = ({
  startDate,
  endDate,
  onDateRangeChange,
  className = '',
}: DateRangePickerProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(startDate),
    to: new Date(endDate),
  });

  const getCurrentPreset = (start: number, end: number): string => {
    for (const preset of dateRangePresets.slice(0, -1)) { // Exclude custom option
      const range = preset.getRange();
      if (Math.abs(range.startDate - start) < 24 * 60 * 60 * 1000 && 
          Math.abs(range.endDate - end) < 24 * 60 * 60 * 1000) {
        return preset.value;
      }
    }
    return 'custom';
  };

  const formatDateRange = (start: number, end: number): string => {
    const presetValue = getCurrentPreset(start, end);
    const preset = dateRangePresets.find(p => p.value === presetValue);
    
    if (preset && preset.value !== 'custom') {
      return preset.label;
    }
    
    // Custom range
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const startMonth = startDateObj.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDateObj.getDate();
    const endMonth = endDateObj.toLocaleDateString('en-US', { month: 'short' });
    const endDay = endDateObj.getDate();
    const startYear = startDateObj.getFullYear();
    const endYear = endDateObj.getFullYear();
    
    if (startYear === endYear) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    }
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  };

  const handlePresetClick = (presetValue: string): void => {
    const preset = dateRangePresets.find(p => p.value === presetValue);
    if (preset) {
      const range = preset.getRange();
      onDateRangeChange(range.startDate, range.endDate);
      setDateRange({
        from: new Date(range.startDate),
        to: new Date(range.endDate),
      });
      setIsOpen(false);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined): void => {
    setDateRange(range);
  };

  const handleApply = (): void => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    const start = dateUtils.getStartOfDay(dateRange.from.getTime());
    const end = dateUtils.getEndOfDay(dateRange.to.getTime());
    
    // Validate date range
    if (start > end) return;
    
    // Check if range is too large (max 365 days)
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) return;
    
    onDateRangeChange(start, end);
    setIsOpen(false);
  };

  const handleCancel = (): void => {
    setDateRange({
      from: new Date(startDate),
      to: new Date(endDate),
    });
    setIsOpen(false);
  };

  const maxDate = new Date();
  const minDate = new Date();
  minDate.setFullYear(maxDate.getFullYear() - 2);

  const isValidRange = dateRange?.from && dateRange?.to && dateRange.from <= dateRange.to;
  const dayCount = isValidRange ? 
    Math.ceil((dateRange.to!.getTime() - dateRange.from!.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const isRangeTooLarge = dayCount > 365;

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal min-w-[240px]"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {formatDateRange(startDate, endDate)}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className="w-auto p-0" 
          align="end" 
          side="bottom" 
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions={true}
        >
          <div className="flex">
            {/* Quick Presets */}
            <div className="w-32 p-2 border-r bg-gray-50/50">
              <div className="text-xs font-medium mb-2 text-gray-600">Quick Select</div>
              <div className="space-y-0.5">
                {dateRangePresets.slice(0, -1).map((preset) => (
                  <Button
                    key={preset.value}
                    variant={getCurrentPreset(startDate, endDate) === preset.value ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs h-6 px-2 py-1 font-normal"
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Range Calendar */}
            <div className="p-3">
              <div className="text-sm font-medium mb-3">Custom Range</div>
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                disabled={(date) => 
                  date > maxDate || date < minDate
                }
                className="rounded-md border"
              />
              
              <Separator className="my-4" />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!isValidRange || isRangeTooLarge}
                  className="flex-1"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              
              {isValidRange && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {dayCount} days selected
                  {isRangeTooLarge && (
                    <span className="text-red-500 block">Max 365 days allowed</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
