export const CHANNELS = [
  { id: "instagram", label: "인스타그램", source: "instagram", medium: "social" },
  { id: "youtube", label: "유튜브", source: "youtube", medium: "video" },
  { id: "kakao", label: "카카오", source: "kakao", medium: "message" },
  { id: "naver", label: "네이버", source: "naver", medium: "cpc" },
  { id: "google", label: "구글 검색", source: "google", medium: "organic" },
  { id: "ai", label: "AI 검색", source: "ai", medium: "referral" },
  { id: "meta", label: "메타 광고", source: "meta", medium: "paid" },
  { id: "email", label: "이메일", source: "email", medium: "email" },
  { id: "direct", label: "직접 유입", source: "direct", medium: "none" },
  { id: "other", label: "기타", source: "other", medium: "referral" },
] as const

export type ChannelId = (typeof CHANNELS)[number]["id"]

export function channelById(id: string) {
  return CHANNELS.find((item) => item.id === id) ?? CHANNELS[CHANNELS.length - 1]
}

export function channelLabel(id: string) {
  return CHANNELS.find((item) => item.id === id)?.label ?? id
}
