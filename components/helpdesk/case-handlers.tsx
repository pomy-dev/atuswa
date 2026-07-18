'use client'

import { CaseHandler } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CaseHandlersProps {
  handlers: CaseHandler[]
}

export function CaseHandlers({ handlers }: CaseHandlersProps) {
  if (handlers?.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Case Handlers</h3>
        <p className="text-sm text-muted-foreground">No handlers assigned yet</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Case Journey</h3>
      <div className="space-y-3">
        {handlers?.map((handler, index) => (
          <div key={handler.userId + handler.handledAt} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-accent-foreground">
                  {index + 1}
                </span>
              </div>
              {index < handlers.length - 1 && (
                <div className="w-0.5 h-8 bg-border mt-2" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{handler.userName}</p>
                <Badge variant="secondary" className="text-xs">
                  {handler.action}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(handler.handledAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
