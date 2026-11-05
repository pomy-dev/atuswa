import { Spinner } from "@/components/ui/spinner"

export function FullScreenLoader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <Spinner className="size-12 text-primary" />
    </div>
  )
}