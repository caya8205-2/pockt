<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { HandCoins, Plus, Trash2, Edit3, DollarSign, History } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';

  $: t = translations[$currentLang];

  interface Debt {
    id: string;
    person: string;
    totalAmount: number;
    remainingAmount: number;
    dueDate: string | null;
    isPaid: boolean;
    notes: string | null;
  }

  interface Payment {
    id: string;
    amount: number;
    date: string;
    notes: string | null;
  }

  let debts: Debt[] = [];
  let isLoading = true;

  // Form modal
  let showModal = false;
  let editingId: string | null = null;
  let person = '';
  let totalAmount: number | null = null;
  let dueDate = '';
  let notes = '';

  // Pay modal
  let showPayModal = false;
  let selectedDebtId: string | null = null;
  let payAmount: number | null = null;
  let payDate = new Date().toISOString().split('T')[0];
  let payNotes = '';

  // History modal
  let showHistoryModal = false;
  let historyPayments: Payment[] = [];
  let historyPerson = '';

  async function loadDebts() {
    isLoading = true;
    try {
      debts = await fetchApi<Debt[]>('/debts');
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingId = null;
    person = '';
    totalAmount = null;
    dueDate = '';
    notes = '';
    showModal = true;
  }

  function openEditModal(item: Debt) {
    editingId = item.id;
    person = item.person;
    totalAmount = item.totalAmount;
    dueDate = item.dueDate || '';
    notes = item.notes || '';
    showModal = true;
  }

  function openPayModal(item: Debt) {
    selectedDebtId = item.id;
    payAmount = item.remainingAmount;
    payDate = new Date().toISOString().split('T')[0];
    payNotes = '';
    showPayModal = true;
  }

  async function openHistoryModal(item: Debt) {
    historyPerson = item.person;
    try {
      historyPayments = await fetchApi<Payment[]>(`/debts/${item.id}/payments`);
      showHistoryModal = true;
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit() {
    if (!person || !totalAmount || totalAmount <= 0) return;

    if (editingId) {
      await fetchApi(`/debts/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ person, totalAmount: Number(totalAmount), dueDate, notes }),
      });
    } else {
      await fetchApi('/debts', {
        method: 'POST',
        body: JSON.stringify({ person, totalAmount: Number(totalAmount), dueDate, notes }),
      });
    }

    showModal = false;
    loadDebts();
  }

  async function handlePaySubmit() {
    if (!selectedDebtId || !payAmount || payAmount <= 0) return;

    await fetchApi(`/debts/${selectedDebtId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(payAmount), date: payDate, notes: payNotes }),
    });

    showPayModal = false;
    loadDebts();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.delete_debt_confirm)) return;
    await fetchApi(`/debts/${id}`, { method: 'DELETE' });
    loadDebts();
  }

  onMount(() => {
    loadDebts();
  });
</script>

