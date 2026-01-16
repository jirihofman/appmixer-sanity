import db from './index.js';

/**
 * @typedef {Object} TestRun
 * @property {string} id
 * @property {string} name
 * @property {string} created_at
 * @property {'in_progress' | 'completed'} status
 */

/**
 * Get all test runs ordered by creation date (newest first)
 * @returns {TestRun[]}
 */
export function getAllTestRuns() {
  return db.prepare(`
    SELECT
      tr.*,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id) as connector_count,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id AND status = 'ok') as ok_count,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id AND status = 'fail') as fail_count,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id AND status = 'blocked') as blocked_count
    FROM test_runs tr
    ORDER BY tr.created_at DESC
  `).all();
}

/**
 * Get a test run by ID
 * @param {string} id
 * @returns {TestRun | undefined}
 */
export function getTestRunById(id) {
  return db.prepare(`
    SELECT
      tr.*,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id) as connector_count,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id AND status = 'ok') as ok_count,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id AND status = 'fail') as fail_count,
      (SELECT COUNT(*) FROM connectors WHERE test_run_id = tr.id AND status = 'blocked') as blocked_count
    FROM test_runs tr
    WHERE tr.id = ?
  `).get(id);
}

/**
 * Create a new test run
 * @param {{id: string, name: string}} data
 * @returns {Database.RunResult}
 */
export function createTestRun({ id, name }) {
  return db.prepare(`
    INSERT INTO test_runs (id, name) VALUES (?, ?)
  `).run(id, name);
}

/**
 * Update test run status
 * @param {string} id
 * @param {'in_progress' | 'completed'} status
 * @returns {Database.RunResult}
 */
export function updateTestRunStatus(id, status) {
  return db.prepare(`
    UPDATE test_runs SET status = ? WHERE id = ?
  `).run(status, id);
}

/**
 * Delete a test run (cascades to connectors and components)
 * @param {string} id
 * @returns {Database.RunResult}
 */
export function deleteTestRun(id) {
  return db.prepare(`DELETE FROM test_runs WHERE id = ?`).run(id);
}
