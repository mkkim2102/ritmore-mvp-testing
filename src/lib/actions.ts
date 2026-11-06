"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { LAB_MAX_AGE, labToken, labTokenValid, passwordOk } from "@/lib/auth"
import { isCustomerTinSlug } from "@/lib/bundles"
import { channelById } from "@/lib/channels"
import {
  getLinkByCode,
  getProductById,
  getProductBySlug,
  getVariant,
  setSetting,
} from "@/lib/catalog"
import { run } from "@/lib/db"
import { entryCodeFor, normalizeEntrySuffix, PUBLIC_ENTRY_ORIGIN } from "@/lib/entry"
import { COOKIE, safePath } from "@/lib/touch"

async function requireLab() {
  const jar = await cookies()
  if (!labTokenValid(jar.get(COOKIE.lab)?.value)) redirect("/dashboard/login")
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

function listPriceFromForm(formData: FormData, path: string, message: string) {
  const fields = formData.getAll("compareAt").map((item) => String(item).trim())
  let raw = ""
  for (let index = fields.length - 1; index >= 0; index -= 1) {
    if (fields[index]) {
      raw = fields[index]
      break
    }
  }
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0 || value > 10_000_000) fail(path, message)
  return value
}

function syncVariantListPrice(productId: string, compareAt: number | null) {
  run("UPDATE variants SET compare_at_price = ? WHERE product_id = ?", [compareAt, productId])
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "")
  const token = labToken()
  if (!token || !passwordOk(password)) redirect("/dashboard/login?e=1")
  const jar = await cookies()
  jar.set(COOKIE.lab, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: LAB_MAX_AGE,
  })
  redirect("/dashboard")
}

export async function logoutAction() {
  const jar = await cookies()
  jar.delete(COOKIE.lab)
  redirect("/dashboard/login")
}

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  summary: z.string().trim().max(120),
  description: z.string().trim().max(800),
  category: z.string().trim().max(30),
  basePrice: z.coerce.number().int().min(0).max(10_000_000),
  compareAt: z.string().trim(),
  status: z.enum(["active", "hidden"]),
})

export async function updateProductAction(formData: FormData) {
  await requireLab()
  const parsed = productSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    category: formData.get("category"),
    basePrice: formData.get("basePrice"),
    compareAt: formData.get("compareAt"),
    status: formData.get("status"),
  })
  if (!parsed.success) fail("/dashboard/products", "상품 입력을 확인해 주세요.")
  const product = getProductById(parsed.data.id)
  if (!product) fail("/dashboard/products", "상품을 찾지 못했습니다.")

  const compareAt = listPriceFromForm(formData, "/dashboard/products", "정가는 0 이상의 정수로 입력해 주세요.")

  run(
    `UPDATE products
     SET name = ?, summary = ?, description = ?, category = ?, base_price = ?, compare_at_price = ?, status = ?
     WHERE id = ?`,
    [
      parsed.data.name,
      parsed.data.summary,
      parsed.data.description,
      parsed.data.category || "자리표시",
      parsed.data.basePrice,
      compareAt,
      parsed.data.status,
      parsed.data.id,
    ],
  )
  syncVariantListPrice(parsed.data.id, compareAt)
  revalidatePath("/", "layout")
  redirect("/dashboard/products?saved=1")
}

const variantSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(20),
  price: z.coerce.number().int().min(0).max(10_000_000),
})

export async function updateVariantAction(formData: FormData) {
  await requireLab()
  const parsed = variantSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    price: formData.get("price"),
  })
  if (!parsed.success) fail("/dashboard/products", "가격안 입력을 확인해 주세요.")
  const variant = getVariant(parsed.data.id)
  if (!variant) fail("/dashboard/products", "가격안을 찾지 못했습니다.")
  const product = getProductById(variant.productId)
  const compareAt = formData.has("compareAt")
    ? listPriceFromForm(formData, "/dashboard/products", "정가는 0 이상의 정수로 입력해 주세요.")
    : (product?.compareAtPrice ?? variant.compareAtPrice)
  run("UPDATE variants SET label = ?, price = ?, compare_at_price = ? WHERE id = ?", [
    parsed.data.label,
    parsed.data.price,
    compareAt,
    parsed.data.id,
  ])
  if (formData.has("compareAt") && product) {
    run("UPDATE products SET compare_at_price = ? WHERE id = ?", [compareAt, product.id])
    syncVariantListPrice(product.id, compareAt)
  }
  revalidatePath("/", "layout")
  redirect("/dashboard/products?saved=1")
}

const experimentSchema = z.object({
  name: z.string().trim().min(1).max(40),
  productId: z.string().min(1),
  hypothesis: z.string().trim().max(200),
  labelA: z.string().trim().min(1).max(20),
  priceA: z.coerce.number().int().min(0).max(10_000_000),
  labelB: z.string().trim().min(1).max(20),
  priceB: z.coerce.number().int().min(0).max(10_000_000),
})

