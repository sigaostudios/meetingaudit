import type { Transaction } from "@electric-sql/pglite"

import { getPlanningDb } from "@/lib/db/client"
import { parseMeetingCsvRows } from "@/lib/reporting"
import type {
  BaselineDecision,
  BaselineDecisionType,
  Dataset,
  ReplacementLink,
  Scenario,
  ScenarioAssumption,
  ScenarioAssumptionValueType,
  ScenarioChangeType,
  ScenarioKind,
  ScenarioMeetingRow,
  ScenarioStatus,
} from "@/types/planning"

type DatasetRow = {
  id: number
  name: string
  source_filename: string
  source_checksum: string
  imported_at: Date | string
  created_at: Date | string
}

type ScenarioRow = {
  id: number
  dataset_id: number
  parent_scenario_id: number | null
  name: string
  kind: ScenarioKind
  description: string | null
  status: ScenarioStatus
  sort_order: number
  created_at: Date | string
  updated_at: Date | string
}

type ScenarioMeetingRowRecord = {
  id: number
  scenario_id: number
  source_meeting_id: number | null
  row_order: number
  submission_date: string
  owner_name: string
  meeting_name: string
  time: string
  frequency: string
  duration: string
  primary_purpose: string
  attendees: string
  client_if_applicable: string
  notes: string
  source_excel_row: string
  change_type: ScenarioChangeType
  created_at: Date | string
  updated_at: Date | string
}

type ScenarioAssumptionRow = {
  id: number
  scenario_id: number
  category: string
  key: string
  value_type: ScenarioAssumptionValueType
  value_number: number | null
  value_text: string | null
  value_json: unknown
  unit: string | null
  created_at: Date | string
  updated_at: Date | string
}

type BaselineDecisionRow = {
  id: number
  scenario_id: number
  baseline_meeting_id: number
  decision: BaselineDecisionType
  created_at: Date | string
  updated_at: Date | string
}

type ReplacementLinkRow = {
  id: number
  scenario_id: number
  proposal_meeting_id: number
  baseline_meeting_id: number
  created_at: Date | string
}

type SourceMeetingSeedRow = {
  id: number
  row_order: number
  submission_date: string
  owner_name: string
  meeting_name: string
  time: string
  frequency: string
  duration: string
  primary_purpose: string
  attendees: string
  client_if_applicable: string
  notes: string
  source_excel_row: string
}

export type CreateScenarioBranchInput = {
  parentScenarioId: number
  kind: ScenarioKind
  name: string
  description?: string | null
  status?: ScenarioStatus
}

export type UpsertScenarioMeetingInput = {
  id?: number
  scenarioId: number
  sourceMeetingId?: number | null
  rowOrder: number
  submissionDate: string
  ownerName: string
  meetingName: string
  time: string
  frequency: string
  duration: string
  primaryPurpose: string
  attendees: string
  clientIfApplicable: string
  notes: string
  sourceExcelRow: string
  changeType?: ScenarioChangeType
}

export type UpsertScenarioAssumptionInput = {
  scenarioId: number
  category: string
  key: string
  valueType: ScenarioAssumptionValueType
  valueNumber?: number | null
  valueText?: string | null
  valueJson?: unknown
  unit?: string | null
}

export type CreateProposalScenarioInput = {
  datasetId: number
  name: string
  kind?: Extract<ScenarioKind, "to_be" | "option">
  description?: string | null
}

