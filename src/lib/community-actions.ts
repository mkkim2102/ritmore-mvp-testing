"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { labTokenValid } from "@/lib/auth"
import { CUSTOMER_TIN_COUNTS, isTinFamily, tinSlugForCount } from "@/lib/bundles"
import { getProductBySlug } from "@/lib/catalog"
import {
  ANSWER_MAX,
  INQUIRY_BODY_MAX,
  INQUIRY_NAME_MAX,
  REVIEW_BODY_MAX,
  REVIEW_NAME_MAX,
  communityKey,
  insertInquiry,
  insertReview,
  saveInquiryAnswer,
} from "@/lib/community"
import { COOKIE } from "@/lib/touch"

type FormState = { ok: boolean; error: string; nonce: string }

function rejected(error: string): FormState {
  return { ok: false, error, nonce: "" }
}

function accepted(): FormState {
  return { ok: true, error: "", nonce: randomUUID() }
}

function readBody(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
}

function readName(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function writeKey(slug: string) {
  if (isTinFamily(slug)) return communityKey(slug)
  const product = getProductBySlug(slug)
  if (!product || product.status !== "active") return null
  return communityKey(slug)
}

function revalidateCommunity() {
  for (const count of CUSTOMER_TIN_COUNTS) {
    revalidatePath(`/products/${tinSlugForCount(count)}`)
  }
}

export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const key = writeKey(String(formData.get("slug") ?? ""))
  if (!key) return rejected("상품을 찾지 못했습니다.")

  const score = Number(formData.get("score"))
  const body = readBody(formData.get("body"))
  const name = readName(formData.get("name"))

  if (!Number.isInteger(score) || score < 1 || score > 5) return rejected("별점을 1에서 5 사이로 골라 주세요.")
  if (!body) return rejected("후기를 적어 주세요.")
  if (body.length > REVIEW_BODY_MAX) return rejected("후기는 500자까지입니다.")
  if (name.length > REVIEW_NAME_MAX) return rejected("이름은 20자까지입니다.")

  insertReview({ productKey: key, score, body, name })
  revalidateCommunity()
  return accepted()
}

export async function submitInquiryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const key = writeKey(String(formData.get("slug") ?? ""))
  if (!key) return rejected("상품을 찾지 못했습니다.")

  const body = readBody(formData.get("body"))
  const name = readName(formData.get("name"))

  if (!body) return rejected("문의를 적어 주세요.")
  if (body.length > INQUIRY_BODY_MAX) return rejected("문의는 500자까지입니다.")
  if (name.length > INQUIRY_NAME_MAX) return rejected("이름은 20자까지입니다.")

  insertInquiry({ productKey: key, body, name })
  revalidateCommunity()
  return accepted()
}

async function requireLab() {
  const jar = await cookies()
  if (!labTokenValid(jar.get(COOKIE.lab)?.value)) redirect("/dashboard/login")
}

function inquiryError(message: string): never {
  redirect(`/dashboard/inquiries?error=${encodeURIComponent(message)}`)
}

export async function answerInquiryAction(formData: FormData) {
  await requireLab()
  const id = String(formData.get("id") ?? "").trim()
  const answer = readBody(formData.get("answer"))
  if (!id) inquiryError("문의를 찾지 못했습니다.")
  if (!answer) inquiryError("답변을 적어 주세요.")
  if (answer.length > ANSWER_MAX) inquiryError("답변은 1000자까지입니다.")
  if (!saveInquiryAnswer(id, answer)) inquiryError("문의를 찾지 못했습니다.")
  revalidateCommunity()
  revalidatePath("/dashboard/inquiries")
  redirect("/dashboard/inquiries?saved=1")
}
