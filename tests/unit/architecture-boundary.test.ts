import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function collect(relativePaths: readonly string[]): string[] {
  const found: string[] = []
  for (const relative of relativePaths) {
    const absolute = path.join(root, relative)
    if (statSync(absolute).isDirectory()) {
      found.push(...walk(absolute))
    } else {
      found.push(absolute)
    }
  }
  return found
}

function walk(directory: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry)
    if (statSync(full).isDirectory()) {
      found.push(...walk(full))
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      found.push(full)
    }
  }
  return found
}

describe('module boundaries', () => {
  const feedFiles = collect([
    'src/domain/feed',
    'src/application/feed',
    'src/adapters/postgres/feed-repository.ts',
    'src/ports/feed-repository.ts',
    'src/app/api/feed',
  ])
  const coachFiles = collect([
    'src/domain/coach',
    'src/application/coach',
    'src/adapters/postgres/coach-repository.ts',
    'src/ports/coach-repository.ts',
    'src/app/api/coach',
  ])

  it('fails if feed code imports or names the coach schema', () => {
    expect(feedFiles.length).toBeGreaterThan(0)
    for (const file of feedFiles) {
      const text = readFileSync(file, 'utf8')
      expect(text.toLowerCase()).not.toContain('coach')
    }
    const feedRepository = readFileSync(path.join(root, 'src/adapters/postgres/feed-repository.ts'), 'utf8')
    expect(feedRepository).toContain('feed.posts')
  })

  it('fails if coach code imports the feed schema', () => {
    expect(coachFiles.length).toBeGreaterThan(0)
    for (const file of coachFiles) {
      const text = readFileSync(file, 'utf8')
      expect(text).not.toContain('feed.posts')
      expect(text).not.toMatch(/from\s+['"]@\/domain\/feed/)
      expect(text).not.toMatch(/from\s+['"]@\/application\/feed/)
      expect(text).not.toMatch(/from\s+['"]@\/adapters\/postgres\/feed-repository/)
      expect(text).not.toMatch(/from\s+['"]@\/ports\/feed-repository/)
      expect(text).not.toContain('FeedRepository')
    }
    const coachRepository = readFileSync(path.join(root, 'src/adapters/postgres/coach-repository.ts'), 'utf8')
    expect(coachRepository).toContain('coach.messages')
    expect(coachRepository).not.toContain('feed.posts')
  })

  it('keeps the eslint import guards', () => {
    const config = readFileSync(path.join(root, 'eslint.config.mjs'), 'utf8')
    expect(config).toContain('Feed must not import the coach module.')
    expect(config).toContain('Coach must not import the feed module.')
    expect(config).toContain('Domain and application stay free of React and the Postgres driver.')
  })

  it('keeps domain and application free of React, Postgres, and Zod', () => {
    const files = [...collect(['src/domain']), ...collect(['src/application'])]
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text).not.toMatch(/from\s+['"]react['"]/)
      expect(text).not.toMatch(/from\s+['"]next/)
      expect(text).not.toMatch(/from\s+['"]pg['"]/)
      expect(text).not.toMatch(/from\s+['"]zod['"]/)
    }
  })

  it('keeps the UI off the server adapters', () => {
    const files = collect(['src/ui'])
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text).not.toMatch(/from\s+['"]pg['"]/)
      expect(text).not.toMatch(/from\s+['"]@\/composition\//)
      expect(text).not.toMatch(/from\s+['"]@\/application\//)
      expect(text).not.toMatch(/from\s+['"]@\/adapters\/postgres\//)
    }
  })
})