const DEFAULT_COST_ASSUMPTION = {
  category: "cost",
  key: "per_person_hour_usd",
  valueType: "number" as const,
  valueNumber: 100,
  unit: "usd/hour",
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapDataset(row: DatasetRow): Dataset {
  return {
    id: Number(row.id),
    name: row.name,
    sourceFilename: row.source_filename,
    sourceChecksum: row.source_checksum,
    importedAt: toIsoString(row.imported_at),
    createdAt: toIsoString(row.created_at),
  }
}

function mapScenario(row: ScenarioRow): Scenario {
  return {
    id: Number(row.id),
    datasetId: Number(row.dataset_id),
    parentScenarioId: row.parent_scenario_id === null ? null : Number(row.parent_scenario_id),
    name: row.name,
    kind: row.kind,
    description: row.description,
    status: row.status,
    sortOrder: Number(row.sort_order),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapScenarioMeeting(row: ScenarioMeetingRowRecord): ScenarioMeetingRow {
  return {
    id: Number(row.id),
    scenarioId: Number(row.scenario_id),
    sourceMeetingId: row.source_meeting_id === null ? null : Number(row.source_meeting_id),
    rowOrder: Number(row.row_order),
    submission_date: row.submission_date,
    owner_name: row.owner_name,
    meeting_name: row.meeting_name,
    time: row.time,
    frequency: row.frequency,
    duration: row.duration,
    primary_purpose: row.primary_purpose,
    attendees: row.attendees,
    client_if_applicable: row.client_if_applicable,
    notes: row.notes,
    source_excel_row: row.source_excel_row,
    changeType: row.change_type,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapScenarioAssumption(row: ScenarioAssumptionRow): ScenarioAssumption {
  return {
    id: Number(row.id),
    scenarioId: Number(row.scenario_id),
    category: row.category,
    key: row.key,
    valueType: row.value_type,
    valueNumber: row.value_number === null ? null : Number(row.value_number),
    valueText: row.value_text,
    valueJson: row.value_json,
    unit: row.unit,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapBaselineDecision(row: BaselineDecisionRow): BaselineDecision {
  return {
    id: Number(row.id),
    scenarioId: Number(row.scenario_id),
    baselineMeetingId: Number(row.baseline_meeting_id),
    decision: row.decision,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapReplacementLink(row: ReplacementLinkRow): ReplacementLink {
  return {
    id: Number(row.id),
    scenarioId: Number(row.scenario_id),
    proposalMeetingId: Number(row.proposal_meeting_id),
    baselineMeetingId: Number(row.baseline_meeting_id),
    createdAt: toIsoString(row.created_at),
  }
}

async function querySourceMeetings(tx: Transaction, datasetId: number) {
  const sourceMeetings = await tx.query<SourceMeetingSeedRow>(
    `
      SELECT
        id,
        row_order,
        submission_date,
        owner_name,
        meeting_name,
        time,
        frequency,
        duration,
        primary_purpose,
        attendees,
        client_if_applicable,
        notes,
        source_excel_row
      FROM source_meetings
      WHERE dataset_id = $1
      ORDER BY row_order ASC, id ASC
    `,
    [datasetId]
  )

  return sourceMeetings.rows
}

async function seedDefaultBaselineScenario(
  tx: Transaction,
  datasetId: number,
  name = "As-is"
) {
  const scenarioResult = await tx.query<ScenarioRow>(
    `
      INSERT INTO scenarios (
        dataset_id,
        parent_scenario_id,
        name,
        kind,
        description,
        status,
        sort_order
      )
      VALUES ($1, NULL, $2, 'baseline', $3, 'active', 0)
      RETURNING *
    `,
    [datasetId, name, "Baseline imported from the source meeting audit."]
  )

  const scenario = scenarioResult.rows[0]
  if (!scenario) {
    throw new Error("Unable to create baseline scenario.")
  }

  const sourceMeetings = await querySourceMeetings(tx, datasetId)

  for (const meeting of sourceMeetings) {
    await tx.query(
      `
        INSERT INTO scenario_meetings (
          scenario_id,
          source_meeting_id,
          row_order,
          submission_date,
          owner_name,
          meeting_name,
          time,
          frequency,
          duration,
          primary_purpose,
          attendees,
          client_if_applicable,
          notes,
          source_excel_row,
          change_type
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'seed'
        )
      `,
      [
        scenario.id,
        meeting.id,
        meeting.row_order,
        meeting.submission_date,
        meeting.owner_name,
        meeting.meeting_name,
        meeting.time,
        meeting.frequency,
        meeting.duration,
        meeting.primary_purpose,
        meeting.attendees,
        meeting.client_if_applicable,
        meeting.notes,
        meeting.source_excel_row,
      ]
    )
  }

  await tx.query(
    `
      INSERT INTO scenario_assumptions (
        scenario_id,
        category,
        "key",
        value_type,
        value_number,
        unit
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (scenario_id, category, "key")
      DO NOTHING
    `,
    [
      scenario.id,
      DEFAULT_COST_ASSUMPTION.category,
      DEFAULT_COST_ASSUMPTION.key,
      DEFAULT_COST_ASSUMPTION.valueType,
      DEFAULT_COST_ASSUMPTION.valueNumber,
        DEFAULT_COST_ASSUMPTION.unit,
    ]
  )

  return mapScenario(scenario)
}

export async function restoreBaselineScenarioFromSource(
  scenarioId: number
): Promise<void> {
  const db = await getPlanningDb()

  await db.transaction(async (tx) => {
    const scenarioResult = await tx.query<ScenarioRow>(
      "SELECT * FROM scenarios WHERE id = $1 LIMIT 1",
      [scenarioId]
    )
    const scenario = scenarioResult.rows[0]

    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} does not exist.`)
    }

    if (scenario.kind !== "baseline") {
      throw new Error("Only the As-is scenario can be restored from the CSV source.")
    }

    const [sourceMeetings, existingMeetingsResult] = await Promise.all([
      querySourceMeetings(tx, Number(scenario.dataset_id)),
      tx.query<ScenarioMeetingRowRecord>(
        `
          SELECT *
          FROM scenario_meetings
          WHERE scenario_id = $1
          ORDER BY row_order ASC, id ASC
        `,
        [scenarioId]
      ),
    ])

    const existingMeetings = existingMeetingsResult.rows
    const existingBySourceId = new Map<number, ScenarioMeetingRowRecord[]>()

    for (const meeting of existingMeetings) {
      if (meeting.source_meeting_id === null) {
        continue
      }

      const sourceId = Number(meeting.source_meeting_id)
      const current = existingBySourceId.get(sourceId) ?? []
      current.push(meeting)
      existingBySourceId.set(sourceId, current)
    }

    const deleteMeetingIds = new Set<number>()
    const retainedSourceIds = new Set<number>()

    for (const sourceMeeting of sourceMeetings) {
      retainedSourceIds.add(Number(sourceMeeting.id))
      const matchingMeetings = existingBySourceId.get(Number(sourceMeeting.id)) ?? []
      const currentMeeting = matchingMeetings.shift()

      if (matchingMeetings.length > 0) {
        for (const duplicateMeeting of matchingMeetings) {
          deleteMeetingIds.add(Number(duplicateMeeting.id))
        }
        existingBySourceId.set(Number(sourceMeeting.id), [])
      }

      if (currentMeeting) {
        await tx.query(
          `
            UPDATE scenario_meetings
            SET
              row_order = $2,
              submission_date = $3,
              owner_name = $4,
              meeting_name = $5,
              time = $6,
              frequency = $7,
              duration = $8,
              primary_purpose = $9,
              attendees = $10,
              client_if_applicable = $11,
              notes = $12,
              source_excel_row = $13,
              change_type = 'seed',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `,
          [
            currentMeeting.id,
            sourceMeeting.row_order,
            sourceMeeting.submission_date,
            sourceMeeting.owner_name,
            sourceMeeting.meeting_name,
            sourceMeeting.time,
            sourceMeeting.frequency,
            sourceMeeting.duration,
            sourceMeeting.primary_purpose,
            sourceMeeting.attendees,
            sourceMeeting.client_if_applicable,
            sourceMeeting.notes,
            sourceMeeting.source_excel_row,
          ]
        )
        continue
      }

      await tx.query(
        `
          INSERT INTO scenario_meetings (
            scenario_id,
            source_meeting_id,
            row_order,
            submission_date,
            owner_name,
            meeting_name,
            time,
            frequency,
            duration,
            primary_purpose,
            attendees,
            client_if_applicable,
            notes,
            source_excel_row,
            change_type
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'seed'
          )
        `,
        [
          scenarioId,
          sourceMeeting.id,
          sourceMeeting.row_order,
          sourceMeeting.submission_date,
          sourceMeeting.owner_name,
          sourceMeeting.meeting_name,
          sourceMeeting.time,
          sourceMeeting.frequency,
          sourceMeeting.duration,
          sourceMeeting.primary_purpose,
          sourceMeeting.attendees,
          sourceMeeting.client_if_applicable,
          sourceMeeting.notes,
          sourceMeeting.source_excel_row,
        ]
      )
    }

    for (const meeting of existingMeetings) {
      const sourceMeetingId =
        meeting.source_meeting_id === null ? null : Number(meeting.source_meeting_id)

      if (sourceMeetingId === null || !retainedSourceIds.has(sourceMeetingId)) {
        deleteMeetingIds.add(Number(meeting.id))
      }
    }

    for (const meetingId of deleteMeetingIds) {
      await tx.query("DELETE FROM scenario_meetings WHERE id = $1", [meetingId])
    }

    await tx.query(
      `
        UPDATE scenarios
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [scenarioId]
    )
  })
}

async function ensureDefaultScenarioData(tx: Transaction, datasetId: number) {
  const scenarioCountResult = await tx.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM scenarios WHERE dataset_id = $1",
    [datasetId]
  )
  const scenarioCount = Number(scenarioCountResult.rows[0]?.count ?? 0)

  if (scenarioCount === 0) {
    await seedDefaultBaselineScenario(tx, datasetId)
  }
}

export async function ensureSeedDataset(
  seedCsv: string,
  checksum: string
): Promise<Dataset> {
  const db = await getPlanningDb()
  const existingDatasetResult = await db.query<DatasetRow>(
    "SELECT * FROM datasets WHERE source_checksum = $1 LIMIT 1",
    [checksum]
  )

  const existingDataset = existingDatasetResult.rows[0]
  if (existingDataset) {
    await db.transaction(async (tx) => {
      await ensureDefaultScenarioData(tx, Number(existingDataset.id))
    })
    return mapDataset(existingDataset)
  }

  const seedRows = parseMeetingCsvRows(seedCsv)

  return db.transaction(async (tx) => {
    const datasetResult = await tx.query<DatasetRow>(
      `
        INSERT INTO datasets (
          name,
          source_filename,
          source_checksum,
          imported_at
        )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      ["Recurring meeting audit seed", "meeting-audit.csv", checksum]
    )

    const dataset = datasetResult.rows[0]
    if (!dataset) {
      throw new Error("Unable to create the seed dataset.")
    }

    for (const [index, row] of seedRows.entries()) {
      await tx.query(
        `
          INSERT INTO source_meetings (
            dataset_id,
            row_order,
            submission_date,
            owner_name,
            meeting_name,
            time,
            frequency,
            duration,
            primary_purpose,
            attendees,
            client_if_applicable,
            notes,
            source_excel_row
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
        `,
        [
          dataset.id,
          index + 1,
          row.submission_date,
          row.owner_name,
          row.meeting_name,
          row.time,
          row.frequency,
          row.duration,
          row.primary_purpose,
          row.attendees,
          row.client_if_applicable,
          row.notes,
          row.source_excel_row,
        ]
      )
    }

    await seedDefaultBaselineScenario(tx, Number(dataset.id))

    return mapDataset(dataset)
  })
}

export async function listScenarios(datasetId: number): Promise<Scenario[]> {
  const db = await getPlanningDb()
  const result = await db.query<ScenarioRow>(
    `
      SELECT *
      FROM scenarios
      WHERE dataset_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [datasetId]
  )

  return result.rows.map(mapScenario)
}

export async function getScenarioById(scenarioId: number): Promise<Scenario | null> {
  const db = await getPlanningDb()
  const result = await db.query<ScenarioRow>(
    "SELECT * FROM scenarios WHERE id = $1 LIMIT 1",
    [scenarioId]
  )

  return result.rows[0] ? mapScenario(result.rows[0]) : null
}

export async function getBaselineScenario(datasetId: number): Promise<Scenario> {
  const db = await getPlanningDb()
  const result = await db.query<ScenarioRow>(
    `
      SELECT *
      FROM scenarios
      WHERE dataset_id = $1 AND kind = 'baseline'
      ORDER BY sort_order ASC, id ASC
      LIMIT 1
    `,
    [datasetId]
  )

  const row = result.rows[0]
  if (!row) {
    throw new Error(`No baseline scenario found for dataset ${datasetId}.`)
  }

  return mapScenario(row)
}

export async function listProposalScenarios(datasetId: number): Promise<Scenario[]> {
  const db = await getPlanningDb()
  const result = await db.query<ScenarioRow>(
    `
      SELECT *
      FROM scenarios
      WHERE dataset_id = $1 AND kind IN ('to_be', 'option')
      ORDER BY sort_order ASC, id ASC
    `,
    [datasetId]
  )

  return result.rows.map(mapScenario)
}

export async function getScenarioMeetings(scenarioId: number): Promise<ScenarioMeetingRow[]> {
  const db = await getPlanningDb()
  const result = await db.query<ScenarioMeetingRowRecord>(
    `
      SELECT *
      FROM scenario_meetings
      WHERE scenario_id = $1
      ORDER BY row_order ASC, id ASC
    `,
    [scenarioId]
  )

  return result.rows.map(mapScenarioMeeting)
}

export async function getScenarioAssumptions(
  scenarioId: number
): Promise<ScenarioAssumption[]> {
  const db = await getPlanningDb()
  const result = await db.query<ScenarioAssumptionRow>(
    `
      SELECT
        id,
        scenario_id,
        category,
        "key" AS key,
        value_type,
        value_number,
        value_text,
        value_json,
        unit,
        created_at,
        updated_at
      FROM scenario_assumptions
      WHERE scenario_id = $1
      ORDER BY category ASC, "key" ASC
    `,
    [scenarioId]
  )

  return result.rows.map(mapScenarioAssumption)
}

export async function getBaselineDecisions(
  scenarioId: number
): Promise<BaselineDecision[]> {
  const db = await getPlanningDb()
  const result = await db.query<BaselineDecisionRow>(
    `
      SELECT *
      FROM scenario_baseline_decisions
      WHERE scenario_id = $1
      ORDER BY baseline_meeting_id ASC
    `,
    [scenarioId]
  )

  return result.rows.map(mapBaselineDecision)
}

export async function setBaselineDecision(
  scenarioId: number,
  baselineMeetingId: number,
  decision: BaselineDecisionType
): Promise<BaselineDecision> {
  const db = await getPlanningDb()
  return db.transaction(async (tx) => {
    if (decision !== "change") {
      await tx.query(
        `
          DELETE FROM scenario_replacement_links
          WHERE scenario_id = $1 AND baseline_meeting_id = $2
        `,
        [scenarioId, baselineMeetingId]
      )
    }

    const result = await tx.query<BaselineDecisionRow>(
      `
        INSERT INTO scenario_baseline_decisions (
          scenario_id,
          baseline_meeting_id,
          decision
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (scenario_id, baseline_meeting_id)
        DO UPDATE SET
          decision = EXCLUDED.decision,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `,
      [scenarioId, baselineMeetingId, decision]
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error("Unable to set baseline meeting decision.")
    }

    return mapBaselineDecision(row)
  })
}

export async function getReplacementLinks(
  scenarioId: number
): Promise<ReplacementLink[]> {
  const db = await getPlanningDb()
  const result = await db.query<ReplacementLinkRow>(
    `
      SELECT *
      FROM scenario_replacement_links
      WHERE scenario_id = $1
      ORDER BY proposal_meeting_id ASC, baseline_meeting_id ASC
    `,
    [scenarioId]
  )

  return result.rows.map(mapReplacementLink)
}

export async function setProposalMeetingReplacementLinks(
  scenarioId: number,
  proposalMeetingId: number,
  baselineMeetingIds: number[]
): Promise<ReplacementLink[]> {
  const db = await getPlanningDb()
  const uniqueBaselineIds = [...new Set(baselineMeetingIds)]

  return db.transaction(async (tx) => {
    await tx.query(
      `
        DELETE FROM scenario_replacement_links
        WHERE scenario_id = $1 AND proposal_meeting_id = $2
      `,
      [scenarioId, proposalMeetingId]
    )

    for (const baselineMeetingId of uniqueBaselineIds) {
      await tx.query(
        `
          INSERT INTO scenario_replacement_links (
            scenario_id,
            proposal_meeting_id,
            baseline_meeting_id
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (scenario_id, proposal_meeting_id, baseline_meeting_id)
          DO NOTHING
        `,
        [scenarioId, proposalMeetingId, baselineMeetingId]
      )

      await tx.query(
        `
          INSERT INTO scenario_baseline_decisions (
            scenario_id,
            baseline_meeting_id,
            decision
          )
          VALUES ($1, $2, 'change')
          ON CONFLICT (scenario_id, baseline_meeting_id)
          DO UPDATE SET
            decision = 'change',
            updated_at = CURRENT_TIMESTAMP
        `,
        [scenarioId, baselineMeetingId]
      )
    }

    const links = await tx.query<ReplacementLinkRow>(
      `
        SELECT *
        FROM scenario_replacement_links
        WHERE scenario_id = $1 AND proposal_meeting_id = $2
        ORDER BY baseline_meeting_id ASC
      `,
      [scenarioId, proposalMeetingId]
    )

    return links.rows.map(mapReplacementLink)
  })
}

export async function removeScenarioMeeting(meetingId: number): Promise<void> {
  const db = await getPlanningDb()
  await db.query("DELETE FROM scenario_meetings WHERE id = $1", [meetingId])
}

export async function getEffectiveScenarioMeetings(
  scenarioId: number
): Promise<ScenarioMeetingRow[]> {
  const scenario = await getScenarioById(scenarioId)
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} does not exist.`)
  }

  if (scenario.kind === "baseline") {
    return getScenarioMeetings(scenario.id)
  }

  const baselineScenario = await getBaselineScenario(scenario.datasetId)
  const [baselineMeetings, proposalMeetings, decisions, links] = await Promise.all([
    getScenarioMeetings(baselineScenario.id),
    getScenarioMeetings(scenario.id),
    getBaselineDecisions(scenario.id),
    getReplacementLinks(scenario.id),
  ])

  const decisionByMeetingId = new Map(
    decisions.map((decision) => [decision.baselineMeetingId, decision.decision])
  )
  const linksByBaselineId = new Map<number, ReplacementLink[]>()
  const linksByProposalId = new Map<number, ReplacementLink[]>()

  for (const link of links) {
    const baselineLinks = linksByBaselineId.get(link.baselineMeetingId) ?? []
    baselineLinks.push(link)
    linksByBaselineId.set(link.baselineMeetingId, baselineLinks)

    const proposalLinks = linksByProposalId.get(link.proposalMeetingId) ?? []
    proposalLinks.push(link)
    linksByProposalId.set(link.proposalMeetingId, proposalLinks)
  }

  const keepBaselineMeetings = baselineMeetings.filter((meeting) => {
    const decision = decisionByMeetingId.get(meeting.id) ?? "continue"
    if (decision === "cancel" || decision === "change") {
      return false
    }

    return (linksByBaselineId.get(meeting.id)?.length ?? 0) === 0
  })

  const includeProposalMeetings = proposalMeetings.filter((meeting) => {
    if (meeting.changeType === "removed") {
      return false
    }

    const linkedBaselineCount = linksByProposalId.get(meeting.id)?.length ?? 0

    if (linkedBaselineCount > 0) {
      return true
    }

    // Net-new proposal meetings should stay visible without links.
    if (meeting.sourceMeetingId === null) {
      return true
    }

    // Backwards compatibility for previously cloned proposal rows.
    return meeting.changeType === "added" || meeting.changeType === "updated"
  })

  const combined = [...keepBaselineMeetings, ...includeProposalMeetings]
  return combined.sort((left, right) => left.rowOrder - right.rowOrder || left.id - right.id)
}

export async function createScenarioBranch(
  input: CreateScenarioBranchInput
): Promise<Scenario> {
  const db = await getPlanningDb()

  return db.transaction(async (tx) => {
    const parentResult = await tx.query<ScenarioRow>(
      "SELECT * FROM scenarios WHERE id = $1 LIMIT 1",
      [input.parentScenarioId]
    )
    const parent = parentResult.rows[0]

    if (!parent) {
      throw new Error(`Scenario ${input.parentScenarioId} does not exist.`)
    }

    const sortOrderResult = await tx.query<{ next_sort_order: number }>(
      `
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
        FROM scenarios
        WHERE dataset_id = $1
      `,
      [parent.dataset_id]
    )
    const nextSortOrder = Number(sortOrderResult.rows[0]?.next_sort_order ?? 0)

    const scenarioResult = await tx.query<ScenarioRow>(
      `
        INSERT INTO scenarios (
          dataset_id,
          parent_scenario_id,
          name,
          kind,
          description,
          status,
          sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        parent.dataset_id,
        parent.id,
        input.name,
        input.kind,
        input.description ?? null,
        input.status ?? "draft",
        nextSortOrder,
      ]
    )
    const scenario = scenarioResult.rows[0]

    if (!scenario) {
      throw new Error("Unable to create the scenario branch.")
    }

    await tx.query(
      `
        INSERT INTO scenario_meetings (
          scenario_id,
          source_meeting_id,
          row_order,
          submission_date,
          owner_name,
          meeting_name,
          time,
          frequency,
          duration,
          primary_purpose,
          attendees,
          client_if_applicable,
          notes,
          source_excel_row,
          change_type
        )
        SELECT
          $1,
          source_meeting_id,
          row_order,
          submission_date,
          owner_name,
          meeting_name,
          time,
          frequency,
          duration,
          primary_purpose,
          attendees,
          client_if_applicable,
          notes,
          source_excel_row,
          change_type
        FROM scenario_meetings
        WHERE scenario_id = $2
      `,
      [scenario.id, parent.id]
    )

    await tx.query(
      `
        INSERT INTO scenario_assumptions (
          scenario_id,
          category,
          "key",
          value_type,
          value_number,
          value_text,
          value_json,
          unit
        )
        SELECT
          $1,
          category,
          "key",
          value_type,
          value_number,
          value_text,
          value_json,
          unit
        FROM scenario_assumptions
        WHERE scenario_id = $2
      `,
      [scenario.id, parent.id]
    )

    return mapScenario(scenario)
  })
}

export async function createProposalScenario(
  input: CreateProposalScenarioInput
): Promise<Scenario> {
  const db = await getPlanningDb()

  return db.transaction(async (tx) => {
    const baselineResult = await tx.query<ScenarioRow>(
      `
        SELECT *
        FROM scenarios
        WHERE dataset_id = $1 AND kind = 'baseline'
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      `,
      [input.datasetId]
    )
    const baseline = baselineResult.rows[0]

    if (!baseline) {
      throw new Error(`No baseline scenario found for dataset ${input.datasetId}.`)
    }

    const sortOrderResult = await tx.query<{ next_sort_order: number }>(
      `
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
        FROM scenarios
        WHERE dataset_id = $1
      `,
      [input.datasetId]
    )
    const nextSortOrder = Number(sortOrderResult.rows[0]?.next_sort_order ?? 0)

    const scenarioResult = await tx.query<ScenarioRow>(
      `
        INSERT INTO scenarios (
          dataset_id,
          parent_scenario_id,
          name,
          kind,
          description,
          status,
          sort_order
        )
        VALUES ($1, $2, $3, $4, $5, 'draft', $6)
        RETURNING *
      `,
      [
        input.datasetId,
        baseline.id,
        input.name,
        input.kind ?? "option",
        input.description ?? null,
        nextSortOrder,
      ]
    )

    const row = scenarioResult.rows[0]
    if (!row) {
      throw new Error("Unable to create proposal scenario.")
    }

    await tx.query(
      `
        INSERT INTO scenario_assumptions (
          scenario_id,
          category,
          "key",
          value_type,
          value_number,
          value_text,
          value_json,
          unit
        )
        SELECT
          $1,
          category,
          "key",
          value_type,
          value_number,
          value_text,
          value_json,
          unit
        FROM scenario_assumptions
        WHERE scenario_id = $2
      `,
      [row.id, baseline.id]
    )

    return mapScenario(row)
  })
}

export async function upsertScenarioMeeting(
  input: UpsertScenarioMeetingInput
): Promise<ScenarioMeetingRow> {
  const db = await getPlanningDb()

  if (input.id) {
    const result = await db.query<ScenarioMeetingRowRecord>(
      `
        UPDATE scenario_meetings
        SET
          source_meeting_id = $2,
          row_order = $3,
          submission_date = $4,
          owner_name = $5,
          meeting_name = $6,
          time = $7,
          frequency = $8,
          duration = $9,
          primary_purpose = $10,
          attendees = $11,
          client_if_applicable = $12,
          notes = $13,
          source_excel_row = $14,
          change_type = $15,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [
        input.id,
        input.sourceMeetingId ?? null,
        input.rowOrder,
        input.submissionDate,
        input.ownerName,
        input.meetingName,
        input.time,
        input.frequency,
        input.duration,
        input.primaryPurpose,
        input.attendees,
        input.clientIfApplicable,
        input.notes,
        input.sourceExcelRow,
        input.changeType ?? (input.sourceMeetingId ? "updated" : "added"),
      ]
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error(`Scenario meeting ${input.id} does not exist.`)
    }

    return mapScenarioMeeting(row)
  }

  const result = await db.query<ScenarioMeetingRowRecord>(
    `
      INSERT INTO scenario_meetings (
        scenario_id,
        source_meeting_id,
        row_order,
        submission_date,
        owner_name,
        meeting_name,
        time,
        frequency,
        duration,
        primary_purpose,
        attendees,
        client_if_applicable,
        notes,
        source_excel_row,
        change_type
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING *
    `,
    [
      input.scenarioId,
      input.sourceMeetingId ?? null,
      input.rowOrder,
      input.submissionDate,
      input.ownerName,
      input.meetingName,
      input.time,
      input.frequency,
      input.duration,
      input.primaryPurpose,
      input.attendees,
      input.clientIfApplicable,
      input.notes,
      input.sourceExcelRow,
      input.changeType ?? (input.sourceMeetingId ? "updated" : "added"),
    ]
  )

  const row = result.rows[0]
  if (!row) {
    throw new Error("Unable to insert scenario meeting.")
  }

  return mapScenarioMeeting(row)
}

export async function upsertScenarioAssumption(
  input: UpsertScenarioAssumptionInput
): Promise<ScenarioAssumption> {
  const db = await getPlanningDb()
  const result = await db.query<ScenarioAssumptionRow>(
    `
      INSERT INTO scenario_assumptions (
        scenario_id,
        category,
        "key",
        value_type,
        value_number,
        value_text,
        value_json,
        unit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      ON CONFLICT (scenario_id, category, "key")
      DO UPDATE SET
        value_type = EXCLUDED.value_type,
        value_number = EXCLUDED.value_number,
        value_text = EXCLUDED.value_text,
        value_json = EXCLUDED.value_json,
        unit = EXCLUDED.unit,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        id,
        scenario_id,
        category,
        "key" AS key,
        value_type,
        value_number,
        value_text,
        value_json,
        unit,
        created_at,
        updated_at
    `,
    [
      input.scenarioId,
      input.category,
      input.key,
      input.valueType,
      input.valueNumber ?? null,
      input.valueText ?? null,
      input.valueJson === undefined ? null : JSON.stringify(input.valueJson),
      input.unit ?? null,
    ]
  )

  const row = result.rows[0]
  if (!row) {
    throw new Error("Unable to upsert scenario assumption.")
  }

  return mapScenarioAssumption(row)
}
