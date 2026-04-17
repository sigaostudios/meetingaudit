export const PLANNING_DB_PATH = "idb://meetingaudit"

export const PLANNING_MIGRATIONS = [
  `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS datasets (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      source_filename TEXT NOT NULL,
      source_checksum TEXT NOT NULL UNIQUE,
      imported_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS source_meetings (
      id BIGSERIAL PRIMARY KEY,
      dataset_id BIGINT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
      row_order INTEGER NOT NULL,
      submission_date TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      meeting_name TEXT NOT NULL,
      time TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      primary_purpose TEXT NOT NULL,
      attendees TEXT NOT NULL,
      client_if_applicable TEXT NOT NULL,
      notes TEXT NOT NULL,
      source_excel_row TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_source_meetings_dataset_id
      ON source_meetings(dataset_id, row_order);

    CREATE TABLE IF NOT EXISTS scenarios (
      id BIGSERIAL PRIMARY KEY,
      dataset_id BIGINT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
      parent_scenario_id BIGINT REFERENCES scenarios(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('baseline', 'to_be', 'option')),
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_scenarios_dataset_id
      ON scenarios(dataset_id, sort_order, id);

    CREATE TABLE IF NOT EXISTS scenario_meetings (
      id BIGSERIAL PRIMARY KEY,
      scenario_id BIGINT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      source_meeting_id BIGINT REFERENCES source_meetings(id) ON DELETE SET NULL,
      row_order INTEGER NOT NULL,
      submission_date TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      meeting_name TEXT NOT NULL,
      time TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      primary_purpose TEXT NOT NULL,
      attendees TEXT NOT NULL,
      client_if_applicable TEXT NOT NULL,
      notes TEXT NOT NULL,
      source_excel_row TEXT NOT NULL,
      change_type TEXT NOT NULL CHECK (change_type IN ('seed', 'added', 'updated', 'removed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_scenario_meetings_scenario_id
      ON scenario_meetings(scenario_id, row_order, id);

    CREATE TABLE IF NOT EXISTS scenario_assumptions (
      id BIGSERIAL PRIMARY KEY,
      scenario_id BIGINT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      "key" TEXT NOT NULL,
      value_type TEXT NOT NULL CHECK (value_type IN ('number', 'text', 'json')),
      value_number DOUBLE PRECISION,
      value_text TEXT,
      value_json JSONB,
      unit TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT scenario_assumptions_unique_key UNIQUE (scenario_id, category, "key")
    );

    CREATE INDEX IF NOT EXISTS idx_scenario_assumptions_scenario_id
      ON scenario_assumptions(scenario_id, category, "key");
  `,
  `
    CREATE TABLE IF NOT EXISTS scenario_baseline_decisions (
      id BIGSERIAL PRIMARY KEY,
      scenario_id BIGINT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      baseline_meeting_id BIGINT NOT NULL REFERENCES scenario_meetings(id) ON DELETE CASCADE,
      decision TEXT NOT NULL CHECK (decision IN ('continue', 'cancel', 'change')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT scenario_baseline_decisions_unique UNIQUE (scenario_id, baseline_meeting_id)
    );

    CREATE INDEX IF NOT EXISTS idx_scenario_baseline_decisions_scenario_id
      ON scenario_baseline_decisions(scenario_id, baseline_meeting_id);

    CREATE TABLE IF NOT EXISTS scenario_replacement_links (
      id BIGSERIAL PRIMARY KEY,
      scenario_id BIGINT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      proposal_meeting_id BIGINT NOT NULL REFERENCES scenario_meetings(id) ON DELETE CASCADE,
      baseline_meeting_id BIGINT NOT NULL REFERENCES scenario_meetings(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT scenario_replacement_links_unique UNIQUE (
        scenario_id,
        proposal_meeting_id,
        baseline_meeting_id
      )
    );

    CREATE INDEX IF NOT EXISTS idx_scenario_replacement_links_scenario_id
      ON scenario_replacement_links(scenario_id, proposal_meeting_id, baseline_meeting_id);
  `,
] as const
