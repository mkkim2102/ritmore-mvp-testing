import { randomUUID } from "node:crypto"

export function entryCodeFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 40)
  if (/^[a-z0-9][a-z0-9_-]{0,39}$/.test(slug)) return slug
  return `e${randomUUID().replace(/-/g, "").slice(0, 8)}`
}
