import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, vendors } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { MaterialsClient } from "@/components/materials/materials-client";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const [rows, vendorList] = await Promise.all([
    db
      .select({ material: materials, vendorName: vendors.name })
      .from(materials)
      .leftJoin(vendors, eq(materials.vendorId, vendors.id))
      .orderBy(desc(materials.createdAt)),
    db.select({ id: vendors.id, name: vendors.name }).from(vendors),
  ]);

  const data = rows.map((r) => ({ ...r.material, vendorName: r.vendorName }));

  return (
    <div>
      <PageHeader
        kicker="Delivery"
        title="Materials Library"
        subtitle="A searchable catalogue of finishes, furniture and fittings with live pricing."
      />
      <MaterialsClient materials={data} vendors={vendorList} />
    </div>
  );
}
