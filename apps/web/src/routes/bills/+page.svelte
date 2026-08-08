<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate, formatDateNumeric } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { sortWithCustomOrder, saveCustomOrder } from '$lib/order';
  import { CalendarCheck, Plus, Trash2, Edit3, CheckCircle2, RotateCcw, DollarSign, History, GripVertical } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';
  import AmountInput from '$components/AmountInput.svelte';

  $: t = translations[$currentLang];
  const STORAGE_KEY = 'pockt_order_bills';

  interface Bill {
    id: string;
    name: string;
    amount: number;
    remainingAmount?: number;
    dueDate: number;
    isPaid: boolean;
    notes: string | null;
    lastPaidAt: string | null;
  }

  let bills: Bill[] = [];
  let isLoading = true;
  let draggedIndex: number | null = null;

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

  interface Payment {
    id: string;
    amount: number;
    date: string;
    notes: string | null;
  }

  // History modal
  let showHistoryModal = false;
  let historyPayments: Payment[] = [];
  let historyBillName = '';

  async function openHistoryModal(item: Bill) {
    historyBillName = item.name;
    try {
      historyPayments = await fetchApi<Payment[]>(`/bills/${item.id}/payments`);
      showHistoryModal = true;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadBills() {
    isLoading = true;
    try {
      const fetched = await fetchApi<Bill[]>('/bills');
      bills = sortWithCustomOrder(fetched, STORAGE_KEY);
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
    const updated = [...bills];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    bills = updated;
    draggedIndex = index;
    saveCustomOrder(bills, STORAGE_KEY);
  }

  function handleDragEnd() {
    draggedIndex = null;
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
    payAmount = item.remainingAmount ?? item.amount;
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
        class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors shadow-xs cursor-pointer leading-none self-center text-center"
      >
        <Plus class="w-4 h-4 stroke-[3]" />
        <span class="leading-none">{t.add_bill}</span>
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
    <div class="grid gap-2.5" role="list">
      {#each bills as item, index (item.id)}
        {@const remaining = item.remainingAmount ?? item.amount}
        {@const isPartiallyPaid = !item.isPaid && remaining < item.amount}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          role="listitem"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, index)}
          on:dragover={(e) => handleDragOver(e, index)}
          on:dragend={handleDragEnd}
          class={`border rounded-md p-4 space-y-3 transition-all ${
            draggedIndex === index ? 'opacity-40 border-dashed border-[var(--color-accent)]' : ''
          } ${
            item.isPaid
              ? 'bg-[var(--color-paper-2)]/40 border-[var(--color-border)] opacity-75'
              : 'bg-[var(--color-paper-2)] border-[var(--color-border)] hover:border-slate-400'
          }`}
        >
          <div class="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div class="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
              <!-- Drag Handle Icon -->
              <div class="cursor-grab active:cursor-grabbing text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 shrink-0" title="Drag to reorder">
                <GripVertical class="w-4 h-4" />
              </div>

              <div class="min-w-0 flex-1">
                <div class={`font-bold text-sm sm:text-base ${item.isPaid || remaining === 0 ? 'line-through text-[var(--color-ink-muted)]' : 'text-[var(--color-ink)]'}`}>
                  {item.name}
                </div>
                <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-1 flex items-center gap-2 flex-wrap">
                  {#if item.isPaid || remaining === 0}
                    <span class="text-[var(--color-accent)] font-semibold">{t.common_paid}</span>
                  {:else if remaining < item.amount}
                    <span class="text-amber-500 font-semibold">
                      {$currentLang === 'id' ? `DIBAYAR SEBAGIAN (Terbayar ${formatRupiah(item.amount - remaining)})` : `PARTIALLY PAID (${formatRupiah(item.amount - remaining)} paid)`}
                    </span>
                  {:else}
                    <span class="font-semibold text-[var(--color-ink-muted)]">{t.common_unpaid}</span>
                  {/if}
                  {#if item.notes} • <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
                </div>
                <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                  {$currentLang === 'id' ? `Jatuh tempo: Tgl ${item.dueDate} / bulan` : `Due date: Day ${item.dueDate} / month`}
                </div>
              </div>
            </div>

            <div class="text-right font-mono shrink-0">
              <div class="text-xs text-[var(--color-ink-muted)]">
                {$currentLang === 'id' ? 'Sisa Tagihan' : 'Remaining'}
              </div>
              <div class="text-base sm:text-lg font-bold text-[var(--color-ink)]">
                {formatRupiah(remaining)}
              </div>
              {#if remaining < item.amount}
                <div class="text-[10px] text-[var(--color-ink-muted)]">
                  Total: {formatRupiah(item.amount)}
                </div>
              {/if}
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
            <div class="flex items-center gap-2">
              {#if !item.isPaid && remaining > 0}
                <button
                  on:click={() => openPayModal(item)}
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  <DollarSign class="w-3.5 h-3.5" />
                  <span>{$currentLang === 'id' ? 'Bayar / Cicil Tagihan' : 'Pay / Installment'}</span>
                </button>
              {/if}

              <button
                on:click={() => openHistoryModal(item)}
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-3)] rounded-md transition-colors cursor-pointer"
              >
                <History class="w-3.5 h-3.5" />
                <span>{t.history}</span>
              </button>
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
    <AmountInput
      id="inp-bill-amount"
      bind:value={amount}
      label={t.bill_amount}
      placeholder="0"
      required
    />
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
    <AmountInput
      id="inp-pay-bill-amount"
      bind:value={payAmount}
      label={t.pay_amount_label}
      placeholder="0"
      required
    />
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

<!-- History Modal -->
<Modal isOpen={showHistoryModal} title={`${t.debt_history_title} — ${historyBillName}`} onClose={() => (showHistoryModal = false)}>
  {#if historyPayments.length === 0}
    <p class="text-xs font-mono text-[var(--color-ink-muted)] py-6 text-center">{t.no_payments}</p>
  {:else}
    <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
      {#each historyPayments as hp}
        <div class="bg-[var(--color-paper)] p-3 rounded-md flex items-center justify-between text-xs border border-[var(--color-border)] font-mono">
          <div>
            <div class="font-bold text-[var(--color-ink)]">{formatDateNumeric(hp.date)} ({formatDate(hp.date)})</div>
            {#if hp.notes}<div class="text-[var(--color-ink-muted)] text-[11px] font-sans">{hp.notes}</div>{/if}
          </div>
          <div class="font-bold text-[var(--color-accent)]">
            {formatRupiah(hp.amount)}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</Modal>
