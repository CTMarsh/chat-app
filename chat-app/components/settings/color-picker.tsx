'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

const presetColors = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = React.useState(value)

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    // Only update if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      onChange(newColor)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[120px] justify-start gap-2"
        >
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: value }}
          />
          <span className="truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="text-sm font-medium">Accent Color</div>

          {/* Preset colors */}
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                  value === color.value
                    ? 'border-foreground'
                    : 'border-transparent hover:border-muted-foreground'
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  onChange(color.value)
                  setCustomColor(color.value)
                }}
                title={color.name}
              >
                {value === color.value && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>

          {/* Custom color input */}
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 shrink-0 rounded-full border"
              style={{ backgroundColor: customColor }}
            />
            <Input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#3b82f6"
              className="h-8 font-mono text-xs"
            />
          </div>

          {/* Native color picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                setCustomColor(e.target.value)
              }}
              className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="text-xs text-muted-foreground">
              Or use color picker
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
