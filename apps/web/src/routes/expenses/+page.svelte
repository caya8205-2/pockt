<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate } from '$lib/format';
  import { currentLang, translations, categoryLabel } from '$lib/i18n';
  import { Receipt, Plus, Trash2, Edit3, ArrowUpRight, Search, X } from 'lucide-svelte';

  $: t = translations[$currentLang];
  $: catLabel = (cat: string) => categoryLabel($currentLang, cat);

  interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    notes: string | null;
  }

  let expenses: Expense[] = [];
  let isLoading = true;
  let searchQuery = '';
  let selectedCategoryFilter = 'ALL';

  // Form modal
  let showModal = false;
  let editingId: string | null = null;
  let title = '';
  let amount: number | null = null;
  let category = 'Makanan & Minuman';
  let date = new Date().toISOString().split('T')[0];
  let notes = '';

  const categories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Hiburan',
    'Kesehatan',
    'Tagihan',
    'Lainnya',
  ];

  async function loadExpenses() {
    isLoading = true;
    try {
      expenses = await fetchApi<Expense[]>('/expenses');
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingId = null;
    title = '';
    amount = null;
    category = 'Makanan & Minuman';
    date = new Date().toISOString().split('T')[0];
    notes = '';
    showModal = true;
  }

  function openEditModal(item: Expense) {
    editingId = item.id;
    title = item.title;
    amount = item.amount;
    category = item.category;
    date = item.date;
    notes = item.notes || '';
    showModal = true;
  }

  async function handleSubmit() {
    if (!title || !amount || amount <= 0) return;

    if (editingId) {
      await fetchApi(`/expenses/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, amount: Number(amount), category, date, notes }),
      });
    } else {
      await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify({ title, amount: Number(amount), category, date, notes }),
      });
    }

    showModal = false;
    loadExpenses();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.delete_expense_confirm)) return;
    await fetchApi(`/expenses/${id}`, { method: 'DELETE' });
    loadExpenses();
  }

  $: filteredExpenses = expenses.filter((e) => {
    const matchCategory = selectedCategoryFilter === 'ALL' || e.category === selectedCategoryFilter;
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  onMount(() => {
    loadExpenses();
  });
</script>

<div class="space-y-5">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div class="flex items-start sm:items-center gap-3 min-w-0">
      <div class="p-2.5 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] border border-[var(--color-border)] rounded-md shrink-0 mt-0.5 sm:mt-0">
        <Receipt class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.expenses_title}</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.expenses_subtitle}</p>
      </div>
    </div>

    <button
      on:click={openCreateModal}
      class="flex items-center justify-center gap-2 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs shrink-0 w-full sm:w-auto"
    >
      <Plus class="w-4 h-4 stroke-[3]" />
      <span>{t.record_expense}</span>
    </button>
  </div>

  <!-- Search & Filter Bar -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-2.5">
    <div class="relative w-full sm:w-72">
      <Search class="w-4 h-4 absolute left-3 top-2.5 text-[var(--color-ink-muted)]" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder={t.expenses_search_placeholder}
        class="w-full pl-9 pr-3 py-1.5 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-xs focus:outline-none focus:border-[var(--color-accent)] font-mono"
      />
    </div>

    <div class="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none py-0.5">
      <button
        on:click={() => (selectedCategoryFilter = 'ALL')}
        class={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${
          selectedCategoryFilter === 'ALL' ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold' : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-3)]'
        }`}
      >
        {t.expenses_all}
      </button>
      {#each categories as cat}
        <button
          on:click={() => (selectedCategoryFilter = cat)}
          class={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategoryFilter === cat ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold' : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-3)]'
          }`}
        >
          {catLabel(cat)}
        </button>
      {/each}
    </div>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.expenses_loading}</div>
  {:else if filteredExpenses.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
      <p class="text-[var(--color-ink)] font-semibold text-sm">{t.expenses_empty}</p>
    </div>
  {:else}
    <div class="grid gap-2.5">
      {#each filteredExpenses as item}
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-slate-400 transition-colors">
          <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div class="p-2 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0 mt-0.5 sm:mt-0">
              <ArrowUpRight class="w-4 h-4" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-[var(--color-ink)] text-sm">{item.title}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0">
                  {catLabel(item.category)}
                </span>
              </div>
              <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                {formatDate(item.date)} {#if item.notes}• <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] font-mono shrink-0">
            <div class="font-bold text-[var(--color-ink)] text-sm sm:text-base">
              -{formatRupiah(item.amount)}
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                on:click={() => openEditModal(item)}
                class="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded transition-colors cursor-pointer"
                aria-label={t.common_edit}
              >
                <Edit3 class="w-4 h-4" />
              </button>
              <button
                on:click={() => handleDelete(item.id)}
                class="p-1.5 text-[var(--color-ink-muted)] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                aria-label={t.common_delete}
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal Form -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-paper)]/85 backdrop-blur-md">
    <div class="w-full max-w-md bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-6 space-y-4 shadow-xl relative">
      <button on:click={() => (showModal = false)} class="absolute top-4 right-4 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer" aria-label={t.common_close}>
        <X class="w-5 h-5" />
      </button>

      <h2 class="text-base font-bold font-mono text-[var(--color-ink)]">{editingId ? t.edit_expense : t.add_expense_title}</h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-3.5">
        <div>
          <label id="lbl-exp-title" for="inp-exp-title" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.expense_title_label}</label>
          <input
            id="inp-exp-title"
            type="text"
            bind:value={title}
            placeholder={t.expense_title_placeholder}
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-exp-amount" for="inp-exp-amount" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.amount_label}</label>
          <input
            id="inp-exp-amount"
            type="number"
            bind:value={amount}
            placeholder="0"
            required
            min="1"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-exp-cat" for="sel-exp-cat" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.category_label}</label>
          <select
            id="sel-exp-cat"
            bind:value={category}
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          >
            {#each categories as cat}
              <option value={cat}>{catLabel(cat)}</option>
            {/each}
          </select>
        </div>
        <div>
          <label id="lbl-exp-date" for="inp-exp-date" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.date_label}</label>
          <input
            id="inp-exp-date"
            type="date"
            bind:value={date}
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-exp-notes" for="inp-exp-notes" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.notes_label}</label>
          <input
            id="inp-exp-notes"
            type="text"
            bind:value={notes}
            placeholder={t.notes_placeholder}
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" on:click={() => (showModal = false)} class="px-4 py-2 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">{t.common_cancel}</button>
          <button type="submit" class="px-4 py-2 text-xs font-mono font-bold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-md">{t.common_save}</button>
        </div>
      </form>
    </div>
  </div>
{/if}
