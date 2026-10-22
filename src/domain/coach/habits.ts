const CLINICAL =
  /\b(dose|doses|dosage|milligram|mg|prescription|medication|diagnose|diagnosis|symptom|tablet|antibiotic)\b/i

const WALK = /\b(walk|walking|steps)\b/i
const SLEEP = /\b(sleep|bedtime|wind-down|wind down)\b/i
const PHONE = /\b(phone|scroll|focus)\b/i
const MEAL = /\b(meal|meals|eat|food|water|lunch|breakfast)\b/i

const REDIRECT =
  'I can only help with everyday habits, not personal medical questions. A small step you can repeat: take a ten-minute walk after your next meal and do it again tomorrow.'

const REPLIES = {
  walk: 'Lace up and walk for ten minutes after your next meal. When you get back, leave your shoes by the door so the same walk is easy tomorrow.',
  sleep: 'Pick a lights-down time and keep it tonight. Put your phone in another room and read a few paper pages before you sleep.',
  phone: 'Choose one hour to leave your phone in another room. Fill that hour with a walk, a stretch, or a page of notes.',
  meal: 'Eat the next meal away from your screen, then drink a glass of water before you start the next task.',
  general:
    'Choose one habit small enough to repeat tomorrow: a short walk, a glass of water with a meal, or ten quiet minutes before sleep.',
} as const

export function planHabitReply(userText: string): string {
  const trimmed = userText.trim()
  if (CLINICAL.test(trimmed)) return REDIRECT
  if (WALK.test(trimmed)) return REPLIES.walk
  if (SLEEP.test(trimmed)) return REPLIES.sleep
  if (PHONE.test(trimmed)) return REPLIES.phone
  if (MEAL.test(trimmed)) return REPLIES.meal
  return REPLIES.general
}
