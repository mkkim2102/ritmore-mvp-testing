import { loginAction } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const metadata = { title: "운영 화면 입장" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>
}) {
  const query = await searchParams

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardDescription>테스트 스토어</CardDescription>
          <CardTitle className="font-serif text-3xl">운영 화면</CardTitle>
          <p className="text-sm text-muted-foreground">
            퍼널과 링크를 보는 문입니다. 비밀번호는 이 배포에 설정된 값을 씁니다.
          </p>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" className="h-11" autoFocus required />
            </div>
            {query.e ? <p className="text-sm text-destructive">비밀번호가 맞지 않습니다.</p> : null}
            <Button type="submit" className="h-11 w-full">
              들어가기
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
