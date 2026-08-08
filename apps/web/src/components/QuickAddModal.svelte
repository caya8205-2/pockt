<script lang="ts">
  import { fetchApi } from '$lib/api';
  import { currentLang, translations, categoryLabel } from '$lib/i18n';
  import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';

  $: t = translations[$currentLang];
  $: catLabel = (cat: string) => categoryLabel($currentLang, cat);

  export let isOpen = false;
  export let onSuccess: () => void = () => {};

  let type: 'expense' | 'income' = 'expense';
  let title = '';
  let amount: number | null = null;
  let category = 'Makanan & Minuman';
  let date = new Date().toISOString().split('T')[0];
  let notes = '';
  let isLoading = false;
  let errorMsg = '';

  const defaultCategories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Hiburan',
    'Kesehatan',
    'Tagihan',
    'Lainnya',
  ];

  async function handleSubmit() {
    if (!title || !amount || amount <= 0) {
      errorMsg = t.quickadd_error;
      return;
    }

    isLoading = true;
    errorMsg = '';

    try {
      if (type === 'expense') {
        await fetchApi('/expenses', {
          method: 'POST',
          body: JSON.stringify({ title, amount: Number(amount), category, date, notes }),
        });
      } else {
        await fetchApi('/incomes', {
          method: 'POST',
          body: JSON.stringify({ title, amount: Number(amount), date, notes }),
        });
      }

      // Reset form
      title = '';
      amount = null;
      notes = '';
      isOpen = false;
      onSuccess();
    } catch (err: any) {
      errorMsg = err.message || t.quickadd_error;
    } finally {
      isLoading = false;
    }
  }

  function closeModal() {
    isOpen = false;
  }
</script>

<Modal {isOpen} title={t.quick_add_title} onClose={closeModal}>
  <!-- Type Switcher -->
  <div class="grid grid-cols-2 gap-2 bg-[var(--color-paper)] p-1 rounded-md mb-4 border border-[var(--color-border)]">
    <button
      type="button"
      on:click={() => (type = 'expense')}
      class={`flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
        type === 'expense'
          ? 'bg-[var(--color-paper-3)] text-[var(--color-ink)] border border-[var(--color-border)]'
          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
      }`}
    >
      <ArrowUpRight class="w-4 h-4" />
      <span>{t.type_expense}</span>
    </button>

    <button
      type="button"
      on:click={() => (type = 'income')}
      class={`flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
        type === 'income'
          ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)]'
          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
      }`}
    >
      <ArrowDownLeft class="w-4 h-4" />
      <span>{t.type_income}</span>
    </button>
  </div>

  {#if errorMsg}
    <div class="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
      {errorMsg}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-3.5 font-mono">
    <div>
      <label for="input-title" class="modal-label">{t.quickadd_title_label}</label>
      <input
        id="input-title"
        type="text"
        bind:value={title}
        placeholder={type === 'expense' ? t.expense_title_placeholder : t.income_title_placeholder}
        required
        class="modal-input"
      />
    </div>

    <div>
      <label for="input-amount" class="modal-label">{t.amount_label}</label>
      <input
        id="input-amount"
        type="number"
        bind:value={amount}
        placeholder="0"
        required
        min="1"
        class="modal-input"
      />
    </div>

    {#if type === 'expense'}
      <div>
        <label for="select-category" class="modal-label">{t.category_label}</label>
        <select
          id="select-category"
          bind:value={category}
          class="modal-input"
        >
          {#each defaultCategories as cat}
            <option value={cat}>{catLabel(cat)}</option>
          {/each}
        </select>
      </div>
    {/if}

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="input-date" class="modal-label">{t.date_label}</label>
        <input
          id="input-date"
          type="date"
          bind:value={date}
          required
          class="modal-input"
        />
      </div>

      <div>
        <label for="input-notes" class="modal-label">{t.notes_label}</label>
        <input
          id="input-notes"
          type="text"
          bind:value={notes}
          placeholder={t.notes_placeholder}
          class="modal-input"
        />
      </div>
    </div>

    <div class="pt-3 flex justify-end gap-2">
      <button
        type="button"
        on:click={closeModal}
        class="px-4 py-2 text-xs font-mono font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
      >
        {t.common_cancel}
      </button>

      <button
        type="submit"
        disabled={isLoading}
        class="px-5 py-2 text-xs font-mono font-bold text-slate-950 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
      >
        {isLoading ? t.common_saving : t.save_transaction}
      </button>
    </div>
  </form>
</Modal>
