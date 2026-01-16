import db from './index.js';

/**
 * @typedef {Object} Connector
 * @property {string} id
 * @property {string} test_run_id
 * @property {string} connector_name
 * @property {string} version
 * @property {string} label
 * @property {string} description
 * @property {string} icon
 * @property {'pending' | 'ok' | 'fail' | 'blocked'} status
 * @property {string | null} blocked_reason
 * @property {string} created_at
 */

/**
 * Get all connectors for a test run
 * @param {string} testRunId
 * @returns {Connector[]}
 */
export function getConnectorsByTestRun(testRunId) {
  return db.prepare(`
    SELECT
      c.*,
      (SELECT COUNT(*) FROM components WHERE connector_id = c.id) as component_count,
      (SELECT COUNT(*) FROM components WHERE connector_id = c.id AND status = 'ok') as ok_count,
      (SELECT COUNT(*) FROM components WHERE connector_id = c.id AND status = 'fail') as fail_count
    FROM connectors c
    WHERE c.test_run_id = ?
    ORDER BY c.connector_name
  `).all(testRunId);
}

/**
 * Get a connector by ID
 * @param {string} id
 * @returns {Connector | undefined}
 */
export function getConnectorById(id) {
  return db.prepare(`
    SELECT
      c.*,
      (SELECT COUNT(*) FROM components WHERE connector_id = c.id) as component_count,
      (SELECT COUNT(*) FROM components WHERE connector_id = c.id AND status = 'ok') as ok_count,
      (SELECT COUNT(*) FROM components WHERE connector_id = c.id AND status = 'fail') as fail_count
    FROM connectors c
    WHERE c.id = ?
  `).get(id);
}

/**
 * Add a connector to a test run
 * @param {Object} data
 */
export function addConnectorToRun({
  id,
  testRunId,
  connectorName,
  version,
  label,
  description,
  icon
}) {
  return db.prepare(`
    INSERT INTO connectors (id, test_run_id, connector_name, version, label, description, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, testRunId, connectorName, version, label, description, icon);
}

/**
 * Update connector status
 * @param {string} id
 * @param {'pending' | 'ok' | 'fail' | 'blocked'} status
 * @param {string | null} blockedReason
 */
export function updateConnectorStatus(id, status, blockedReason = null) {
  return db.prepare(`
    UPDATE connectors SET status = ?, blocked_reason = ? WHERE id = ?
  `).run(status, blockedReason, id);
}

/**
 * Recalculate connector status based on component statuses
 * @param {string} connectorId
 * @returns {'pending' | 'ok' | 'fail'}
 */
export function recalculateConnectorStatus(connectorId) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok_count,
      SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as fail_count
    FROM components
    WHERE connector_id = ?
  `).get(connectorId);

  let newStatus = 'pending';
  if (stats.fail_count > 0) {
    newStatus = 'fail';
  } else if (stats.ok_count === stats.total && stats.total > 0) {
    newStatus = 'ok';
  }

  // Only update if not blocked (blocked is manual)
  const connector = db.prepare('SELECT status FROM connectors WHERE id = ?').get(connectorId);
  if (connector && connector.status !== 'blocked') {
    db.prepare('UPDATE connectors SET status = ? WHERE id = ?').run(newStatus, connectorId);
  }

  return newStatus;
}
