import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { pgTable, text, numeric, date, timestamp, serial } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const wallets = pgTable("wallets", {
  id: text("id").primaryKey(),
  solar: numeric("solar", { precision: 20, scale: 2 }).notNull().default("0"),
  rays: numeric("rays", { precision: 20, scale: 2 }).notNull().default("0"),
  lastMintDate: date("last_mint_date"),
  createdAt: timestamp("created_at").notNull(),
});

const computeLedger = pgTable("compute_ledger", {
  id: serial("id").primaryKey(),
  walletId: text("wallet_id").notNull(),
  taskType: text("task_type").notNull(),
  raysSpent: numeric("rays_spent", { precision: 20, scale: 2 }).notNull(),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { walletId, taskType, estimatedRays } = body;

  if (!walletId || !taskType || !estimatedRays) {
    return new Response(JSON.stringify({ error: "walletId, taskType, estimatedRays required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.DATABASE_URL) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));

    if (!wallet) {
      return new Response(JSON.stringify({ error: "wallet not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentRays = parseFloat(wallet.rays || "0");
    const entry: any = {
      walletId,
      taskType,
      raysSpent: estimatedRays.toString(),
      status: "pending",
      timestamp: new Date(),
    };

    if (currentRays < estimatedRays) {
      entry.status = "rejected_insufficient_rays";
      const [savedEntry] = await db.insert(computeLedger).values(entry).returning();
      return new Response(JSON.stringify({ error: "insufficient rays", entry: savedEntry }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newRays = currentRays - estimatedRays;
    await db.update(wallets).set({ rays: newRays.toString() }).where(eq(wallets.id, walletId));

    entry.status = "accepted";
    const [savedEntry] = await db.insert(computeLedger).values(entry).returning();

    return new Response(JSON.stringify({ success: true, entry: savedEntry, newRaysBalance: newRays.toString() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await pool.end();
  }
}