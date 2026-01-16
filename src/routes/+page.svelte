<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
  import TestRunCard from '$lib/components/test-runs/TestRunCard.svelte';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();

  let showCreateDialog = $state(false);
  let newRunName = $state('');
  let isCreating = $state(false);
  let createError = $state('');

  async function createTestRun() {
    if (!newRunName.trim()) {
      createError = 'Please enter a name for the test run';
      return;
    }

    isCreating = true;
    createError = '';

    try {
      const response = await fetch('/api/test-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRunName.trim() })
      });

      if (response.ok) {
        showCreateDialog = false;
        newRunName = '';
        await invalidateAll();
      } else {
        const error = await response.json();
        createError = error.error || 'Failed to create test run';
      }
    } catch (error) {
      console.error('Error creating test run:', error);
      createError = 'Failed to create test run';
    } finally {
      isCreating = false;
    }
  }

  async function deleteTestRun(id) {
    try {
      const response = await fetch(`/api/test-runs/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await invalidateAll();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete test run');
      }
    } catch (error) {
      console.error('Error deleting test run:', error);
      alert('Failed to delete test run');
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Appmixer Sanity Check</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Test Runs</h1>
      <p class="text-muted-foreground mt-1">Manage and track connector sanity checks</p>
    </div>
    <Button onclick={() => (showCreateDialog = true)}>
      Create Test Run
    </Button>
  </div>

  {#if data.testRuns.length === 0}
    <div class="text-center py-12 border rounded-lg bg-muted/50">
      <h2 class="text-xl font-semibold mb-2">No test runs yet</h2>
      <p class="text-muted-foreground mb-4">Create your first test run to start tracking sanity checks</p>
      <Button onclick={() => (showCreateDialog = true)}>
        Create Test Run
      </Button>
    </div>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each data.testRuns as testRun (testRun.id)}
        <TestRunCard {testRun} onDelete={deleteTestRun} />
      {/each}
    </div>
  {/if}
</div>

<Dialog bind:open={showCreateDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Test Run</DialogTitle>
      <DialogDescription>
        This will fetch all available connectors and their components from the API
        and create a snapshot for testing.
      </DialogDescription>
    </DialogHeader>

    <div class="py-4">
      <Input
        placeholder="Test run name (e.g., Sprint 42 Sanity Check)"
        bind:value={newRunName}
        disabled={isCreating}
      />
      {#if createError}
        <p class="text-sm text-destructive mt-2">{createError}</p>
      {/if}
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={() => (showCreateDialog = false)} disabled={isCreating}>
        Cancel
      </Button>
      <Button onclick={createTestRun} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
