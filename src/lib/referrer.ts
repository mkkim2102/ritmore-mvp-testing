export const REFERRER_CLASSES = ["instagram", "naver", "google", "ai", "other", "direct"] as const

export type ReferrerClass = (typeof REFERRER_CLASSES)[number]

const REFERRER_LABEL: Record<ReferrerClass, string> = {
  instagram: "인스타그램",
  naver: "네이버",
  google: "구글 검색",
  ai: "AI 검색",
  other: "기타 사이트",
  direct: "직접/알 수 없음",
}

const AI_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "claude.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
]

export const SOURCE_LINKS = [
  {
    id: "link_src_instagram",
    code: "instagram",
    name: "인스타그램",
    channel: "instagram",
    note: "출처만 구분합니다. 진열 가격은 기본가입니다.",
  },
  {
    id: "link_src_naver",
    code: "naver",
    name: "네이버",
    channel: "naver",
    note: "출처만 구분합니다. 진열 가격은 기본가입니다.",
  },
  {
    id: "link_src_google",
    code: "google",
    name: "구글 검색",
    channel: "google",
    note: "출처만 구분합니다. 진열 가격은 기본가입니다. 검색어는 저장하지 않습니다.",
  },
  {
    id: "link_src_ai",
    code: "ai",
    name: "AI 검색",
    channel: "ai",
    note: "출처만 구분합니다. 진열 가격은 기본가입니다.",
  },
] as const

export function referrerLabel(value: string | null | undefined) {
  if (!value || value === "direct") return REFERRER_LABEL.direct
  if ((REFERRER_CLASSES as readonly string[]).includes(value)) return REFERRER_LABEL[value as ReferrerClass]
  return REFERRER_LABEL.other
}

export function classifyReferrer(referrer: string | null | undefined): ReferrerClass {
  if (!referrer) return "direct"
  const hostname = hostnameOf(referrer)
  if (!hostname) return "other"
  if (AI_HOSTS.some((host) => hostMatches(hostname, host))) return "ai"
  if (hostMatches(hostname, "instagram.com")) return "instagram"
  if (hostMatches(hostname, "naver.com")) return "naver"
  if (isGoogleSearchHost(hostname)) return "google"
  return "other"
}

export function externalReferrer(referer: string | null | undefined, pageHosts: string | readonly string[]) {
  if (!referer) return null
  const trimmed = referer.trim()
  if (!trimmed) return null
  const hosts = hostList(pageHosts)
  try {
    const url = new URL(trimmed)
    if (!url.hostname) return null
    if (hosts.some((host) => sameSite(url.host, host))) return null
    return referrerWithoutSearch(url.toString())
  } catch {
    return null
  }
}

function hostList(pageHosts: string | readonly string[]) {
  const values = typeof pageHosts === "string" ? [pageHosts] : pageHosts
  const hosts: string[] = []
  for (const value of values) {
    for (const part of value.split(",")) {
      const host = part.trim()
      if (host) hosts.push(host)
    }
  }
  return hosts
}

function sameSite(refererHost: string, pageHost: string) {
  const left = foldLoopback(refererHost)
  const right = foldLoopback(pageHost)
  return left !== "" && left === right
}

function foldLoopback(host: string) {
  return host.toLowerCase().replace(/^(?:127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?=:|$)/, "localhost")
}

export function publicReferrer(referrer: string | null | undefined) {
  const stripped = referrerWithoutSearch(referrer)
  if (!stripped) return null
  try {
    if (isLoopback(new URL(stripped).hostname)) return null
  } catch {
    return null
  }
  return stripped
}

function isLoopback(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1"
}

export function referrerWithoutSearch(referrer: string | null | undefined) {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    url.search = ""
    url.hash = ""
    const value = url.toString()
    return value.length > 300 ? value.slice(0, 300) : value
  } catch {
    return null
  }
}

function hostnameOf(referrer: string) {
  try {
    return new URL(referrer).hostname.toLowerCase()
  } catch {
    return null
  }
}

function hostMatches(hostname: string, root: string) {
  const host = hostname.replace(/^www\./, "")
  return host === root || host.endsWith(`.${root}`)
}

function isGoogleSearchHost(hostname: string) {
  const host = hostname.replace(/^www\./, "")
  return /(?:^|\.)google\.(?:[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host)
}
