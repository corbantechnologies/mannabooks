// src/providers/QueryProvider.tsx
"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      // One change usually moves several screens at once (an invoice posts journal entries, stock and
      // balances), so after any successful save, mark everything cached as stale. Screens on view
      // refetch now; the rest refetch when opened.
      mutationCache: new MutationCache({
        onSuccess: () => {
          client.invalidateQueries();
        },
      }),
      defaultOptions: {
        queries: {
          // Show cached data instantly, but always check for newer data when a screen opens:
          // ledgers and balances must never look out of date after navigating.
          staleTime: 0,
          refetchOnMount: "always",
          refetchOnWindowFocus: false,
        },
      },
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
