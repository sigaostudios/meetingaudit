import { PGlite } from "@electric-sql/pglite"

import { PLANNING_DB_PATH, PLANNING_MIGRATIONS } from "@/lib/db/migrations"

let planningDbPromise: Promise<PGlite> | null = null

async function applyMigrations(db: PGlite) {
  await db.exec(PLANNING_MIGRATIONS[0])

  const appliedVersions = await db.query<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version ASC"
  )
  const appliedVersionSet = new Set(appliedVersions.rows.map((row) => Number(row.version)))

  for (const [index, migration] of PLANNING_MIGRATIONS.entries()) {
    const version = index + 1
    if (appliedVersionSet.has(version)) {
      continue
    }

    await db.transaction(async (tx) => {
      await tx.exec(migration)
      await tx.query(
        "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
        [version, `migration_${version}`]
      )
    })
  }
}

export async function getPlanningDb() {
  if (typeof window === "undefined") {
    throw new Error("Planning database is only available in the browser.")
  }

  if (!planningDbPromise) {
    planningDbPromise = (async () => {
      const db = new PGlite(PLANNING_DB_PATH, {
        relaxedDurability: true,
      })

      await db.waitReady
      await applyMigrations(db)
      return db
    })().catch((error) => {
      planningDbPromise = null
      throw error
    })
  }

  return planningDbPromise
}
