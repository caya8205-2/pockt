<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate, formatDateNumeric } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { sortWithCustomOrder, saveCustomOrder } from '$lib/order';
  import { Wallet, Plus, ArrowDownLeft, Trash2, Edit3, GripVertical } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';

  $: t = translations[$currentLang];
  const STORAGE_KEY = 'pockt_order_incomes';

  interface Income {
    id: string;
    title: string;
    amount: number;
    date: string;
    notes: string | null;
  }

  let incomes: Income[] = [];
  let isLoading = true;
  let draggedIndex: number | null = null;

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
      incomes = sortWithCustomOrder(fetched, STORAGE_KEY);
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
    const updated = [...incomes];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    incomes = updated;
    draggedIndex = index;
    saveCustomOrder(incomes, STORAGE_KEY);
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

  onMount(() => {
    loadIncomes();
  });
</script>

<div class="space-y-5">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div class="flex items-start sm:items-center gap-3 min-w-0">
      <div class="p-2.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)] rounded-md shrink-0 mt-0.5 sm:mt-0">
        <Wallet class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.incomes_title}</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.incomes_subtitle}</p>
      </div>
    </div>

    <button
      on:click={openCreateModal}
      class="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs shrink-0 w-full sm:w-auto text-center"
    >
      <Plus class="w-4 h-4 stroke-[3] shrink-0" />
      <span>{t.add_income}</span>
    </button>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.incomes_loading}</div>
  {:else if incomes.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
      <p class="text-[var(--color-ink)] font-semibold text-sm">{t.no_incomes}</p>
    </div>
  {:else}
    <div class="grid gap-2.5">
      {#each incomes as item, index (item.id)}
        <div
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

            <div class="p-2 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded shrink-0 mt-0.5 sm:mt-0">
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
            <div class="font-bold text-[var(--color-accent)] text-sm sm:text-base">
              +{formatRupiah(item.amount)}
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
    <div>
      <label for="inp-inc-amount" class="modal-label">{t.amount_label}</label>
      <input
        id="inp-inc-amount"
        type="number"
        bind:value={amount}
        placeholder="0"
        required
        min="1"
        class="modal-input"
      />
    </div>
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
