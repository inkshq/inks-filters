export type RuleField = 'url' | 'pathname' | 'text'

export type RuleOp =
  | 'equals'
  | 'not-equals'
  | 'startsWith'
  | 'not-startsWith'
  | 'endsWith'
  | 'not-endsWith'
  | 'contains'
  | 'not-contains'

export interface Rule {
  field: RuleField
  op: RuleOp
  /**
   * @minLength 1
   */
  value: string
}

export type RuleExpr =
  | Rule
  | {
      op: 'and'
      rules: Rule[]
    }

export type Filter =
  | RuleExpr
  | {
      op: 'or'
      rules: RuleExpr[]
    }

export type FilterItem = {
  page: string
  filter: Filter
}

export type FilterList = FilterItem[]
