import { filterSchema } from './schema.js'
import { Filter, Rule, RuleField } from './types.js'
export * from './types.js'
export * from './schema.js'
export { match } from './match.js'

function catchUnhandledCase(t: never) {}

function acceptRule(rule: Rule, url: URL, innerText: string): boolean {
  const fieldRecord: Record<RuleField, string> = {
    url: url.toString(),
    pathname: url.pathname,
    text: innerText,
  }
  const field = fieldRecord[rule.field]

  if (!field) {
    return false
  }

  switch (rule.op) {
    case 'equals':
      return field == rule.value
    case 'not-equals':
      return field != rule.value
    case 'startsWith':
    case 'endsWith':
      return field[rule.op](rule.value)
    case 'not-startsWith':
      return !field.startsWith(rule.value)
    case 'not-endsWith':
      return !field.endsWith(rule.value)
    case 'contains':
      return field.includes(rule.value)
    case 'not-contains':
      return !field.includes(rule.value)
    default:
      catchUnhandledCase(rule.op)
      return false
  }
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
