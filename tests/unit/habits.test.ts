import { planHabitReply } from '@/domain/coach/habits'

const BANNED = /\b(dose|doses|dosage|diagnosis|diagnose|prescription|medication|symptom|milligram|mg)\b/i

describe('habit replies', () => {
  const samples = [
    'hello',
    'I cannot sleep',
    'walk after lunch',
    'my phone is a problem',
    'meals are rushed',
    'what mg should I take',
    'please diagnose this',
    'what dose should I take?',
  ]

  it('stays on habits and does not diagnose or dose', () => {
    for (const sample of samples) {
      const reply = planHabitReply(sample)
      expect(reply.toLowerCase()).toMatch(/habit|walk|phone|meal|sleep|lights/)
      expect(reply).not.toMatch(BANNED)
      expect(reply.toLowerCase()).not.toContain(sample.toLowerCase())
    }
  })

  it('redirects a clinical question without echoing it', () => {
    const reply = planHabitReply('What dose should I take?')
    expect(reply).toMatch(/everyday habits/i)
    expect(reply).not.toMatch(/dose/i)
  })
})