export async function createExperimentAction(formData: FormData) {
  await requireLab()
  const parsed = experimentSchema.safeParse({
    name: formData.get("name"),
    productId: formData.get("productId"),
    hypothesis: formData.get("hypothesis"),
    labelA: formData.get("labelA"),
    priceA: formData.get("priceA"),
    labelB: formData.get("labelB"),
    priceB: formData.get("priceB"),
  })
  if (!parsed.success) fail("/dashboard/products", "실험 입력을 확인해 주세요.")
  const product = getProductById(parsed.data.productId)
  if (!product) fail("/dashboard/products", "상품을 찾지 못했습니다.")

  const experimentId = randomUUID()
  const now = new Date().toISOString()
  run(
    `INSERT INTO experiments (id, name, hypothesis, status, product_id, created_at)
     VALUES (?, ?, ?, 'running', ?, ?)`,
    [experimentId, parsed.data.name, parsed.data.hypothesis, product.id, now],
  )
  run(
    `INSERT INTO variants (id, product_id, experiment_id, key, label, price, compare_at_price, active)
     VALUES (?, ?, ?, 'A', ?, ?, ?, 1), (?, ?, ?, 'B', ?, ?, ?, 1)`,
    [
      randomUUID(),
      product.id,
      experimentId,
      parsed.data.labelA,
      parsed.data.priceA,
      product.compareAtPrice,
      randomUUID(),
      product.id,
      experimentId,
      parsed.data.labelB,
      parsed.data.priceB,
      product.compareAtPrice,
    ],
  )
  revalidatePath("/", "layout")
  redirect("/dashboard/products?saved=1")
}

const linkSchema = z.object({
  name: z.string().trim().min(1).max(40),
  code: z.string().trim().max(40),
  channel: z.string().trim().min(1),
  utmSource: z.string().trim().max(80),
  utmMedium: z.string().trim().max(80),
  utmCampaign: z.string().trim().max(80),
  utmContent: z.string().trim().max(80),
  landingPath: z.string().trim().max(200),
  variantId: z.string().trim(),
  note: z.string().trim().max(200),
})

