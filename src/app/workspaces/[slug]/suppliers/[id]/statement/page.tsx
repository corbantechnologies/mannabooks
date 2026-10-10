import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound, redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";
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

  let supplier: any = null;
  try {
    const res = await apiClient.get<any>(`/v1/suppliers/${id}?shop_id=${shop.id}`);
    supplier = res.data;
  } catch {
    notFound();
  }

  if (!supplier) notFound();

  let statementData: any = null;
  try {
    const paramsQuery = new URLSearchParams({
      shop_id: shop.id,
    });
    if (start) paramsQuery.set("start_date", start);
    if (end) paramsQuery.set("end_date", end);

    const statementRes = await apiClient.get<any>(
      `/v1/suppliers/${id}/statement?${paramsQuery.toString()}`
    );
    statementData = statementRes.data?.data || null;
  } catch (e) {
    console.warn("Failed to fetch supplier statement:", e);
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <SupplierStatementView
        shopId={shop.id}
        shopSlug={slug}
        supplierId={supplier.id}
        initialData={statementData}
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
