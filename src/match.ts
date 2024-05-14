import { Params, generatePath, matchPath } from '@remix-run/router'
import { filterListSchema } from './schema.js'
import { Filter, Rule, RuleExpr } from './types.js'

// https://github.com/remix-run/react-router/issues/10291
function bringBackTrailingSlash(path: string, original: string) {
  if (original.endsWith('/') && !path.endsWith('/')) {
    return path + '/'
  }
  return path
}

function renderRule(rule: Rule, params: Params<string>) {
  const trailingSlash = rule.value.endsWith('/')
  let value = generatePath(rule.value, params)
  const index = rule.value.indexOf('#')
  if (index > 0) {
    value =
      generatePath(rule.value.slice(0, index), params) + rule.value.slice(index)
  }
  return {
    ...rule,
    value: bringBackTrailingSlash(value, rule.value),
  }
}

function renderFilter(filter: Filter, params: Params<string>) {
  switch (filter.op) {
    case 'or':
      filter.rules = filter.rules.map(
        (rule) => renderFilter(rule, params) as RuleExpr,
      )
      return filter
    case 'and':
      filter.rules = filter.rules.map((rule) => renderRule(rule, params))
      return filter
    default:
      return renderRule(filter, params)
  }
}

export function match(url: string, filtersObject: Record<string, any>) {
  const filters = filterListSchema.parse(filtersObject)
  const { pathname } = new URL(url)

  for (const { page, filter } of filters) {
    const match = matchPath(page, pathname)
    if (match) {
      const matchedFilter = renderFilter(filter, match.params)
      return matchedFilter
    }
  }
}