<div class="space-y-5">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div class="flex items-start sm:items-center gap-3 min-w-0">
      <div class="p-2.5 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] border border-[var(--color-border)] rounded-md shrink-0 mt-0.5 sm:mt-0">
        <HandCoins class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.debts_title}</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.debts_subtitle}</p>
      </div>
    </div>

    <button
      on:click={openCreateModal}
      class="flex items-center justify-center gap-2 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs shrink-0 w-full sm:w-auto"
    >
      <Plus class="w-4 h-4 stroke-[3]" />
      <span>{t.add_debt}</span>
    </button>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.debts_loading}</div>
  {:else if debts.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
      <p class="text-[var(--color-ink)] font-semibold text-sm">{t.no_debts}</p>
    </div>
  {:else}
    <div class="grid gap-2.5">
      {#each debts as item}
        <div class={`border rounded-md p-4 space-y-3 transition-colors ${
          item.isPaid ? 'bg-[var(--color-paper-2)]/40 border-[var(--color-border)] opacity-75' : 'bg-[var(--color-paper-2)] border-[var(--color-border)] hover:border-slate-400'
        }`}>
          <div class="flex items-center justify-between gap-3 sm:gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                <span class="font-bold text-sm sm:text-base text-[var(--color-ink)] truncate">{item.person}</span>
                {#if item.isPaid}
                  <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)] rounded shrink-0 whitespace-nowrap">
                    {t.common_paid}
                  </span>
                {/if}
              </div>
              {#if item.notes}
                <div class="text-xs text-[var(--color-ink-muted)] mt-0.5 truncate">{item.notes}</div>
              {/if}
              {#if item.dueDate}
                <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">{t.debt_due_prefix} {formatDate(item.dueDate)}</div>
              {/if}
            </div>

            <div class="text-right font-mono shrink-0">
              <div class="text-xs text-[var(--color-ink-muted)]">{t.debt_remaining}</div>
              <div class="text-base sm:text-lg font-bold text-[var(--color-ink)] whitespace-nowrap">{formatRupiah(item.remainingAmount)}</div>
              <div class="text-[10px] text-[var(--color-ink-muted)] whitespace-nowrap">{t.debt_total_prefix} {formatRupiah(item.totalAmount)}</div>
            </div>
          </div>

          <div class="pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
            <div class="flex items-center gap-2">
              {#if !item.isPaid}
                <button
                  on:click={() => openPayModal(item)}
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  <DollarSign class="w-3.5 h-3.5" />
                  <span>{t.pay_installment}</span>
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

<!-- Modal Form -->
<Modal isOpen={showModal} title={editingId ? t.edit_debt : t.add_new_debt} onClose={() => (showModal = false)}>
  <form on:submit|preventDefault={handleSubmit} class="space-y-3.5 font-mono">
    <div>
      <label for="inp-dbt-person" class="modal-label">{t.debtor_name}</label>
      <input
        id="inp-dbt-person"
        type="text"
        bind:value={person}
        placeholder={t.debtor_placeholder}
        required
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-dbt-amount" class="modal-label">{t.debt_total_label}</label>
      <input
        id="inp-dbt-amount"
        type="number"
        bind:value={totalAmount}
        placeholder="0"
        required
        min="1"
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-dbt-date" class="modal-label">{t.debt_due_label}</label>
      <input
        id="inp-dbt-date"
        type="date"
        bind:value={dueDate}
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-dbt-notes" class="modal-label">{t.notes_label}</label>
      <input
        id="inp-dbt-notes"
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
<Modal isOpen={showPayModal} title={t.pay_title} onClose={() => (showPayModal = false)}>
  <form on:submit|preventDefault={handlePaySubmit} class="space-y-3.5 font-mono">
    <div>
      <label for="inp-pay-amount" class="modal-label">{t.pay_amount_label}</label>
      <input
        id="inp-pay-amount"
        type="number"
        bind:value={payAmount}
        required
        min="1"
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-pay-date" class="modal-label">{t.pay_date_label}</label>
      <input
        id="inp-pay-date"
        type="date"
        bind:value={payDate}
        required
        class="modal-input"
      />
    </div>
    <div>
      <label for="inp-pay-notes" class="modal-label">{t.notes_label}</label>
      <input
        id="inp-pay-notes"
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
<Modal isOpen={showHistoryModal} title={`${t.debt_history_title} — ${historyPerson}`} onClose={() => (showHistoryModal = false)}>
  {#if historyPayments.length === 0}
    <p class="text-xs font-mono text-[var(--color-ink-muted)] py-6 text-center">{t.no_payments}</p>
  {:else}
    <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
      {#each historyPayments as hp}
        <div class="bg-[var(--color-paper)] p-3 rounded-md flex items-center justify-between text-xs border border-[var(--color-border)] font-mono">
          <div>
            <div class="font-bold text-[var(--color-ink)]">{formatDate(hp.date)}</div>
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
