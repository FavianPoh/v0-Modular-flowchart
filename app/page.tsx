import ModularFlowchart from "@/components/modular-flowchart"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-col items-center justify-center p-4 bg-slate-100 border-b">
        <h1 className="text-2xl font-bold">Modular Flowchart System</h1>
        <p className="text-sm text-muted-foreground">
          Create, connect, and manipulate modules with mathematical and logical functions
        </p>
      </div>
      <div className="flex-1 h-[calc(100vh-100px)]">
        <ModularFlowchart />
      </div>
    </main>
  )
}
