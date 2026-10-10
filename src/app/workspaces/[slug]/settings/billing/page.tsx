import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { BillingSettingsClient } from "./BillingSettingsClient";

export const dynamic = "force-dynamic";

interface BillingSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BillingSettingsPage({ params }: BillingSettingsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <BillingSettingsClient shop={shop} />
    </div>
  );
}

