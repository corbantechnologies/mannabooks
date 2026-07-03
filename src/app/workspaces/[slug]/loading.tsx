// src/app/workspaces/[slug]/loading.tsx
export default function WorkspaceLoadingSkeleton() {
  return (
    <div className="p-8 space-y-10 selection:bg-black selection:text-white animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-6">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-zinc-200"></div>
          <div className="h-8 w-64 bg-zinc-300"></div>
        </div>
        <div className="h-9 w-36 bg-zinc-200"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-black divide-y sm:divide-y-0 sm:divide-x divide-black bg-white">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 space-y-3">
            <div className="h-2 w-28 bg-zinc-200"></div>
            <div className="h-7 w-32 bg-zinc-300"></div>
            <div className="h-2 w-20 bg-zinc-100"></div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-zinc-200"></div>
          <div className="h-4 w-32 bg-zinc-200"></div>
        </div>
        <div className="border border-black bg-white h-48 w-full p-4 flex flex-col justify-around">
          <div className="h-6 bg-zinc-100 w-full"></div>
          <div className="h-6 bg-zinc-50 w-full"></div>
          <div className="h-6 bg-zinc-100 w-full"></div>
        </div>
      </div>
    </div>
  );
}
