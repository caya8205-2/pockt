<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { CalendarCheck, HandCoins, Receipt, Wallet, DollarSign, Settings, Calendar } from 'lucide-svelte';
  import Modal from '$components/Modal.svelte';

  $: t = translations[$currentLang];

  interface PaydayData {
    paydayDate: number;
    cycleStart: string;
    cycleEnd: string;
    salaryReceived: number;
    billsTotal: number;
    debtPaidThisMonth: number;
    debtDueThisMonth: number;
    debtPaidCount: number;
    debtDueCount: number;
    spentTotal: number;
    freeToSpend: number;
    unpaidBills: any[];
    dueDebtsThisMonth: any[];
  }

  let data: PaydayData | null = null;
  let isLoading = true;

  // Setting modal
  let showSettingsModal = false;
  let newPaydayDate = 5;
  let isSavingSettings = false;

  async function loadPaydayData() {
    isLoading = true;
    try {
      data = await fetchApi<PaydayData>('/payday');
      if (data) {
        newPaydayDate = data.paydayDate || 5;
      }
    } catch (err) {
      console.error('Failed to load payday data:', err);
    } finally {
      isLoading = false;
    }
  }

  async function handleSaveSettings() {
    if (newPaydayDate < 1 || newPaydayDate > 31) return;
    isSavingSettings = true;
    try {
      await fetchApi('/user/settings', {
        method: 'PUT',
        body: JSON.stringify({ paydayDate: Number(newPaydayDate) }),
      });
      showSettingsModal = false;
      await loadPaydayData();
    } catch (err) {
      console.error(err);
    } finally {
      isSavingSettings = false;
    }
  }

  onMount(() => {
    loadPaydayData();
  });
</script>

<div class="space-y-6 max-w-4xl mx-auto">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="p-2.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)] rounded-md">
        <Wallet class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.payday_title}</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.payday_subtitle}</p>
      </div>
    </div>

    {#if data}
      <button
        on:click={() => { newPaydayDate = data.paydayDate; showSettingsModal = true; }}
        class="flex items-center gap-2 px-3 py-2 bg-[var(--color-paper-2)] hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink)] text-xs font-mono font-bold rounded-md transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
      >
        <Settings class="w-3.5 h-3.5 text-[var(--color-accent)]" />
        <span>{t.payday_change_date} ({data.paydayDate})</span>
      </button>
    {/if}
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.payday_loading}</div>
  {:else if data}
    <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-6 space-y-6 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--color-border)]">
        <div>
          <div class="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">{t.payday_total_salary}</div>
          <div class="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--color-ink)] mt-1">
            {formatRupiah(data.salaryReceived)}
          </div>
        </div>

        <div class="flex items-center gap-2.5 px-3.5 py-2.5 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-xs font-mono shrink-0">
          <Calendar class="w-4 h-4 text-[var(--color-accent)] shrink-0" />
          <div>
            <span class="text-[var(--color-ink-muted)]">{t.payday_cycle_badge}: </span>
            <span class="font-bold text-[var(--color-ink)]">{formatDate(data.cycleStart)} – {formatDate(data.cycleEnd)}</span>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">{t.payday_scheduled}</div>

        <div class="grid gap-2.5 font-mono">
          <div class="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <CalendarCheck class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-0.5 sm:mt-0" />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-bold text-[var(--color-ink)]">{t.payday_bills}</div>
                <div class="text-xs text-[var(--color-ink-muted)]">{data.unpaidBills.length} {t.payday_unpaid_bills}</div>
              </div>
            </div>
            <div class="text-sm sm:text-base font-bold text-[var(--color-ink)] shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] text-right">
              - {formatRupiah(data.billsTotal)}
            </div>
          </div>

          <div class="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <DollarSign class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-0.5 sm:mt-0" />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-bold text-[var(--color-ink)]">{t.payday_debts_paid_this_month}</div>
                <div class="text-xs text-[var(--color-ink-muted)]">{data.debtPaidCount} {t.payday_payments_made}</div>
              </div>
            </div>
            <div class="text-sm sm:text-base font-bold text-[var(--color-ink)] shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] text-right">
              - {formatRupiah(data.debtPaidThisMonth)}
            </div>
          </div>

          <div class="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <HandCoins class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-0.5 sm:mt-0" />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-bold text-[var(--color-ink)]">{t.payday_debts_due_this_month}</div>
                <div class="text-xs text-[var(--color-ink-muted)]">{data.debtDueCount} {t.payday_due_debts_count}</div>
              </div>
            </div>
            <div class="text-sm sm:text-base font-bold text-[var(--color-ink)] shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] text-right">
              - {formatRupiah(data.debtDueThisMonth)}
            </div>
          </div>

          <div class="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <Receipt class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-0.5 sm:mt-0" />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-bold text-[var(--color-ink)]">{t.payday_spent}</div>
                <div class="text-xs text-[var(--color-ink-muted)]">{t.payday_spent_this_month}</div>
              </div>
            </div>
            <div class="text-sm sm:text-base font-bold text-[var(--color-ink)] shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] text-right">
              - {formatRupiah(data.spentTotal)}
            </div>
          </div>
        </div>
      </div>

      <div class="pt-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-accent-subtle)] p-5 rounded-md border border-[var(--color-border)]">
        <div>
          <div class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent)]">{t.payday_final_net}</div>
          <div class="text-xs text-[var(--color-ink-muted)] mt-0.5">{t.payday_net_desc}</div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-accent)]">
          {formatRupiah(data.freeToSpend)}
        </div>
      </div>
    </div>
  {/if}

  {#if showSettingsModal}
    <Modal title={t.payday_date_modal_title} on:close={() => (showSettingsModal = false)}>
      <form on:submit|preventDefault={handleSaveSettings} class="space-y-4 font-mono text-xs">
        <div>
          <label class="block text-[var(--color-ink-muted)] mb-1" for="paydayDateInput">{t.payday_date_label}</label>
          <input
            id="paydayDateInput"
            type="number"
            min="1"
            max="31"
            bind:value={newPaydayDate}
            class="w-full bg-[var(--color-paper)] border border-[var(--color-border)] rounded px-3 py-2 text-[var(--color-ink)] text-sm font-bold focus:outline-none focus:border-[var(--color-accent)]"
            required
          />
          <p class="text-[11px] text-[var(--color-ink-muted)] mt-1.5 leading-relaxed font-sans">{t.payday_date_hint}</p>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            on:click={() => (showSettingsModal = false)}
            class="px-3.5 py-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] cursor-pointer"
          >
            {t.common_cancel}
          </button>
          <button
            type="submit"
            disabled={isSavingSettings}
            class="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-bold rounded cursor-pointer transition-colors"
          >
            {isSavingSettings ? t.common_saving : t.common_save}
          </button>
        </div>
      </form>
    </Modal>
  {/if}
</div>

