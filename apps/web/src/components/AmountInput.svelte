<script lang="ts">
  import { formatRupiah } from '$lib/format';
  import { currentLang } from '$lib/i18n';

  export let value: number | null = null;
  export let id: string = 'amount-input';
  export let label: string = '';
  export let placeholder: string = '0';
  export let required: boolean = false;
  export let showQuickAddZeros: boolean = true;
  export let inputClass: string = 'modal-input';

  let displayValue: string = '';

  $: {
    if (value === null || value === undefined || isNaN(value)) {
      displayValue = '';
    } else {
      displayValue = value.toLocaleString('id-ID');
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const raw = target.value;
    const digitsOnly = raw.replace(/\D/g, '');

    if (!digitsOnly) {
      value = null;
      displayValue = '';
    } else {
      const num = parseInt(digitsOnly, 10);
      value = num;
      displayValue = num.toLocaleString('id-ID');
    }
  }

  function addZeros(multiplier: number) {
    const current = value || 0;
    if (current === 0) {
      value = multiplier;
    } else {
      value = current * multiplier;
    }
  }
</script>

<div class="space-y-1.5 font-mono">
  {#if label}
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <label for={id} class="modal-label mb-0">{label}</label>
      {#if value && value > 0}
        <span class="text-[11px] font-mono font-extrabold text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-2 py-0.5 rounded border border-[var(--color-border)]">
          = {formatRupiah(value)}
        </span>
      {/if}
    </div>
  {/if}

  <div class="relative flex items-center">
    <span class="absolute left-3 text-xs font-mono font-bold text-[var(--color-ink-muted)] select-none pointer-events-none">Rp</span>
    <input
      {id}
      type="text"
      inputmode="numeric"
      value={displayValue}
      on:input={handleInput}
      {placeholder}
      {required}
      class={`${inputClass} font-mono font-bold text-sm`}
      style="padding-left: 2.5rem !important;"
    />
  </div>

  {#if showQuickAddZeros}
    <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
      <span class="text-[10px] text-[var(--color-ink-muted)] font-mono">
        {$currentLang === 'id' ? 'Tambah nol:' : 'Add zeros:'}
      </span>
      <button
        type="button"
        on:click={() => addZeros(1000)}
        class="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-paper-3)] hover:bg-[var(--color-border)] text-[var(--color-ink)] border border-[var(--color-border)] rounded cursor-pointer transition-colors"
        title={$currentLang === 'id' ? 'Tambah 3 nol ( Ribuan )' : 'Add 3 zeros ( Thousands )'}
      >
        +000 (.000)
      </button>
      <button
        type="button"
        on:click={() => addZeros(1000000)}
        class="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-paper-3)] hover:bg-[var(--color-border)] text-[var(--color-ink)] border border-[var(--color-border)] rounded cursor-pointer transition-colors"
        title={$currentLang === 'id' ? 'Tambah 6 nol ( Jutaan )' : 'Add 6 zeros ( Millions )'}
      >
        +000.000 (.000.000)
      </button>
    </div>
  {/if}
</div>
