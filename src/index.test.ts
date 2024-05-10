import path from 'path'
import { readdir } from 'fs/promises'
import { describe, test, expect } from 'bun:test'
import { Filter, accept, match } from './index.js'
import { filterListSchema } from './schema.js'

interface Case {
  page: string
  filter: Filter
  accept: string[]
  reject: string[]
}

const CASES: Record<string, Case[]> = {
  'github.com': [
    {
      page: 'https://github.com/vercel/next.js/issues/61318',
      filter: {
        field: 'url',
        op: 'contains',
        value: '/vercel/next.js/issues/61318#issue',
      },
      accept: [],
      reject: [],
    },
    {
      page: 'https://github.com/vercel/next.js/releases',
      filter: {
        field: 'pathname',
        op: 'startsWith',
        value: '/vercel/next.js/releases/tag/',
      },
      accept: ['https://github.com/vercel/next.js/releases/tag/v14.3.0'],
      reject: ['https://github.com/vercel/next.js/releases/tags/v14.3.0'],
    },
  ],
}

const files = await readdir(path.join(__dirname, '..', 'filters'), {
  recursive: true,
})

for (const file of files) {
  if (file.endsWith('filters.json')) {
    console.log('Checking', file)
    const { default: json } = await import(`../filters/${file}`)
    const filters = filterListSchema.parse(json)

    const hostname = file.split('/')[0]
    const cases = CASES[hostname]

    for (const c of cases) {
      describe(hostname, () => {
        const matched = match(c.page, filters)
        if (!matched) {
          expect().fail()
          return
        }
        test(`match ${c.page}`, () => {
          expect(matched).toEqual(c.filter)
        })
        test.each(c.accept)('accept %s', (href) => {
          expect(accept(matched, href)).toBe(true)
        })
        test.each(c.reject)('reject %s', (href) =>
          expect(accept(matched, href)).toBe(false),
        )
      })
    }
  }
}
