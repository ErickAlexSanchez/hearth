import type { Locale } from '@/ui/messages'

export function formatWhen(iso: string, locale: Locale = 'en'): string {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return iso
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(time)
}
