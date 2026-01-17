<script>
  import { Check, Loader2 } from 'lucide-svelte';

  let { status = $bindable('idle'), message = $bindable('') } = $props();

  // Auto-hide after showing "saved" for 2 seconds
  $effect(() => {
    if (status === 'saved') {
      const timeout = setTimeout(() => {
        status = 'idle';
        message = '';
      }, 2000);
      return () => clearTimeout(timeout);
    }
  });
</script>

{#if status !== 'idle'}
  <div
    class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg transition-all {status === 'saving' ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-800'}"
  >
    {#if status === 'saving'}
      <Loader2 class="w-4 h-4 animate-spin" />
      <span class="text-sm">{message || 'Saving...'}</span>
    {:else if status === 'saved'}
      <Check class="w-4 h-4" />
      <span class="text-sm">{message || 'Saved'}</span>
    {/if}
  </div>
{/if}
