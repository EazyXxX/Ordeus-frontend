import { COLOR_DOT, type Color } from '@/lib/colors'
import { cn } from '@/lib/utils'

function initials(name: string) {
  const letters = name.trim().split(/\s+/).map((word) => [...word][0] ?? '')
  return letters.slice(0, 2).join('').toUpperCase()
}

type AccountAvatarProps = {
  name: string
  color: Color
  className?: string
}

export function AccountAvatar({ name, color, className }: AccountAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-medium text-white',
        COLOR_DOT[color],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
