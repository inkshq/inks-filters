import { filterSchema } from './schema.js'
import { Filter, Rule, RuleField, RuleOp } from './types.js'
export * from './types.js'
export * from './schema.js'
export { match } from './match.js'

function catchUnhandledCase(t: never) {}

function acceptRuleValue(field: string, op: RuleOp, value: string): boolean {
  switch (op) {
    case 'equals':
      return field == value
    case 'not-equals':
      return field != value
    case 'startsWith':
    case 'endsWith':
      return field[op](value)
    case 'not-startsWith':
      return !field.startsWith(value)
    case 'not-endsWith':
      return !field.endsWith(value)
    case 'contains':
      return field.includes(value)
    case 'not-contains':
      return !field.includes(value)
    default:
      catchUnhandledCase(op)
      return false
  }
}

function acceptRule(rule: Rule, url: URL, innerText: string): boolean {
  const fieldRecord: Record<RuleField, string> = {
    url: url.toString(),
    pathname: url.pathname,
    text: innerText,
  }
  const field = fieldRecord[rule.field]?.toLowerCase()

  if (!field) {
    return false
  }

  const values = rule.value
    .toLowerCase()
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  return values.some((value) => acceptRuleValue(field, rule.op, value))
}

export function accept(filter: Filter, href: string, innerText = ''): boolean {
  const url = new URL(href)

  switch (filter.op) {
    case 'or':
      return filter.rules.some((rule) => accept(rule, href, innerText))
    case 'and':
      return filter.rules.every((rule) => acceptRule(rule, url, innerText))
    default:
      return acceptRule(filter, url, innerText)
  }
}

export function isVaildFilter(filter: unknown) {
  return filterSchema.safeParse(filter).success
}
