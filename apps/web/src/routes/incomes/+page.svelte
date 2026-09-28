<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate, formatDateNumeric } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { sortWithCustomOrder, saveCustomOrder } from '$lib/order';
  import { sortItems, type SortOption } from '$lib/sort';
  import { Wallet, Plus, ArrowDownLeft, Trash2, Edit3, GripVertical, Calendar } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';
  import AmountInput from '$components/AmountInput.svelte';
  import SortDropdown from '$components/SortDropdown.svelte';
  import ListLimiter from '$components/ListLimiter.svelte';

  $: t = translations[$currentLang];
  const STORAGE_KEY = 'pockt_order_incomes';

  interface Income {
    id: string;
    title: string;
    amount: number;
    date: string;
    notes: string | null;
  }

  type PeriodFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

  let incomes: Income[] = [];
  let isLoading = true;
  let draggedIndex: number | null = null;

  // Filter states
  let selectedPeriod: PeriodFilter = 'MONTH';
  let selectedSort: SortOption = 'date_desc';
  let limit: number = 15;

  // Form modal
  let showModal = false;
  let editingId: string | null = null;
  let title = '';
  let amount: number | null = null;
  let date = new Date().toISOString().split('T')[0];
  let notes = '';

  async function loadIncomes() {
    isLoading = true;
    try {
      const fetched = await fetchApi<Income[]>('/incomes');
      incomes = fetched;
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
    const updated = [...sortedIncomes];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    draggedIndex = index;
    selectedSort = 'custom';
    saveCustomOrder(updated, STORAGE_KEY);
    incomes = updated;
  }

  function handleDragEnd() {
    draggedIndex = null;
  }

  function openCreateModal() {
    editingId = null;
    title = '';
    amount = null;
    date = new Date().toISOString().split('T')[0];
    notes = '';
    showModal = true;
  }

  function openEditModal(item: Income) {
    editingId = item.id;
    title = item.title;
    amount = item.amount;
    date = item.date;
    notes = item.notes || '';
    showModal = true;
  }

  async function handleSubmit() {
    if (!title || !amount || amount <= 0) return;

    if (editingId) {
      await fetchApi(`/incomes/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, amount: Number(amount), date, notes }),
      });
    } else {
      await fetchApi('/incomes', {
        method: 'POST',
        body: JSON.stringify({ title, amount: Number(amount), date, notes }),
      });
    }

    showModal = false;
    loadIncomes();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.delete_income_confirm)) return;
    await fetchApi(`/incomes/${id}`, { method: 'DELETE' });
    loadIncomes();
  }

  function filterByPeriod(list: Income[], period: PeriodFilter): Income[] {
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

  $: periodFiltered = filterByPeriod(incomes, selectedPeriod);
  $: sortedIncomes = sortItems(periodFiltered, selectedSort, STORAGE_KEY);
  $: totalFilteredAmount = sortedIncomes.reduce((sum, item) => sum + item.amount, 0);
  $: displayedIncomes = sortedIncomes.slice(0, limit);

  $: periodLabelMap = {
    ALL: $currentLang === 'id' ? 'Semua Waktu' : 'All Time',
    TODAY: $currentLang === 'id' ? 'Hari Ini' : 'Today',
    WEEK: $currentLang === 'id' ? 'Minggu Ini' : 'This Week',
    MONTH: $currentLang === 'id' ? 'Bulan Ini' : 'This Month',
    YEAR: $currentLang === 'id' ? 'Tahun Ini' : 'This Year',
  };

  onMount(() => {
    loadIncomes();
  });
</script>

<div class="space-y-5">
  <!-- Header Title & Create Button -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div class="flex items-start sm:items-center gap-3 min-w-0">
      <div class="p-2.5 bg-[var(--color-accent-subtle)] text-emerald-700 dark:text-[var(--color-accent)] border border-[var(--color-border)] rounded-md shrink-0 mt-0.5 sm:mt-0">
        <Wallet class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.incomes_title}</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.incomes_subtitle}</p>
      </div>
    </div>

    <button
      on:click={openCreateModal}
      class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs shrink-0 self-center leading-none text-center w-full sm:w-auto"
    >
      <Plus class="w-4 h-4 stroke-[3] shrink-0" />
      <span class="leading-none">{t.add_income}</span>
    </button>
  </div>

  <!-- Total Incomes Summary Card -->
  <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono shadow-xs">
    <div class="space-y-1.5">
      <div class="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-2">
        <span>{$currentLang === 'id' ? 'Total Pemasukan' : 'Total Income'}</span>
        <span class="px-2.5 py-0.5 text-[10px] bg-[var(--color-accent-subtle)] text-emerald-700 dark:text-[var(--color-accent)] rounded-full font-bold">
          {periodLabelMap[selectedPeriod]}
        </span>
      </div>
      <div class="text-3xl sm:text-4xl font-extrabold text-emerald-700 dark:text-[var(--color-accent)]">
        {formatRupiah(totalFilteredAmount)}
      </div>
    </div>

    <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
      <div class="text-xs text-[var(--color-ink-muted)] font-mono">
        <span>{sortedIncomes.length} {$currentLang === 'id' ? 'transaksi ditemukan' : 'transactions found'}</span>
      </div>
      <div class="sm:hidden">
        <SortDropdown bind:value={selectedSort} mode="standard" size="sm" allowCustom={true} />
      </div>
    </div>
  </div>

  <!-- Period Filter Chips & Desktop Sort Dropdown -->
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-xs">
      <span class="text-[11px] text-[var(--color-ink-muted)] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 pr-1">
        <Calendar class="w-3.5 h-3.5" />
        <span>{$currentLang === 'id' ? 'Periode:' : 'Period:'}</span>
      </span>

      {#each (['ALL', 'TODAY', 'WEEK', 'MONTH', 'YEAR'] as PeriodFilter[]) as p}
        <button
          on:click={() => { selectedPeriod = p; limit = 15; }}
          class={`h-[30px] inline-flex items-center justify-center px-3 rounded-md border transition-colors cursor-pointer whitespace-nowrap leading-none ${
            selectedPeriod === p
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-ink)] border-[var(--color-border)] font-bold shadow-xs'
              : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border-[var(--color-border)] hover:text-[var(--color-ink)]'
          }`}
        >
          {periodLabelMap[p]}
        </button>
      {/each}
    </div>

    <div class="hidden sm:block shrink-0">
      <SortDropdown bind:value={selectedSort} mode="standard" allowCustom={true} />
    </div>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.incomes_loading}</div>
  {:else if sortedIncomes.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
      <p class="text-[var(--color-ink)] font-semibold text-sm">{t.no_incomes}</p>
    </div>
  {:else}
    <div class="grid gap-2.5" role="list">
      {#each displayedIncomes as item, index (item.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          role="listitem"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, index)}
          on:dragover={(e) => handleDragOver(e, index)}
          on:dragend={handleDragEnd}
          class={`bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all shadow-xs ${
            draggedIndex === index ? 'opacity-40 border-dashed border-[var(--color-accent)]' : 'hover:border-[var(--color-ink-muted)]/40'
          }`}
        >
          <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <!-- Drag Handle Icon -->
            <div class="cursor-grab active:cursor-grabbing text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 shrink-0 mt-0.5 sm:mt-0" title="Drag to reorder">
              <GripVertical class="w-4 h-4" />
            </div>

            <div class="p-2 bg-emerald-500/10 text-emerald-700 dark:text-[var(--color-accent)] rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <ArrowDownLeft class="w-4 h-4" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="font-bold text-[var(--color-ink)] text-sm">{item.title}</div>
              <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                {formatDateNumeric(item.date)} ({formatDate(item.date)}) {#if item.notes}• <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] font-mono shrink-0">
            <div class="font-bold text-emerald-700 dark:text-[var(--color-accent)] text-sm sm:text-base">
              +{formatRupiah(item.amount)}
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                on:click={() => openEditModal(item)}
                class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors cursor-pointer"
                aria-label={t.common_edit}
              >
                <Edit3 class="w-4 h-4" />
              </button>
              <button
                on:click={() => handleDelete(item.id)}
                class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-ink-muted)] hover:text-rose-600 hover:bg-rose-500/15 transition-colors cursor-pointer"
                aria-label={t.common_delete}
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- List Limiter Toolbar -->
    <ListLimiter
      totalItems={sortedIncomes.length}
      bind:limit
      defaultLimit={15}
      step={15}
      label={$currentLang === 'id' ? 'pemasukan' : 'incomes'}
    />
  {/if}
</div>

<!-- Modal Form -->
<Modal isOpen={showModal} title={editingId ? t.edit_income : t.add_income_title} onClose={() => (showModal = false)}>
  <form on:submit|preventDefault={handleSubmit} class="space-y-3.5 font-mono">
    <div>
      <label for="inp-inc-title" class="modal-label">{t.income_title_label}</label>
      <input
        id="inp-inc-title"
        type="text"
        bind:value={title}
        placeholder={t.income_title_placeholder}
        required
        class="modal-input"
      />
    </div>
    <AmountInput
      id="inp-inc-amount"
      bind:value={amount}
      label={t.amount_label}
      placeholder="0"
      required
    />
    <div>
      <label for="inp-inc-date" class="modal-label">
        {t.date_label} <span class="text-[10px] text-[var(--color-ink-muted)] font-normal">(Format: DD/MM/YYYY)</span>
      </label>
      <input
        id="inp-inc-date"
        type="date"
        bind:value={date}
        required
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-inc-notes" class="modal-label">{t.notes_label}</label>
      <input
        id="inp-inc-notes"
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
