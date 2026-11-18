import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { vendors, purchaseOrders } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { VendorsClient } from "@/components/vendors/vendors-client";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const [rows, orderStats] = await Promise.all([
    db.select().from(vendors).orderBy(desc(vendors.rating)),
    db
      .select({
        vendorId: purchaseOrders.vendorId,
        count: sql<number>`count(*)`,
        spend: sql<number>`coalesce(sum(${purchaseOrders.amount}),0)`,
      })
      .from(purchaseOrders)
      .groupBy(purchaseOrders.vendorId),
  ]);

  const statMap = new Map(orderStats.map((s) => [s.vendorId, s]));
  const data = rows.map((v) => {
    const s = statMap.get(v.id);
    return { ...v, orderCount: Number(s?.count ?? 0), totalSpend: Number(s?.spend ?? 0) };
  });

  return (
    <div>
      <PageHeader
        kicker="Delivery"
        title="Vendors"
        subtitle="Your supplier network with ratings, categories and order history."
      />
      <VendorsClient vendors={data} />
    </div>
  );
}
