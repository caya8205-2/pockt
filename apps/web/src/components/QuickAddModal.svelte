<script lang="ts">
  import { fetchApi } from '$lib/api';
  import { currentLang, translations } from '$lib/i18n';
  import { Plus, X, ArrowUpRight, ArrowDownLeft } from 'lucide-svelte';

  $: t = translations[$currentLang];

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

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-paper)]/85 backdrop-blur-md">
    <div class="w-full max-w-md bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md shadow-xl p-6 relative animate-in fade-in zoom-in duration-150">
      <button
        on:click={closeModal}
        class="absolute top-4 right-4 p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded transition-colors cursor-pointer"
        aria-label={t.common_close}
      >
        <X class="w-5 h-5" />
      </button>

      <h2 class="text-base font-bold text-[var(--color-ink)] font-mono mb-4 flex items-center gap-2">
        <Plus class="w-4 h-4 text-[var(--color-accent)]" />
        <span>{t.quick_add_title}</span>
      </h2>

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

      <form on:submit|preventDefault={handleSubmit} class="space-y-3.5">
        <div>
          <label id="label-title" for="input-title" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.quickadd_title_label}</label>
          <input
            id="input-title"
            type="text"
            bind:value={title}
            placeholder={type === 'expense' ? t.expense_title_placeholder : t.income_title_placeholder}
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-accent)] text-sm"
          />
        </div>

        <div>
          <label id="label-amount" for="input-amount" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.amount_label}</label>
          <input
            id="input-amount"
            type="number"
            bind:value={amount}
            placeholder="0"
            required
            min="1"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] font-mono placeholder-slate-400 focus:outline-none focus:border-[var(--color-accent)] text-sm"
          />
        </div>

        {#if type === 'expense'}
          <div>
            <label id="label-category" for="select-category" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.category_label}</label>
            <select
              id="select-category"
              bind:value={category}
              class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] text-sm"
            >
              {#each defaultCategories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label id="label-date" for="input-date" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.date_label}</label>
            <input
              id="input-date"
              type="date"
              bind:value={date}
              required
              class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-accent)] text-sm"
            />
          </div>

          <div>
            <label id="label-notes" for="input-notes" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.notes_label}</label>
            <input
              id="input-notes"
              type="text"
              bind:value={notes}
              placeholder={t.notes_placeholder}
              class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-accent)] text-sm"
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
            class="px-5 py-2 text-xs font-mono font-bold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading ? t.common_saving : t.save_transaction}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
