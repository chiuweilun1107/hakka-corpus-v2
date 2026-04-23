import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="臺灣客語語料庫"
      width={size}
      height={size}
      priority
      className={cn(className)}
    />
  )
}
