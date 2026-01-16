import db from './index.js';
import { recalculateConnectorStatus } from './connectors.js';

/**
 * @typedef {Object} Component
 * @property {string} id
 * @property {string} connector_id
 * @property {string} component_name
 * @property {string} label
 * @property {string} description
 * @property {string} icon
 * @property {string} version
 * @property {boolean} is_private
 * @property {'pending' | 'ok' | 'fail'} status
 * @property {string | null} github_issue
 * @property {string | null} tested_at
 */

/**
 * Get all components for a connector
 * @param {string} connectorId
 * @returns {Component[]}
 */
export function getComponentsByConnector(connectorId) {
  return db.prepare(`
    SELECT * FROM components
    WHERE connector_id = ?
    ORDER BY component_name
  `).all(connectorId);
}

/**
 * Get a component by ID
 * @param {string} id
 * @returns {Component | undefined}
 */
export function getComponentById(id) {
  return db.prepare(`SELECT * FROM components WHERE id = ?`).get(id);
}

/**
 * Add a component to a connector
 * @param {Object} data
 */
export function addComponentToConnector({
  id,
  connectorId,
  componentName,
  label,
  description,
  icon,
  version,
  isPrivate
}) {
  return db.prepare(`
    INSERT INTO components (id, connector_id, component_name, label, description, icon, version, is_private)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, connectorId, componentName, label, description, icon, version, isPrivate ? 1 : 0);
}

/**
 * Update component status
 * @param {string} id
 * @param {'pending' | 'ok' | 'fail'} status
 * @param {string | null} githubIssue
 */
export function updateComponentStatus(id, status, githubIssue = null) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE components SET status = ?, github_issue = ?, tested_at = ? WHERE id = ?
  `).run(status, githubIssue, now, id);

  // Get the connector ID and recalculate its status
  const component = db.prepare('SELECT connector_id FROM components WHERE id = ?').get(id);
  if (component) {
    recalculateConnectorStatus(component.connector_id);
  }
}

/**
 * Batch insert components (for test run creation)
 * @param {Array} components
 */
export function batchInsertComponents(components) {
  const insert = db.prepare(`
    INSERT INTO components (id, connector_id, component_name, label, description, icon, version, is_private)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const c of items) {
      insert.run(c.id, c.connectorId, c.componentName, c.label, c.description, c.icon, c.version, c.isPrivate ? 1 : 0);
    }
  });

  insertMany(components);
}
