import { requireFinanceAuth } from "@/lib/finance/guards";
import { processOdooOutboxBatch } from "@/lib/odoo/outbox";

/**
 * POST /api/finance/odoo/sync
 * Manually trigger outbox batch processing worker.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["finance:odoo", "superadmin", "admin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    let batchSize = 10;
    try {
      const body = await request.json();
      if (body.batchSize) batchSize = Number(body.batchSize);
    } catch (_) {
      // Body is optional
    }

    const result = await processOdooOutboxBatch({ batchSize });

    return Response.json({
      success: true,
      batch: result
    });
  } catch (err) {
    console.error("Odoo Sync POST error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
