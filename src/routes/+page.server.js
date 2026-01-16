import { getAllTestRuns } from '$lib/db/test-runs.js';

/** @type {import('./$types').PageServerLoad} */
export function load() {
  const testRuns = getAllTestRuns();

  return {
    testRuns
  };
}
