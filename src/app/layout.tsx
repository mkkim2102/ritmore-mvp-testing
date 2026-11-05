import { Poppins } from "next/font/google"
import { rootMetadata } from "@/lib/seo"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata = rootMetadata()

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${poppins.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col bg-white text-[#111111]">{children}</body>
    </html>
  )
}
