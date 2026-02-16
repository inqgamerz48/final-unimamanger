'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface HODFilterBarProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: {
    key: string
    placeholder: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }[]
}

export function HODFilterBar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
}: HODFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white"
        />
      </div>
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value || 'ALL'}
          onValueChange={(value) => filter.onChange(value === 'ALL' ? '' : value)}
        >
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All {filter.placeholder}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}
