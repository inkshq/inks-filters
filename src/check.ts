import { match } from './match.js'

const url = process.argv.at(-1)
if (url) {
  console.log('Checking', url)
  const { hostname } = new URL(url)
  const { default: filters } = await import(
    `../filters/${hostname}/filters.json`
  )
  const matched = match(url, filters)
  if (matched) {
    console.log('Matched', matched)
  } else {
    console.log('No match')
  }
}
