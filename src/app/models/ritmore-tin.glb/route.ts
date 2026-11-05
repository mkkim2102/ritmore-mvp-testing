import { readFile } from "node:fs/promises"
import path from "node:path"

export async function GET() {
  const file = await readFile(path.join(process.cwd(), "design/ritmore/ritmore_tin.glb"))
  return new Response(file, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
