export function ModulePlaceholder({ description }: { description: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="max-w-sm text-center text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
