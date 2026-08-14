<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate, formatDateNumeric } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { BadgeCheck, CheckCircle2, Trash2, RotateCcw, History, Receipt, HandCoins, CalendarCheck } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';

  $: t = translations[$currentLang];

  interface SettledDebt {
    id: string;
    person: string;
    totalAmount: number;
    remainingAmount: number;
    dueDate: string | null;
    notes: string | null;
    createdAt: string;
    settledAt: string | null;
    totalPaid: number;
    paymentsCount: number;
  }

  interface BillPaymentRecord {
    id: string;
    billId: string;
    billName: string;
    amount: number;
    date: string;
    notes: string | null;
  }

  interface SettledData {
    debts: SettledDebt[];
    billPayments: BillPaymentRecord[];
    totals: {
      settledDebtCount: number;
      settledDebtTotal: number;
      billPaymentsCount: number;
      billPaymentsTotal: number;
    };
  }

  interface Payment {
    id: string;
    amount: number;
    date: string;
    notes: string | null;
  }

  let data: SettledData | null = null;
  let isLoading = true;

  // History modal
  let showHistoryModal = false;
  let historyPayments: Payment[] = [];
  let historyTitle = '';

  async function loadData() {
    isLoading = true;
    try {
      data = await fetchApi<SettledData>('/settled');
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function openHistoryModal(item: SettledDebt) {
    historyTitle = item.person;
    try {
      historyPayments = await fetchApi<Payment[]>(`/debts/${item.id}/payments`);
      showHistoryModal = true;
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRestore(item: SettledDebt) {
    if (!confirm(t.settled_restore_confirm)) return;
    await fetchApi(`/debts/${item.id}/restore`, { method: 'POST' });
    loadData();
  }

  async function handleDelete(item: SettledDebt) {
    if (!confirm(t.settled_delete_confirm)) return;
    await fetchApi(`/debts/${item.id}`, { method: 'DELETE' });
    loadData();
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-5">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div class="flex items-start sm:items-center gap-3 min-w-0">
      <div class="p-2.5 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] border border-[var(--color-border)] rounded-md shrink-0 mt-0.5 sm:mt-0">
        <BadgeCheck class="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.settled_title}</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.settled_subtitle}</p>
      </div>
    </div>

    <button
      on:click={loadData}
      class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs shrink-0 self-center leading-none text-center w-full sm:w-auto"
    >
      <RotateCcw class="w-4 h-4" />
      <span>{t.common_refresh}</span>
    </button>
  </div>

  {#if isLoading && !data}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.settled_loading}</div>
  {:else if data}
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-4 flex flex-col justify-between gap-2 min-w-0">
        <div class="flex items-center justify-between gap-1 text-[var(--color-ink-muted)]">
          <span class="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider min-w-0 truncate">{t.settled_total_debt}</span>
          <HandCoins class="w-4 h-4 text-[var(--color-accent)] shrink-0" />
        </div>
        <div class="text-base sm:text-lg lg:text-xl font-bold font-mono text-[var(--color-ink)] truncate" title={formatRupiah(data.totals.settledDebtTotal)}>
          {formatRupiah(data.totals.settledDebtTotal)}
        </div>
        <div class="text-[10px] font-mono text-[var(--color-ink-muted)]">
          {data.totals.settledDebtCount} {t.settled_count_debts}
        </div>
      </div>

      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-4 flex flex-col justify-between gap-2 min-w-0">
        <div class="flex items-center justify-between gap-1 text-[var(--color-ink-muted)]">
          <span class="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider min-w-0 truncate">{t.settled_total_bills}</span>
          <CalendarCheck class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
        </div>
        <div class="text-base sm:text-lg lg:text-xl font-bold font-mono text-[var(--color-ink)] truncate" title={formatRupiah(data.totals.billPaymentsTotal)}>
          {formatRupiah(data.totals.billPaymentsTotal)}
        </div>
        <div class="text-[10px] font-mono text-[var(--color-ink-muted)]">
          {data.totals.billPaymentsCount} {t.settled_count_bills}
        </div>
      </div>
    </div>

    <!-- Settled Debts Section -->
    <section class="space-y-3">
      <div class="flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
        <CheckCircle2 class="w-4 h-4 text-[var(--color-accent)]" />
        <h2 class="text-base font-bold text-[var(--color-ink)] font-mono">{t.settled_debts_section}</h2>
      </div>

      {#if data.debts.length === 0}
        <div class="p-8 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
          <p class="text-[var(--color-ink-muted)] text-xs font-mono">{t.settled_debts_empty}</p>
        </div>
      {:else}
        <div class="grid gap-2.5" role="list">
          {#each data.debts as item (item.id)}
            <div
              role="listitem"
              class="border rounded-md p-4 space-y-3 bg-[var(--color-paper-2)]/40 border-[var(--color-border)]"
            >
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div class="flex items-start gap-2.5 min-w-0 flex-1">
                  <div class="p-1.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded shrink-0 mt-0.5">
                    <CheckCircle2 class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-bold text-sm sm:text-base text-[var(--color-ink)] truncate line-through decoration-[var(--color-ink-muted)]/50">
                      {item.person}
                    </div>
                    <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-1 flex items-center gap-2 flex-wrap">
                      <span class="text-[var(--color-accent)] font-semibold">{t.common_paid}</span>
                      {#if item.settledAt}
                        • <span>{t.settled_paid_on} {formatDateNumeric(item.settledAt)} ({formatDate(item.settledAt)})</span>
                      {/if}
                      {#if item.notes} • <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
                    </div>
                    <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                      {item.paymentsCount} {t.settled_payments_count} • {t.settled_total_paid} {formatRupiah(item.totalPaid)}
                    </div>
                    {#if item.dueDate}
                      <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">{t.debt_due_prefix} {formatDateNumeric(item.dueDate)}</div>
                    {/if}
                  </div>
                </div>

                <div class="text-left sm:text-right font-mono border-t sm:border-t-0 border-[var(--color-border)]/50 pt-2 sm:pt-0 shrink-0">
                  <div class="text-xs text-[var(--color-ink-muted)]">{t.debt_total_prefix}</div>
                  <div class="text-base sm:text-lg font-bold text-[var(--color-ink)] whitespace-nowrap">{formatRupiah(item.totalAmount)}</div>
                </div>
              </div>

              <div class="pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
                <button
                  on:click={() => openHistoryModal(item)}
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-3)] rounded-md transition-colors cursor-pointer"
                >
                  <History class="w-3.5 h-3.5" />
                  <span>{t.history}</span>
                </button>

                <div class="flex items-center gap-2">
                  <button
                    on:click={() => handleRestore(item)}
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-3)] rounded-md transition-colors cursor-pointer"
                  >
                    <RotateCcw class="w-3.5 h-3.5" />
                    <span>{t.settled_restore}</span>
                  </button>
                  <button
                    on:click={() => handleDelete(item)}
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
    </section>

    <!-- Bill Payments Section -->
    <section class="space-y-3">
      <div class="flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
        <Receipt class="w-4 h-4 text-[var(--color-accent)]" />
        <h2 class="text-base font-bold text-[var(--color-ink)] font-mono">{t.settled_bills_section}</h2>
      </div>

      {#if data.billPayments.length === 0}
        <div class="p-8 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
          <p class="text-[var(--color-ink-muted)] text-xs font-mono">{t.settled_bills_empty}</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each data.billPayments as bp}
            <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-3 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <div class="hidden sm:block p-2 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0">
                  <CalendarCheck class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-[var(--color-ink)] text-sm truncate">{bp.billName}</div>
                  <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                    {formatDateNumeric(bp.date)} ({formatDate(bp.date)}) {#if bp.notes} • <span class="italic font-sans">{bp.notes}</span>{/if}
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0 font-mono">
                <div class="text-sm font-bold text-[var(--color-ink)]">- {formatRupiah(bp.amount)}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<!-- History Modal -->
<Modal isOpen={showHistoryModal} title={`${t.debt_history_title} — ${historyTitle}`} onClose={() => (showHistoryModal = false)}>
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
