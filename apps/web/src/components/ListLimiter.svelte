<script lang="ts">
  import { currentLang } from '$lib/i18n';
  import { ChevronDown, ChevronUp, ChevronsDown } from 'lucide-svelte';

  export let totalItems: number;
  export let limit: number = 15;
  export let defaultLimit: number = 15;
  export let step: number = 15;
  export let label: string = '';

  $: displayedCount = Math.min(limit, totalItems);
  $: hasMore = limit < totalItems;
  $: isExpanded = limit > defaultLimit;
  $: remainingCount = totalItems - limit;

  function showMore() {
    limit = Math.min(limit + step, totalItems);
  }

  function showAll() {
    limit = totalItems;
  }

  function showLess() {
    limit = defaultLimit;
  }
</script>

{#if totalItems > defaultLimit}
  <div class="pt-3 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--color-border)] text-xs font-mono">
    <div class="text-[var(--color-ink-muted)]">
      {$currentLang === 'id' ? 'Menampilkan' : 'Showing'}
      <span class="font-bold text-[var(--color-ink)]">{displayedCount}</span>
      {$currentLang === 'id' ? 'dari' : 'of'}
      <span class="font-bold text-[var(--color-ink)]">{totalItems}</span>
      {label || ($currentLang === 'id' ? 'transaksi' : 'items')}
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      {#if hasMore}
        <button
          type="button"
          on:click={showMore}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] rounded-md transition-colors cursor-pointer shadow-xs font-bold leading-none"
        >
          <ChevronDown class="w-3.5 h-3.5" />
          <span>{$currentLang === 'id' ? `+${Math.min(step, remainingCount)} Lagi` : `+${Math.min(step, remainingCount)} More`}</span>
        </button>

        <button
          type="button"
          on:click={showAll}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded-md transition-colors cursor-pointer shadow-xs leading-none"
        >
          <ChevronsDown class="w-3.5 h-3.5" />
          <span>{$currentLang === 'id' ? 'Tampilkan Semua' : 'Show All'}</span>
        </button>
      {/if}

      {#if isExpanded}
        <button
          type="button"
          on:click={showLess}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded-md transition-colors cursor-pointer shadow-xs leading-none"
        >
          <ChevronUp class="w-3.5 h-3.5" />
          <span>{$currentLang === 'id' ? 'Tampilkan Lebih Sedikit' : 'Show Less'}</span>
        </button>
      {/if}
    </div>
  </div>
{/if}
