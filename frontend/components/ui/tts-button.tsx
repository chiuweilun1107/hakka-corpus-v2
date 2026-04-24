'use client'
import { Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TtsButtonProps {
  text: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'outline'
  className?: string
  title?: string
}

export function TtsButton({ text, size = 'sm', variant = 'ghost', className, title }: TtsButtonProps) {
  const iconSize = size === 'lg' ? 20 : size === 'md' ? 16 : 14
  const dim = size === 'lg' ? 'h-12 w-12' : size === 'md' ? 'h-9 w-9' : 'h-8 w-8'
  return (
    <Button
      size="icon" variant={variant}
      className={cn('rounded-full text-muted-foreground hover:text-foreground', dim, className)}
      title={title}
      onClick={() => {
        new Audio(`/api/v1/tts?text=${encodeURIComponent(text)}`).play().catch(() => {})
      }}
    >
      <Volume2 size={iconSize} />
    </Button>
  )
}
