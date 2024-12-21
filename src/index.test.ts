import path from 'path'
import { readdir } from 'fs/promises'
import { describe, test, expect } from 'bun:test'
import { Filter, accept, match } from './index.js'
import { filterListSchema, filterSchema } from './schema.js'

interface Case {
  page: string
  filter: Filter
  accept?: string[]
  reject?: string[]
}

const CASES: Record<string, Case[]> = {
  'github.com': [
    {
      page: 'https://github.com/vercel/next.js/issues/61318',
      filter: {
        op: 'and',
        rules: [
          {
            field: 'url',
            op: 'contains',
            value: '/vercel/next.js/issues/61318#issue',
          },
          {
            field: 'url',
            op: 'not-contains',
            value: 'comment-box',
          },
        ],
      },
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
  'www.instagram.com': [
    {
      page: 'https://www.instagram.com/uid',
      filter: {
        field: 'pathname',
        op: 'startsWith',
        value: '/uid/',
      },
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
    const cases = CASES[hostname] || []

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
        test.each(c.accept || [])('accept %s', (href) => {
          expect(accept(matched, href)).toBe(true)
        })
        test.each(c.reject || [])('reject %s', (href) =>
          expect(accept(matched, href)).toBe(false),
        )
      })
    }
  }
}

const textCases = [
  {
    filter: {
      field: 'text',
      op: 'contains',
      value: 'under tree, sea,',
    },
    accept: ['Over rock and under tree', 'By streams that never find the sea'],
    reject: ['Roads go ever ever on', 'By caves where never sun has shone'],
  },
  {
    filter: {
      field: 'text',
      op: 'contains',
      value: 'rock, " the "',
    },
    accept: ['Over rock and under tree', 'By streams that never find the sea'],
    reject: ['there is their thesis', 'By caves where never sun has shone'],
  },
]

for (const c of textCases) {
  const filter = filterSchema.parse(c.filter)
  test.each(c.accept)('accept %s', (text) => {
    expect(accept(filter, 'http://localhost', text)).toBe(true)
  })
  test.each(c.reject)('reject %s', (text) => {
    expect(accept(filter, 'http://localhost', text)).toBe(false)
  })
}

const urlCases = [
  {
    filter: {
      field: 'pathname',
      op: 'not-startsWith',
      value: '/p1/, /q2/',
    },
    accept: ['http://example.com/r1/abc'],
    reject: ['http://example.com/p1/abc'],
  },
  {
    filter: {
      field: 'url',
      op: 'regex',
      value: 'http://example.com/*/',
    },
    accept: ['http://example.com/u1/abc'],
    reject: ['http://example.com/u1'],
  },
]

for (const c of urlCases) {
  const filter = filterSchema.parse(c.filter)
  test.each(c.accept)('accept %s', (url) => {
    expect(accept(filter, url)).toBe(true)
  })
  test.each(c.reject)('reject %s', (url) => {
    expect(accept(filter, url)).toBe(false)
  })
}
