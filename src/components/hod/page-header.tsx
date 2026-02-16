'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface HODPageHeaderProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
}

export function HODPageHeader({
  title,
  description,
  actionLabel = 'Add New',
  onAction,
  showAction = true,
}: HODPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-white/50 mt-1">{description}</p>
      </div>
      {showAction && onAction && (
        <Button
          onClick={onAction}
          className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
