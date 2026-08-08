<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { CalendarCheck, Plus, Trash2, Edit3, CheckCircle2, RotateCcw, DollarSign } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';

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

  // Form modal (Create / Edit)
  let showModal = false;
  let editingId: string | null = null;
  let name = '';
  let amount: number | null = null;
  let dueDate = 1;
  let notes = '';

  // Pay modal
  let showPayModal = false;
  let selectedBill: Bill | null = null;
  let payAmount: number | null = null;
  let payDate = new Date().toISOString().split('T')[0];
  let payNotes = '';

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

  function openPayModal(item: Bill) {
    selectedBill = item;
    payAmount = item.amount;
    payDate = new Date().toISOString().split('T')[0];
    payNotes = '';
    showPayModal = true;
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

  async function handlePaySubmit() {
    if (!selectedBill || !payAmount || payAmount <= 0) return;

    await fetchApi(`/bills/${selectedBill.id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(payAmount), date: payDate, notes: payNotes }),
    });

    showPayModal = false;
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
        <div class={`border rounded-md p-4 space-y-3 transition-colors ${
          item.isPaid ? 'bg-[var(--color-paper-2)]/40 border-[var(--color-border)] opacity-75' : 'bg-[var(--color-paper-2)] border-[var(--color-border)] hover:border-slate-400'
        }`}>
          <div class="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
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
                  <span class={`font-bold text-sm sm:text-base ${item.isPaid ? 'line-through text-[var(--color-ink-muted)]' : 'text-[var(--color-ink)]'}`}>{item.name}</span>
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

            <div class="text-right font-mono shrink-0">
              <div class="text-base sm:text-lg font-bold text-[var(--color-ink)]">
                {formatRupiah(item.amount)}
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
            <div class="flex items-center gap-2">
              {#if !item.isPaid}
                <button
                  on:click={() => openPayModal(item)}
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  <DollarSign class="w-3.5 h-3.5" />
                  <span>{$currentLang === 'id' ? 'Bayar Tagihan' : 'Pay Bill'}</span>
                </button>
              {/if}
            </div>

            <div class="flex items-center gap-1">
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

<!-- Modal Form (Create / Edit) -->
<Modal isOpen={showModal} title={editingId ? t.edit_bill : t.add_new_bill} onClose={() => (showModal = false)}>
  <form on:submit|preventDefault={handleSubmit} class="space-y-3.5 font-mono">
    <div>
      <label for="inp-bill-name" class="modal-label">{t.bill_name}</label>
      <input
        id="inp-bill-name"
        type="text"
        bind:value={name}
        placeholder={t.bill_name_placeholder}
        required
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-bill-amount" class="modal-label">{t.bill_amount}</label>
      <input
        id="inp-bill-amount"
        type="number"
        bind:value={amount}
        placeholder="0"
        required
        min="1"
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-bill-due" class="modal-label">{t.bill_due_label}</label>
      <input
        id="inp-bill-due"
        type="number"
        bind:value={dueDate}
        required
        min="1"
        max="31"
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-bill-notes" class="modal-label">{t.notes_label}</label>
      <input
        id="inp-bill-notes"
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

<!-- Pay Modal -->
<Modal isOpen={showPayModal} title={$currentLang === 'id' ? `Bayar Tagihan: ${selectedBill?.name || ''}` : `Pay Bill: ${selectedBill?.name || ''}`} onClose={() => (showPayModal = false)}>
  <form on:submit|preventDefault={handlePaySubmit} class="space-y-3.5 font-mono">
    <div>
      <label for="inp-pay-bill-amount" class="modal-label">{t.pay_amount_label}</label>
      <input
        id="inp-pay-bill-amount"
        type="number"
        bind:value={payAmount}
        required
        min="1"
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-pay-bill-date" class="modal-label">{t.pay_date_label}</label>
      <input
        id="inp-pay-bill-date"
        type="date"
        bind:value={payDate}
        required
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-pay-bill-notes" class="modal-label">{t.notes_label}</label>
      <input
        id="inp-pay-bill-notes"
        type="text"
        bind:value={payNotes}
        placeholder={t.pay_notes_placeholder}
        class="modal-input"
      />
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <button type="button" on:click={() => (showPayModal = false)} class="px-4 py-2 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">{t.common_cancel}</button>
      <button type="submit" class="px-4 py-2 text-xs font-bold text-slate-950 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-md shadow-xs">{t.confirm_payment}</button>
    </div>
  </form>
</Modal>
