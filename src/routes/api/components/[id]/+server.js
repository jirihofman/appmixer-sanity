import { json } from '@sveltejs/kit';
import { getComponentById, updateComponentStatus } from '$lib/db/components.js';

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request }) {
  try {
    const { id } = params;
    const { status, githubIssues } = await request.json();

    if (!status || !['pending', 'ok', 'fail'].includes(status)) {
      return json({ error: 'Invalid status' }, { status: 400 });
    }

    const component = await getComponentById(id);
    if (!component) {
      return json({ error: 'Component not found' }, { status: 404 });
    }

    // Validate GitHub issues array if provided
    const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/issues\/\d+$/;
    if (githubIssues && Array.isArray(githubIssues)) {
      for (const issue of githubIssues) {
        if (typeof issue === 'string' && issue.trim() && !githubPattern.test(issue)) {
          return json({ error: `Invalid GitHub issue URL format: ${issue}` }, { status: 400 });
        }
      }
    }

    // Preserve existing issues if not explicitly provided
    let issuesToSave = githubIssues;
    if (issuesToSave === undefined) {
      // Keep existing issues when just changing status
      issuesToSave = component.github_issues ? JSON.parse(component.github_issues) : [];
    }

    await updateComponentStatus(id, status, issuesToSave);

    return json({ success: true });
  } catch (error) {
    console.error('Error updating component:', error);
    return json({ error: 'Failed to update component' }, { status: 500 });
  }
}
