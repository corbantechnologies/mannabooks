// src/app/workspaces/[slug]/loading.tsx
export default function WorkspaceLoadingSkeleton() {
  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-zinc-200 rounded-md"></div>
          <div className="h-8 w-64 bg-zinc-200 rounded-md"></div>
        </div>
        <div className="h-9 w-36 bg-zinc-200 rounded-md"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-modern p-5 space-y-3 bg-white">
            <div className="h-2 w-28 bg-zinc-200 rounded-md"></div>
            <div className="h-7 w-32 bg-zinc-200 rounded-md"></div>
            <div className="h-2 w-20 bg-zinc-100 rounded-md"></div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-zinc-200 rounded-md"></div>
          <div className="h-4 w-32 bg-zinc-200 rounded-md"></div>
        </div>
        <div className="card-modern bg-white h-48 w-full p-4 flex flex-col justify-around">
          <div className="h-6 bg-zinc-100 rounded-md w-full"></div>
          <div className="h-6 bg-zinc-50 rounded-md w-full"></div>
          <div className="h-6 bg-zinc-100 rounded-md w-full"></div>
        </div>
      </div>
    </div>
  );
}
