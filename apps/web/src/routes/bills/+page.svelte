<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { CalendarCheck, Plus, Trash2, Edit3, CheckCircle2, RotateCcw, X } from 'lucide-svelte';

  $: t = translations[$currentLang];

  interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: number;
    isPaid: boolean;
    notes: string | null;
    lastPaidAt: string | null;
  }

  let bills: Bill[] = [];
  let isLoading = true;

  // Form modal
  let showModal = false;
  let editingId: string | null = null;
  let name = '';
  let amount: number | null = null;
  let dueDate = 1;
  let notes = '';

  async function loadBills() {
    isLoading = true;
    try {
      bills = await fetchApi<Bill[]>('/bills');
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingId = null;
    name = '';
    amount = null;
    dueDate = 1;
    notes = '';
    showModal = true;
  }

  function openEditModal(item: Bill) {
    editingId = item.id;
    name = item.name;
    amount = item.amount;
    dueDate = item.dueDate;
    notes = item.notes || '';
    showModal = true;
  }

  async function handleSubmit() {
    if (!name || !amount || amount <= 0) return;

    if (editingId) {
      await fetchApi(`/bills/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, amount: Number(amount), dueDate: Number(dueDate), notes }),
      });
    } else {
      await fetchApi('/bills', {
        method: 'POST',
        body: JSON.stringify({ name, amount: Number(amount), dueDate: Number(dueDate), notes }),
      });
    }

    showModal = false;
    loadBills();
  }

  async function togglePaidStatus(id: string) {
    await fetchApi(`/bills/${id}/toggle-paid`, { method: 'POST' });
    loadBills();
  }

  async function resetMonthlyBills() {
    if (!confirm(t.bills_reset_confirm)) return;
    await fetchApi('/bills/reset-monthly', { method: 'POST' });
    loadBills();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.bills_delete_confirm)) return;
    await fetchApi(`/bills/${id}`, { method: 'DELETE' });
    loadBills();
  }

  onMount(() => {
    loadBills();
  });
</script>

<div class="space-y-5">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div class="flex items-start sm:items-center gap-3 min-w-0">
      <div class="p-2.5 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] border border-[var(--color-border)] rounded-md shrink-0 mt-0.5 sm:mt-0">
        <CalendarCheck class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.bills_title}</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.bills_subtitle}</p>
      </div>
    </div>

    <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
      <button
        on:click={resetMonthlyBills}
        class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-3)] border border-[var(--color-border)] rounded-md transition-colors cursor-pointer"
      >
        <RotateCcw class="w-4 h-4" />
        <span>{t.bills_reset_month}</span>
      </button>

      <button
        on:click={openCreateModal}
        class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors shadow-xs cursor-pointer"
      >
        <Plus class="w-4 h-4 stroke-[3]" />
        <span>{t.add_bill}</span>
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.bills_loading}</div>
  {:else if bills.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
      <p class="text-[var(--color-ink)] font-semibold text-sm">{t.bills_empty}</p>
    </div>
  {:else}
    <div class="grid gap-2.5">
      {#each bills as item}
        <div class={`border rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors ${
          item.isPaid ? 'bg-[var(--color-paper-2)]/40 border-[var(--color-border)] opacity-75' : 'bg-[var(--color-paper-2)] border-[var(--color-border)] hover:border-slate-400'
        }`}>
          <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <button
              on:click={() => togglePaidStatus(item.id)}
              class={`p-2 rounded shrink-0 transition-colors cursor-pointer mt-0.5 sm:mt-0 ${
                item.isPaid ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)]' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
              title={item.isPaid ? t.bills_mark_unpaid : t.bills_mark_paid}
              aria-label={t.bills_toggle_paid}
            >
              <CheckCircle2 class="w-4 h-4" />
            </button>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class={`font-bold text-sm ${item.isPaid ? 'line-through text-[var(--color-ink-muted)]' : 'text-[var(--color-ink)]'}`}>{item.name}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0">
                  {t.bills_due_prefix} {item.dueDate} / {t.bills_per_month}</span>
              </div>
              <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-1 flex items-center gap-2 flex-wrap">
                {#if item.isPaid}
                  <span class="text-[var(--color-accent)] font-semibold">{t.common_paid}</span>
                {:else}
                  <span class="font-semibold text-[var(--color-ink-muted)]">{t.common_unpaid}</span>
                {/if}
                {#if item.notes} • <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] font-mono shrink-0">
            <div class="font-bold text-[var(--color-ink)] text-sm sm:text-base">
              {formatRupiah(item.amount)}
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

      <h2 class="text-base font-bold font-mono text-[var(--color-ink)]">{editingId ? t.edit_bill : t.add_new_bill}</h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-3.5">
        <div>
          <label id="lbl-bill-name" for="inp-bill-name" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.bill_name}</label>
          <input
            id="inp-bill-name"
            type="text"
            bind:value={name}
            placeholder={t.bill_name_placeholder}
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-bill-amount" for="inp-bill-amount" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.bill_amount}</label>
          <input
            id="inp-bill-amount"
            type="number"
            bind:value={amount}
            placeholder="0"
            required
            min="1"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-bill-due" for="inp-bill-due" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.bill_due_label}</label>
          <input
            id="inp-bill-due"
            type="number"
            bind:value={dueDate}
            required
            min="1"
            max="31"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-bill-notes" for="inp-bill-notes" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">{t.notes_label}</label>
          <input
            id="inp-bill-notes"
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
