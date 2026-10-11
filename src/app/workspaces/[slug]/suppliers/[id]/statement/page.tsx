// src/app/workspaces/[slug]/suppliers/[id]/statement/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound, redirect } from "next/navigation";
import SupplierStatementView from "./SupplierStatementView";

export default async function SupplierStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { slug, id } = await params;
  const { start, end } = await searchParams;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) redirect("/dashboard");

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <SupplierStatementView
        shopId={shop.id}
        shopSlug={slug}
        supplierId={id}
        initialData={null}
        shopName={shop.name}
        shopPhone={shop.phone}
        shopEmail={shop.email}
        shopTaxPin={shop.taxPin}
        initialStart={start}
        initialEnd={end}
      />
    </div>
  );
}
