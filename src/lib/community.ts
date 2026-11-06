import { randomUUID } from "node:crypto"
import { isTinFamily } from "@/lib/bundles"
import { all, get, run } from "@/lib/db"

export const TIN_COMMUNITY_KEY = "ritmore"
export const REVIEW_BODY_MAX = 500
export const REVIEW_NAME_MAX = 20
export const INQUIRY_BODY_MAX = 500
export const INQUIRY_NAME_MAX = 20
export const ANSWER_MAX = 1000

export type StoredReview = {
  id: string
  createdAt: string
  score: number
  body: string
  name: string
}

export type StoredInquiry = {
  id: string
  createdAt: string
  productKey: string
  body: string
  name: string
  answer: string | null
  answeredAt: string | null
  isPrivate: boolean
}

type ReviewRow = {
  id: string
  created_at: string
  score: number
  body: string
  name: string
}

type InquiryRow = {
  id: string
  created_at: string
  product_key: string
  body: string
  name: string
  answer: string | null
  answered_at: string | null
  is_private: number
}

export function communityKey(slug: string) {
  return isTinFamily(slug) ? TIN_COMMUNITY_KEY : slug
}

export function listReviews(productKey: string) {
  return all<ReviewRow>(
    `SELECT id, created_at, score, body, name
     FROM reviews
     WHERE product_key = ?
     ORDER BY created_at DESC`,
    [productKey],
  ).map(toReview)
}

export function listInquiries(productKey: string) {
  return all<InquiryRow>(
    `SELECT id, created_at, product_key, body, name, answer, answered_at, is_private
     FROM inquiries
     WHERE product_key = ? AND is_private = 0
     ORDER BY created_at DESC`,
    [productKey],
  ).map(toInquiry)
}

export function listAllInquiries() {
  return all<InquiryRow>(
    `SELECT id, created_at, product_key, body, name, answer, answered_at, is_private
     FROM inquiries
     ORDER BY created_at DESC`,
  ).map(toInquiry)
}

export function insertReview(input: { productKey: string; score: number; body: string; name: string }) {
  const id = randomUUID()
  run(
    `INSERT INTO reviews (id, created_at, product_key, score, body, name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, new Date().toISOString(), input.productKey, input.score, input.body, input.name],
  )
  return id
}

export function insertInquiry(input: { productKey: string; body: string; name: string }) {
  const id = randomUUID()
  run(
    `INSERT INTO inquiries (id, created_at, product_key, body, name, answer, answered_at, is_private)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, 1)`,
    [id, new Date().toISOString(), input.productKey, input.body, input.name],
  )
  return id
}

export function saveInquiryAnswer(id: string, answer: string) {
  const existing = get<{ id: string }>("SELECT id FROM inquiries WHERE id = ?", [id])
  if (!existing) return false
  run("UPDATE inquiries SET answer = ?, answered_at = ? WHERE id = ?", [answer, new Date().toISOString(), id])
  return true
}

export function communityDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  return `${pick("year")}.${pick("month")}.${pick("day")}`
}

function toReview(row: ReviewRow): StoredReview {
  return {
    id: row.id,
    createdAt: row.created_at,
    score: row.score,
    body: row.body,
    name: row.name,
  }
}

function toInquiry(row: InquiryRow): StoredInquiry {
  return {
    id: row.id,
    createdAt: row.created_at,
    productKey: row.product_key,
    body: row.body,
    name: row.name,
    answer: row.answer,
    answeredAt: row.answered_at,
    isPrivate: row.is_private === 1,
  }
}
