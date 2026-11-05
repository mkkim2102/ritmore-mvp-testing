import { createHmac, timingSafeEqual } from "node:crypto"

export function labToken() {
  const secret = process.env.AUTH_SECRET
  if (!secret) return undefined
  return createHmac("sha256", secret).update("storelab-lab-v1").digest("hex")
}

export function labTokenValid(value: string | undefined) {
  const token = labToken()
  if (!value || !token) return false
  const actual = Buffer.from(value)
  const expected = Buffer.from(token)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export function passwordOk(input: string) {
  const configured = process.env.DASHBOARD_PASSWORD
  if (!configured) return false
  const expected = Buffer.from(configured)
  const actual = Buffer.from(input)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export const LAB_MAX_AGE = 60 * 60 * 12
