import { getDatabase } from "@/lib/db-config";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { odooClient } from "@/lib/odoo/client";
import { getOdooOutboxStats, replayOdooOutboxEvent } from "@/lib/odoo/outbox";

/**
 * GET /api/finance/odoo
 * Returns Odoo ERP connector status, outbox metrics, and recent sync failures.
 */
export async function GET() {
  try {
    const auth = await requireFinanceAuth(["finance:odoo", "superadmin", "admin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const connectionStatus = await odooClient.getStatus();
    const outboxStats = await getOdooOutboxStats();

    const db = await getDatabase();
    const recentFailures = await db.collection("odoo_outbox")
      .find({ status: { $in: ["failed", "dead_letter"] } })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    return Response.json({
      success: true,
      connector: connectionStatus,
      outbox: outboxStats,
      recentFailures: recentFailures.map(f => ({
        eventId: f.eventId,
        eventType: f.eventType,
        entityType: f.entityType,
        referenceId: f.referenceId,
        status: f.status,
        attempts: f.attempts,
        lastError: f.lastError,
        updatedAt: f.updatedAt
      }))
    });
  } catch (err) {
    console.error("Odoo Connector GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/finance/odoo
 * Replays a specific failed or dead-letter outbox event.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["finance:odoo", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return Response.json({ error: "eventId is required for replay" }, { status: 400 });
    }

    const replayed = await replayOdooOutboxEvent(eventId);
    if (!replayed) {
      return Response.json({ error: "Event not found or could not be replayed" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Event ${eventId} reset to pending for retry`
    });
  } catch (err) {
    console.error("Odoo Connector POST error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
