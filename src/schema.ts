// Generated by ts-to-zod
import { z } from 'zod'

export const ruleFieldSchema = z.union([
  z.literal('url'),
  z.literal('pathname'),
  z.literal('text'),
])

export const ruleSchema = z.object({
  field: ruleFieldSchema,
  op: z.union([
    z.literal('equals'),
    z.literal('not-equals'),
    z.literal('startsWith'),
    z.literal('not-startsWith'),
    z.literal('endsWith'),
    z.literal('not-endsWith'),
    z.literal('contains'),
    z.literal('not-contains'),
  ]),
  value: z.string().min(1),
})

export const ruleExprSchema = z.union([
  ruleSchema,
  z.object({
    op: z.literal('and'),
    rules: z.array(ruleSchema),
  }),
])

export const filterSchema = z.union([
  ruleExprSchema,
  z.object({
    op: z.literal('or'),
    rules: z.array(ruleExprSchema),
  }),
])

export const filterItemSchema = z.object({
  page: z.string(),
  filter: filterSchema,
})

export const filterListSchema = z.array(filterItemSchema)
