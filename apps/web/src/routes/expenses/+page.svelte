<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate, formatDateNumeric } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { sortWithCustomOrder, saveCustomOrder } from '$lib/order';
  import { Receipt, Plus, ArrowUpRight, Trash2, Edit3, Tag, GripVertical, Calendar } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';

  $: t = translations[$currentLang];
  const STORAGE_KEY = 'pockt_order_expenses';

  interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    notes: string | null;
  }

  interface Category {
    id: string;
    name: string;
    color: string;
  }

  type PeriodFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

  let expenses: Expense[] = [];
  let categories: Category[] = [];
  let isLoading = true;
  let draggedIndex: number | null = null;

  // Filter states
  let selectedFilterCategory = 'ALL';
  let selectedPeriod: PeriodFilter = 'MONTH';

  // Form modal
  let showModal = false;
  let editingId: string | null = null;
  let title = '';
  let amount: number | null = null;
  let category = 'Umum';
  let date = new Date().toISOString().split('T')[0];
  let notes = '';

  // New category inline
  let showNewCatInput = false;
  let newCatName = '';

  const CATEGORY_TRANSLATIONS: Record<string, { id: string; en: string }> = {
    'Makanan & Minuman': { id: 'Makanan & Minuman', en: 'Food & Drinks' },
    'Transportasi': { id: 'Transportasi', en: 'Transportation' },
    'Belanja': { id: 'Belanja', en: 'Shopping' },
    'Hiburan': { id: 'Hiburan', en: 'Entertainment' },
    'Kesehatan': { id: 'Kesehatan', en: 'Health' },
    'Lainnya': { id: 'Lainnya', en: 'Others' },
    'Tagihan': { id: 'Tagihan', en: 'Bills' },
    'Umum': { id: 'Umum', en: 'General' },
  };

  function catLabel(name: string): string {
    const found = CATEGORY_TRANSLATIONS[name];
    if (found) {
      return $currentLang === 'en' ? found.en : found.id;
    }
    return name;
  }

  async function loadData() {
    isLoading = true;
    try {
      const [expRes, catRes] = await Promise.all([
        fetchApi<Expense[]>('/expenses'),
        fetchApi<Category[]>('/categories'),
      ]);
      expenses = sortWithCustomOrder(expRes, STORAGE_KEY);
      categories = catRes;
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...expenses];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    expenses = updated;
    draggedIndex = index;
    saveCustomOrder(expenses, STORAGE_KEY);
  }

  function handleDragEnd() {
    draggedIndex = null;
  }

  function openCreateModal() {
    editingId = null;
    title = '';
    amount = null;
    category = categories[0]?.name || 'Umum';
    date = new Date().toISOString().split('T')[0];
    notes = '';
    showNewCatInput = false;
    newCatName = '';
    showModal = true;
  }

  function openEditModal(item: Expense) {
    editingId = item.id;
    title = item.title;
    amount = item.amount;
    category = item.category;
    date = item.date;
    notes = item.notes || '';
    showNewCatInput = false;
    newCatName = '';
    showModal = true;
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      const created = await fetchApi<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      categories = [...categories, created];
      category = created.name;
      newCatName = '';
      showNewCatInput = false;
    } catch (err) {
      console.error(err);
    }
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
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.delete_expense_confirm)) return;
    await fetchApi(`/expenses/${id}`, { method: 'DELETE' });
    loadData();
  }

  function filterByPeriod(list: Expense[], period: PeriodFilter): Expense[] {
    if (period === 'ALL') return list;

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    if (period === 'TODAY') {
      return list.filter((e) => e.date === todayStr);
    }

    if (period === 'WEEK') {
      const dayOfWeek = now.getDay() || 7; // 1 = Mon, 7 = Sun
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return list.filter((e) => {
        const itemDate = new Date(e.date);
        return itemDate >= monday && itemDate <= sunday;
      });
    }

    if (period === 'MONTH') {
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return list.filter((e) => e.date.startsWith(currentMonthStr));
    }

    if (period === 'YEAR') {
      const currentYearStr = `${now.getFullYear()}`;
      return list.filter((e) => e.date.startsWith(currentYearStr));
    }

    return list;
  }

  $: categoryFiltered = selectedFilterCategory === 'ALL'
    ? expenses
    : expenses.filter((e) => e.category === selectedFilterCategory);

  $: filteredExpenses = filterByPeriod(categoryFiltered, selectedPeriod);

  $: totalFilteredAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  $: periodLabelMap = {
    ALL: $currentLang === 'id' ? 'Semua Waktu' : 'All Time',
    TODAY: $currentLang === 'id' ? 'Hari Ini' : 'Today',
    WEEK: $currentLang === 'id' ? 'Minggu Ini' : 'This Week',
    MONTH: $currentLang === 'id' ? 'Bulan Ini' : 'This Month',
    YEAR: $currentLang === 'id' ? 'Tahun Ini' : 'This Year',
  };

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-5">
  <!-- Header Title & Create Button -->
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
      class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs shrink-0 self-center leading-none text-center w-full sm:w-auto"
    >
      <Plus class="w-4 h-4 stroke-[3] shrink-0 my-auto" />
      <span class="leading-none">{t.add_expense}</span>
    </button>
  </div>

  <!-- Total Expenses Summary Card -->
  <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono shadow-xs">
    <div class="space-y-1">
      <div class="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-2">
        <span>{$currentLang === 'id' ? 'Total Pengeluaran' : 'Total Expenses'}</span>
        <span class="px-2 py-0.5 text-[10px] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded-full font-bold">
          {periodLabelMap[selectedPeriod]}
        </span>
      </div>
      <div class="text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
        {formatRupiah(totalFilteredAmount)}
      </div>
    </div>

    <div class="text-xs text-[var(--color-ink-muted)] font-mono">
      <span>{filteredExpenses.length} {$currentLang === 'id' ? 'transaksi ditemukan' : 'transactions found'}</span>
    </div>
  </div>

  <!-- Filters Row: Period Filter & Category Filter Chips -->
  <div class="space-y-2.5">
    <!-- Period Filter Chips -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
      <span class="text-[11px] text-[var(--color-ink-muted)] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 pr-1">
        <Calendar class="w-3.5 h-3.5" />
        <span>{$currentLang === 'id' ? 'Periode:' : 'Period:'}</span>
      </span>

      {#each (['ALL', 'TODAY', 'WEEK', 'MONTH', 'YEAR'] as PeriodFilter[]) as p}
        <button
          on:click={() => (selectedPeriod = p)}
          class={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
            selectedPeriod === p
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-border)] font-bold'
              : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border-[var(--color-border)] hover:text-[var(--color-ink)]'
          }`}
        >
          {periodLabelMap[p]}
        </button>
      {/each}
    </div>

    <!-- Category Filter Chips -->
    {#if categories.length > 0}
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
        <span class="text-[11px] text-[var(--color-ink-muted)] font-bold uppercase tracking-wider shrink-0 pr-1">
          {$currentLang === 'id' ? 'Kategori:' : 'Category:'}
        </span>

        <button
          on:click={() => (selectedFilterCategory = 'ALL')}
          class={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
            selectedFilterCategory === 'ALL'
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-border)] font-bold'
              : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border-[var(--color-border)] hover:text-[var(--color-ink)]'
          }`}
        >
          {t.expenses_all}
        </button>

        {#each categories as cat}
          <button
            on:click={() => (selectedFilterCategory = cat.name)}
            class={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              selectedFilterCategory === cat.name
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-border)] font-bold'
                : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border-[var(--color-border)] hover:text-[var(--color-ink)]'
            }`}
          >
            {catLabel(cat.name)}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Expenses List -->
  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.expenses_loading}</div>
  {:else if filteredExpenses.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1 font-mono">
      <p class="text-[var(--color-ink)] font-semibold text-sm">{t.no_expenses}</p>
      <p class="text-xs text-[var(--color-ink-muted)]">
        {$currentLang === 'id' ? 'Tidak ada transaksi pengeluaran untuk filter yang dipilih.' : 'No expense records found for the selected filter.'}
      </p>
    </div>
  {:else}
    <div class="grid gap-2.5" role="list">
      {#each filteredExpenses as item, index (item.id)}
        <div
          role="listitem"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, index)}
          on:dragover={(e) => handleDragOver(e, index)}
          on:dragend={handleDragEnd}
          class={`bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all ${
            draggedIndex === index ? 'opacity-40 border-dashed border-[var(--color-accent)]' : 'hover:border-slate-400'
          }`}
        >
          <div class="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <!-- Drag Handle Icon -->
            <div class="cursor-grab active:cursor-grabbing text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 shrink-0 mt-0.5 sm:mt-0" title="Drag to reorder">
              <GripVertical class="w-4 h-4" />
            </div>

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
                {formatDateNumeric(item.date)} ({formatDate(item.date)}) {#if item.notes}• <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
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
<Modal isOpen={showModal} title={editingId ? t.edit_expense : t.add_expense_title} onClose={() => (showModal = false)}>
  <form on:submit|preventDefault={handleSubmit} class="space-y-3.5 font-mono">
    <div>
      <label for="inp-exp-title" class="modal-label">{t.expense_title_label}</label>
      <input
        id="inp-exp-title"
        type="text"
        bind:value={title}
        placeholder={t.expense_title_placeholder}
        required
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-exp-amount" class="modal-label">{t.amount_label}</label>
      <input
        id="inp-exp-amount"
        type="number"
        bind:value={amount}
        placeholder="0"
        required
        min="1"
        class="modal-input"
      />
    </div>
    <div>
      <div class="flex items-center justify-between mb-1">
        <label for="sel-exp-cat" class="modal-label mb-0">{t.category_label}</label>
        <button
          type="button"
          on:click={() => (showNewCatInput = !showNewCatInput)}
          class="text-[11px] text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Tag class="w-3 h-3" />
          <span>{showNewCatInput ? t.common_cancel : t.add_category_btn}</span>
        </button>
      </div>

      {#if showNewCatInput}
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={newCatName}
            placeholder={t.category_placeholder}
            class="modal-input"
          />
          <button
            type="button"
            on:click={handleAddCategory}
            class="px-3 py-2 bg-[var(--color-paper-3)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] rounded-md hover:bg-[var(--color-border)] font-bold cursor-pointer"
          >
            {t.add_btn}
          </button>
        </div>
      {:else}
        <select
          id="sel-exp-cat"
          bind:value={category}
          class="modal-input"
        >
          {#each categories as cat}
            <option value={cat.name}>{catLabel(cat.name)}</option>
          {/each}
        </select>
      {/if}
    </div>
    <div>
      <label for="inp-exp-date" class="modal-label">
        {t.date_label} <span class="text-[10px] text-[var(--color-ink-muted)] font-normal">(Format: DD/MM/YYYY)</span>
      </label>
      <input
        id="inp-exp-date"
        type="date"
        bind:value={date}
        required
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-exp-notes" class="modal-label">{t.notes_label}</label>
      <input
        id="inp-exp-notes"
        type="text"
        bind:value={notes}
        placeholder={t.notes_placeholder}
        class="modal-input"
      />
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <button type="button" on:click={() => (showModal = false)} class="px-4 py-2 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">{t.common_cancel}</button>
      <button type="submit" class="px-4 py-2 text-xs font-bold text-slate-950 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-md shadow-xs">{t.common_save}</button>
    </div>
  </form>
</Modal>
