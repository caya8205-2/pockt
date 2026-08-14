<script lang="ts">
  import { currentLang, translations } from '$lib/i18n';
  import { ArrowUpDown } from 'lucide-svelte';
  import type { SortOption } from '$lib/sort';

  export let value: SortOption = 'date_desc';
  export let mode: 'standard' | 'bills' | 'debts' = 'standard';
  export let allowCustom = true;

  $: t = translations[$currentLang];

  interface OptionItem {
    id: SortOption;
    label: string;
  }

  $: options = ((): OptionItem[] => {
    if (mode === 'bills') {
      const list: OptionItem[] = [
        { id: 'due_date_asc', label: t.sort_due_date_asc },
        { id: 'due_date_desc', label: t.sort_due_date_desc },
        { id: 'name_asc', label: t.sort_name_asc },
        { id: 'name_desc', label: t.sort_name_desc },
        { id: 'amount_desc', label: t.sort_amount_desc },
        { id: 'amount_asc', label: t.sort_amount_asc },
      ];
      if (allowCustom) {
        list.push({ id: 'custom', label: t.sort_custom });
      }
      return list;
    }

    const list: OptionItem[] = [
      { id: 'date_desc', label: t.sort_date_desc },
      { id: 'date_asc', label: t.sort_date_asc },
      { id: 'name_asc', label: t.sort_name_asc },
      { id: 'name_desc', label: t.sort_name_desc },
      { id: 'amount_desc', label: t.sort_amount_desc },
      { id: 'amount_asc', label: t.sort_amount_asc },
    ];
    if (allowCustom) {
      list.push({ id: 'custom', label: t.sort_custom });
    }
    return list;
  })();
</script>

<div class="relative inline-flex items-center font-mono text-xs">
  <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md shadow-2xs hover:border-[var(--color-ink-muted)] transition-colors">
    <ArrowUpDown class="w-3.5 h-3.5 text-[var(--color-ink-muted)] shrink-0" />
    <span class="text-[11px] text-[var(--color-ink-muted)] font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
      {t.sort_label}
    </span>
    <select
      bind:value
      class="bg-transparent text-[var(--color-ink)] font-bold text-xs focus:outline-none cursor-pointer pr-1 appearance-none"
      aria-label={t.sort_label}
    >
      {#each options as opt}
        <option value={opt.id} class="bg-[var(--color-paper-2)] text-[var(--color-ink)] font-mono">
          {opt.label}
        </option>
      {/each}
    </select>
  </div>
</div>