export async function createLinkAction(formData: FormData) {
  await requireLab()
  const parsed = linkSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    channel: formData.get("channel"),
    utmSource: formData.get("utmSource"),
    utmMedium: formData.get("utmMedium"),
    utmCampaign: formData.get("utmCampaign"),
    utmContent: formData.get("utmContent"),
    landingPath: formData.get("landingPath"),
    variantId: formData.get("variantId"),
    note: formData.get("note"),
  })
  if (!parsed.success) fail("/dashboard/links", "링크 입력을 확인해 주세요.")

  const channel = channelById(parsed.data.channel)
  const code =
    parsed.data.code.toLowerCase() ||
    `link-${randomUUID().slice(0, 4)}`
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(code)) {
    fail("/dashboard/links", "링크 코드는 영문 소문자, 숫자, -, _ 만 쓸 수 있습니다.")
  }

  const variant = parsed.data.variantId ? getVariant(parsed.data.variantId) : null
  if (parsed.data.variantId && !variant) fail("/dashboard/links", "가격안을 찾지 못했습니다.")

  const landingPath = safePath(parsed.data.landingPath || "/")
  try {
    run(
      `INSERT INTO links
        (id, code, name, channel, utm_source, utm_medium, utm_campaign, utm_content, landing_path, experiment_id, variant_id, product_id, note, archived, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        randomUUID(),
        code,
        parsed.data.name,
        channel.id,
        parsed.data.utmSource || channel.source,
        parsed.data.utmMedium || channel.medium,
        parsed.data.utmCampaign,
        parsed.data.utmContent,
        landingPath,
        variant?.experimentId ?? null,
        variant?.id ?? null,
        variant?.productId ?? null,
        parsed.data.note,
        new Date().toISOString(),
      ],
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.includes("UNIQUE")) fail("/dashboard/links", "이미 있는 링크 코드입니다.")
    throw error
  }
  revalidatePath("/dashboard/links")
  redirect(`/dashboard/links?created=${encodeURIComponent(code)}`)
}

export async function archiveLinkAction(formData: FormData) {
  await requireLab()
  const id = String(formData.get("id") ?? "")
  if (!id) fail("/dashboard/links", "링크를 찾지 못했습니다.")
  run("UPDATE links SET archived = 1 WHERE id = ?", [id])
  revalidatePath("/dashboard/links")
  redirect("/dashboard/links?saved=1")
}

const brandSchema = z.object({
  name: z.string().trim().min(1).max(30),
  tagline: z.string().trim().max(80),
})

const shelfSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(40),
  basePrice: z.coerce.number().int().min(0).max(10_000_000),
  compareAt: z.string().trim(),
})

export async function updateShelfPriceAction(formData: FormData) {
  await requireLab()
  const parsed = shelfSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    basePrice: formData.get("basePrice"),
    compareAt: formData.get("compareAt") ?? "",
  })
  if (!parsed.success) {
    const nameInvalid = parsed.error.issues.some((issue) => issue.path[0] === "name")
    fail(
      "/dashboard/master",
      nameInvalid ? "이름은 1자에서 40자 사이로 적어 주세요." : "실판매가는 0 이상의 정수로 적어 주세요.",
    )
  }
  if (!isCustomerTinSlug(parsed.data.slug)) fail("/dashboard/master", "구성을 찾지 못했습니다.")
  const product = getProductBySlug(parsed.data.slug)
  if (!product || product.status !== "active") fail("/dashboard/master", "상품을 찾지 못했습니다.")

  const compareAt = listPriceFromForm(
    formData,
    "/dashboard/master",
    "정가는 비우거나 0 이상의 정수로 적어 주세요.",
  )

  run("UPDATE products SET name = ?, base_price = ?, compare_at_price = ? WHERE id = ?", [
    parsed.data.name,
    parsed.data.basePrice,
    compareAt,
    product.id,
  ])
  syncVariantListPrice(product.id, compareAt)
  revalidatePath("/", "layout")
  redirect(`/dashboard/master?saved=${encodeURIComponent(product.slug)}`)
}

const entrySchema = z.object({
  name: z.string().trim().min(1).max(40),
  note: z.string().trim().max(200),
  priceOverride: z.string().trim().max(20),
})

export async function createEntryAction(formData: FormData) {
  await requireLab()
  const parsed = entrySchema.safeParse({
    name: formData.get("name"),
    note: formData.get("note"),
    priceOverride: formData.get("priceOverride") ?? "",
  })
  if (!parsed.success) fail("/dashboard/master", "진입점 입력을 확인해 주세요.")

  let priceOverride: number | null = null
  if (parsed.data.priceOverride) {
    if (!/^\d+$/.test(parsed.data.priceOverride)) {
      fail("/dashboard/master", "가격 고정은 비우거나 0 이상의 정수로 적어 주세요.")
    }
    priceOverride = Number(parsed.data.priceOverride)
    if (!Number.isInteger(priceOverride) || priceOverride > 10_000_000) {
      fail("/dashboard/master", "가격 고정은 비우거나 0 이상의 정수로 적어 주세요.")
    }
  }

  const suffix = normalizeEntrySuffix(String(formData.get("suffix") ?? ""))
  if (!suffix) fail("/dashboard/master", "주소는 / 로 시작하는 경로로 적어 주세요.")

  const product = productForEntryPath(suffix)
  if (!product) fail("/dashboard/master", "상품을 찾지 못했습니다.")
  const code = entryCodeFor(parsed.data.name, suffix)
  if (getLinkByCode(code)) fail("/dashboard/master", "이미 있는 코드입니다. 다른 이름을 적어 주세요.")

  const channel = channelById("instagram")
  try {
    run(
      `INSERT INTO links
        (id, code, name, channel, utm_source, utm_medium, utm_campaign, utm_content, landing_path, experiment_id, variant_id, product_id, note, price_override, archived, created_at)
       VALUES (?, ?, ?, ?, ?, ?, '', '', ?, NULL, NULL, ?, ?, ?, 0, ?)`,
      [
        randomUUID(),
        code,
        parsed.data.name,
        channel.id,
        channel.source,
        channel.medium,
        suffix,
        product.id,
        parsed.data.note,
        priceOverride,
        new Date().toISOString(),
      ],
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.includes("UNIQUE")) fail("/dashboard/master", "이미 있는 코드입니다. 다른 이름을 적어 주세요.")
    throw error
  }
  revalidatePath("/dashboard/master")
  redirect(`/dashboard/master?created=${encodeURIComponent(code)}`)
}

function productForEntryPath(suffix: string) {
  const pathname = new URL(suffix, PUBLIC_ENTRY_ORIGIN).pathname
  const match = /^\/products\/([^/]+)$/.exec(pathname)
  if (match) {
    const product = getProductBySlug(decodeURIComponent(match[1]))
    if (product) return product
  }
  return getProductBySlug("sample-a")
}

export async function deleteEntryAction(formData: FormData) {
  await requireLab()
  const id = String(formData.get("id") ?? "")
  if (!id) fail("/dashboard/master", "진입점을 찾지 못했습니다.")
  run("UPDATE links SET archived = 1 WHERE id = ?", [id])
  revalidatePath("/dashboard/master")
  redirect("/dashboard/master?deleted=1")
}

export async function updateBrandAction(formData: FormData) {
  await requireLab()
  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline"),
  })
  if (!parsed.success) fail("/dashboard/products", "브랜드 자리 입력을 확인해 주세요.")
  setSetting("brand_name", parsed.data.name)
  setSetting("brand_tagline", parsed.data.tagline)
  revalidatePath("/", "layout")
  redirect("/dashboard/products?saved=1")
}
