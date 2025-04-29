import { Loader2 } from "lucide-react"
import { Layout } from "@/components/layout"

export default function Loading() {
  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </Layout>
  )
}
