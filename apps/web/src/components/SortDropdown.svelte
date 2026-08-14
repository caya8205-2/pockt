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

  $: currentOption = options.find((o) => o.id === value) || options[0];
</script>

<div class="relative inline-flex items-center font-mono text-xs cursor-pointer select-none">
  <!-- Visual button with identical standard button height, padding, borders, and typography -->
  <div class="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] rounded-md shadow-xs transition-colors cursor-pointer w-full leading-none pointer-events-none">
    <ArrowUpDown class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
    <span class="text-xs text-[var(--color-ink-muted)] font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
      {t.sort_label}
    </span>
    <span class="font-bold text-xs text-[var(--color-ink)] truncate">
      {currentOption ? currentOption.label : ''}
    </span>
  </div>

  <!-- Full-coverage select spanning 100% width and height so clicking ANYWHERE triggers it -->
  <select
    bind:value
    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
    aria-label={t.sort_label}
  >
    {#each options as opt}
      <option value={opt.id} class="bg-[var(--color-paper-2)] text-[var(--color-ink)] font-mono">
        {opt.label}
      </option>
    {/each}
  </select>
</div>
