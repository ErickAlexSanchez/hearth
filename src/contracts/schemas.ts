import { z } from 'zod'

export const signUpSchema = z
  .object({
    email: z.string(),
    password: z.string(),
    displayName: z.string(),
  })
  .strict()

export const signInSchema = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .strict()

export const publishPostSchema = z
  .object({
    body: z.string(),
    visibility: z.string(),
  })
  .strict()

export const feedQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(20).optional(),
})

export const coachTurnSchema = z
  .object({
    text: z.string(),
  })
  .strict()

export const checkoutWebhookSchema = z
  .object({
    type: z.literal('checkout.session.completed'),
    data: z
      .object({
        userId: z.string(),
      })
      .strict(),
  })
  .strict()

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().min(3).max(320),
  displayName: z.string().min(1).max(80),
  tier: z.enum(['free', 'member']),
})

export const feedPostSchema = z.object({
  id: z.string().uuid(),
  body: z.string(),
  visibility: z.enum(['public', 'members']),
  createdAt: z.string(),
  author: z.object({
    id: z.string().uuid(),
    displayName: z.string(),
  }),
})

export const feedPageSchema = z.object({
  posts: z.array(feedPostSchema),
  nextCursor: z.string().nullable(),
})

export const coachMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'coach']),
  body: z.string(),
  createdAt: z.string(),
})

export const coachThreadSchema = z.object({
  messages: z.array(coachMessageSchema),
})

export const sessionSchema = z.object({
  user: publicUserSchema,
})

export type PublicUserJson = z.infer<typeof publicUserSchema>
export type FeedPostJson = z.infer<typeof feedPostSchema>
export type FeedPageJson = z.infer<typeof feedPageSchema>
export type CoachMessageJson = z.infer<typeof coachMessageSchema>
export type CoachThreadJson = z.infer<typeof coachThreadSchema>
