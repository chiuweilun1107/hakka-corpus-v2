'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface VideoModalProps {
  videoUrl: string
  speakerName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoModal({ videoUrl, speakerName, open, onOpenChange }: VideoModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">{speakerName} 訪談影片</Dialog.Title>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {open && (
              <iframe
                src={`${videoUrl}?autoplay=1&rel=0&modestbranding=1`}
                title={speakerName}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            )}
          </div>
          <Dialog.Close className="absolute -top-10 right-0 rounded-full p-1 text-white/80 hover:text-white transition-colors hover:bg-white/10">
            <X size={20} />
            <span className="sr-only">關閉</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
