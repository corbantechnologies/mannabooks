// src/app/(dashboard)/layout.tsx
// This layout group wraps the /dashboard route which is purely a server-side redirect proxy.
// No UI chrome is needed here since users pass through instantly.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
