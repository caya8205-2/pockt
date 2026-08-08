<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { CalendarCheck, HandCoins, Receipt, Wallet, DollarSign } from 'lucide-svelte';

  $: t = translations[$currentLang];

  interface PaydayData {
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

  async function loadPaydayData() {
    isLoading = true;
    try {
      data = await fetchApi<PaydayData>('/payday');
    } catch (err) {
      console.error('Failed to load payday data:', err);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadPaydayData();
  });
</script>

<div class="space-y-6 max-w-4xl mx-auto">
  <div class="flex items-center gap-3">
    <div class="p-2.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)] rounded-md">
      <Wallet class="w-5 h-5" />
    </div>
    <div>
      <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">{t.payday_title}</h1>
      <p class="text-xs text-[var(--color-ink-muted)]">{t.payday_subtitle}</p>
    </div>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">{t.payday_loading}</div>
  {:else if data}
    <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-6 space-y-6 shadow-xs">
      <div class="flex items-center justify-between pb-5 border-b border-[var(--color-border)]">
        <div>
          <div class="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">{t.payday_total_salary}</div>
          <div class="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--color-ink)] mt-1">
            {formatRupiah(data.salaryReceived)}
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
</div>

