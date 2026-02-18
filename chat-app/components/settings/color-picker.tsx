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
  { name: 'Ocean', value: '#4A8BC2' },
  { name: 'Navy', value: '#1A2938' },
  { name: 'Golden', value: '#D4A04A' },
  { name: 'Seafoam', value: '#2BA89E' },
  { name: 'Coral', value: '#D06050' },
  { name: 'Dusk', value: '#6B5B95' },
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
          <div className="text-sm font-medium">Accent Colour</div>

          {/* Preset colours */}
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Preset accent colours">
            {presetColors.map((color) => (
              <button
                key={color.value}
                type="button"
                role="radio"
                aria-checked={value.toLowerCase() === color.value.toLowerCase()}
                aria-label={`${color.name} colour`}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all',
                  value.toLowerCase() === color.value.toLowerCase()
                    ? 'bg-muted ring-2 ring-foreground'
                    : 'hover:bg-muted/50'
                )}
                onClick={() => {
                  onChange(color.value)
                  setCustomColor(color.value)
                }}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                    value.toLowerCase() === color.value.toLowerCase()
                      ? 'border-foreground'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: color.value }}
                >
                  {value.toLowerCase() === color.value.toLowerCase() && (
                    <Check className="h-4 w-4 text-white" aria-hidden="true" />
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{color.name}</span>
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
            <label htmlFor="accent-color-picker" className="sr-only">
              Select custom color
            </label>
            <input
              id="accent-color-picker"
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                setCustomColor(e.target.value)
              }}
              className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Custom color picker"
            />
            <span className="text-xs text-muted-foreground" aria-hidden="true">
              Or use color picker
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
