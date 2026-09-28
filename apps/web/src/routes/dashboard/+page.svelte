<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate } from '$lib/format';
  import { currentLang, translations } from '$lib/i18n';
  import { sortItems, type SortOption } from '$lib/sort';
  import { Wallet, Receipt, CalendarCheck, HandCoins, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw } from 'lucide-svelte';
  import SortDropdown from '$components/SortDropdown.svelte';
  import ListLimiter from '$components/ListLimiter.svelte';

  $: t = translations[$currentLang];

  interface DashboardData {
    currentBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    outstandingBills: number;
    outstandingDebt: number;
    freeToSpend: number;
    unpaidBillsCount: number;
    unpaidDebtsCount: number;
  }

  interface TimelineItem {
    id: string;
    type: 'income' | 'expense' | 'bill' | 'debt_payment';
    title: string;
    amount: number;
    date: string;
    category?: string;
    paymentMethod?: string | null;
    debtId?: string | null;
    isPaylater?: boolean | null;
    notes?: string | null;
    status?: string;
  }

  function formatPaylaterLabel(method?: string | null): string {
    if (method === 'GOPAY_LATER') return 'GoPay Later';
    if (method === 'SPAYLATER') return 'SPayLater';
    if (method === 'OTHER_PAYLATER') return 'Paylater';
    if (method === 'DEBIT') return 'Debit';
    if (method === 'TRANSFER') return 'Transfer';
    return method || '';
  }

  let dashboard: DashboardData | null = null;
  let timeline: TimelineItem[] = [];
  let isLoading = true;
  let selectedSort: SortOption = 'date_desc';
  let limit: number = 10;

  async function loadData() {
    isLoading = true;
    try {
      const [dashRes, timeRes] = await Promise.all([
        fetchApi<DashboardData>('/dashboard'),
        fetchApi<TimelineItem[]>('/timeline'),
      ]);
      dashboard = dashRes;
      timeline = timeRes;
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      isLoading = false;
    }
  }

  $: sortedTimeline = sortItems(timeline, selectedSort);
  $: displayedTimeline = sortedTimeline.slice(0, limit);

  onMount(() => {
    loadData();
  });
</script>

<!-- Hallmark Bloom Stat-Led Hero Section -->
<div class="space-y-6">
  {#if isLoading && !dashboard}
    <!-- Skeleton Hero Section -->
    <div class="border border-[var(--color-border)] bg-[var(--color-paper-2)] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs animate-pulse">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3 flex-1">
          <div class="h-3 w-32 bg-[var(--color-paper-3)] rounded"></div>
          <div class="h-12 w-64 bg-[var(--color-paper-3)] rounded"></div>
          <div class="h-3 w-80 bg-[var(--color-paper-3)] rounded"></div>
        </div>
        <div class="w-full lg:w-84 h-32 bg-[var(--color-paper-3)] rounded-xl"></div>
      </div>
    </div>

    <!-- Skeleton Stat Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 animate-pulse">
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 h-24"></div>
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 h-24"></div>
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 h-24"></div>
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 h-24"></div>
    </div>
  {:else if dashboard}
    <section class="border border-[var(--color-border)] bg-[var(--color-paper-2)] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              {t.dash_hero}
            </span>
          </div>

          <div class="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] font-mono tracking-tight">
            {formatRupiah(dashboard.freeToSpend)}
          </div>

          <p class="text-xs text-[var(--color-ink-muted)] max-w-lg leading-relaxed pt-0.5">
            {t.dash_hero_desc}
          </p>
        </div>

        <!-- Financial Equation Card -->
        <div class="w-full lg:w-84 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-xl p-4 space-y-2.5 font-mono text-xs shadow-xs shrink-0">
          <div class="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <div class="flex items-center gap-2">
              <div class="p-1 rounded bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
                <Wallet class="w-3.5 h-3.5" />
              </div>
              <span class="text-[var(--color-ink-muted)]">{t.dash_cash_balance}</span>
            </div>
            <span class="font-bold text-[var(--color-ink)]">{formatRupiah(dashboard.currentBalance)}</span>
          </div>
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <div class="flex items-center gap-2">
              <div class="p-1 rounded bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
                <CalendarCheck class="w-3.5 h-3.5" />
              </div>
              <span>- {t.dash_bills} ({dashboard.unpaidBillsCount})</span>
            </div>
            <span class="font-semibold">{formatRupiah(dashboard.outstandingBills)}</span>
          </div>
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <div class="flex items-center gap-2">
              <div class="p-1 rounded bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
                <HandCoins class="w-3.5 h-3.5" />
              </div>
              <span>- {t.dash_debts} ({dashboard.unpaidDebtsCount})</span>
            </div>
            <span class="font-semibold">{formatRupiah(dashboard.outstandingDebt)}</span>
          </div>
          <div class="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-emerald-700 dark:text-[var(--color-accent)] font-extrabold text-sm">
            <span>= {t.dash_net}</span>
            <span>{formatRupiah(dashboard.freeToSpend)}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Unified Stat Cards Grid (Single Accent Tone, Boxed Icons) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[var(--color-ink-muted)]/40 transition-all min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] min-w-0 truncate">{t.stat_income}</span>
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-[var(--color-accent)] shrink-0">
            <Wallet class="w-4 h-4" />
          </div>
        </div>
        <div class="text-base sm:text-lg lg:text-xl font-extrabold font-mono text-[var(--color-ink)] truncate" title={formatRupiah(dashboard.monthlyIncome)}>
          {formatRupiah(dashboard.monthlyIncome)}
        </div>
      </div>

      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[var(--color-ink-muted)]/40 transition-all min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] min-w-0 truncate">{t.stat_expenses}</span>
          <div class="p-2 rounded-lg bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] shrink-0">
            <Receipt class="w-4 h-4" />
          </div>
        </div>
        <div class="text-base sm:text-lg lg:text-xl font-extrabold font-mono text-[var(--color-ink)] truncate" title={formatRupiah(dashboard.monthlyExpenses)}>
          {formatRupiah(dashboard.monthlyExpenses)}
        </div>
      </div>

      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[var(--color-ink-muted)]/40 transition-all min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] min-w-0 truncate">{t.stat_bills}</span>
          <div class="p-2 rounded-lg bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] shrink-0">
            <CalendarCheck class="w-4 h-4" />
          </div>
        </div>
        <div class="text-base sm:text-lg lg:text-xl font-extrabold font-mono text-[var(--color-ink)] truncate" title={formatRupiah(dashboard.outstandingBills)}>
          {formatRupiah(dashboard.outstandingBills)}
        </div>
      </div>

      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[var(--color-ink-muted)]/40 transition-all min-w-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] min-w-0 truncate">{t.stat_debt}</span>
          <div class="p-2 rounded-lg bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] shrink-0">
            <HandCoins class="w-4 h-4" />
          </div>
        </div>
        <div class="text-base sm:text-lg lg:text-xl font-extrabold font-mono text-[var(--color-ink)] truncate" title={formatRupiah(dashboard.outstandingDebt)}>
          {formatRupiah(dashboard.outstandingDebt)}
        </div>
      </div>
    </div>
  {/if}

  <!-- Timeline Feed Section -->
  <section class="space-y-3">
    <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-3 flex-wrap gap-2">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-[var(--color-paper-3)] text-emerald-700 dark:text-[var(--color-accent)]">
          <Clock class="w-4 h-4" />
        </div>
        <h2 class="text-base font-bold text-[var(--color-ink)] font-mono">{t.timeline_feed}</h2>
      </div>

      <div class="flex items-center gap-2">
        <SortDropdown bind:value={selectedSort} mode="standard" size="sm" allowCustom={false} />
        <button
          on:click={loadData}
          class="h-[30px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-mono font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md transition-colors cursor-pointer shadow-xs leading-none"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>{t.common_refresh}</span>
        </button>
      </div>
    </div>

    {#if isLoading}
      <div class="p-8 text-center text-[var(--color-ink-muted)] text-xs font-mono">{t.dash_loading_timeline}</div>
    {:else if sortedTimeline.length === 0}
      <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-xl space-y-1">
        <p class="text-[var(--color-ink)] font-semibold text-sm">{t.dash_no_transactions}</p>
        <p class="text-xs text-[var(--color-ink-muted)]">{t.dash_no_transactions_hint}</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each displayedTimeline as item}
          <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] hover:border-[var(--color-ink-muted)]/40 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3.5 transition-all shadow-xs">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              {#if item.type === 'income'}
                <div class="p-2 bg-emerald-500/10 text-emerald-700 dark:text-[var(--color-accent)] rounded-lg shrink-0">
                  <ArrowDownLeft class="w-4 h-4" />
                </div>
              {:else if item.type === 'expense'}
                <div class="p-2 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded-lg shrink-0">
                  <ArrowUpRight class="w-4 h-4" />
                </div>
              {:else if item.type === 'bill'}
                <div class="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <CalendarCheck class="w-4 h-4" />
                </div>
              {:else}
                <div class="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                  <HandCoins class="w-4 h-4" />
                </div>
              {/if}

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 min-w-0 flex-wrap">
                  <span class="font-bold text-[var(--color-ink)] text-sm truncate">{item.title}</span>
                  {#if item.category}
                    <span class="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded-md shrink-0 whitespace-nowrap">
                      {item.category}
                    </span>
                  {/if}
                  {#if item.paymentMethod && item.paymentMethod !== 'CASH'}
                    <span class={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md shrink-0 whitespace-nowrap ${
                      item.isPaylater || ['GOPAY_LATER', 'SPAYLATER', 'OTHER_PAYLATER'].includes(item.paymentMethod)
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]'
                    }`}>
                      {formatPaylaterLabel(item.paymentMethod)}
                    </span>
                  {/if}
                </div>
                <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                  {formatDate(item.date)} {#if item.notes} • <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
                </div>
              </div>
            </div>

            <div class="text-right shrink-0 font-mono">
              <div class={`text-sm sm:text-base font-bold ${
                item.type === 'income' ? 'text-emerald-700 dark:text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
              }`}>
                {item.type === 'income' ? '+' : '-'}{formatRupiah(item.amount)}
              </div>
              <div class="text-[10px] uppercase font-bold tracking-wider text-[var(--color-ink-muted)] mt-0.5">
                {item.type === 'income' ? t.type_income : item.type === 'expense' ? t.type_expense : item.type === 'bill' ? t.type_bill : t.type_debt_payment}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <ListLimiter
        totalItems={sortedTimeline.length}
        bind:limit
        defaultLimit={10}
        step={10}
        label={$currentLang === 'id' ? 'transaksi timeline' : 'timeline items'}
      />
    {/if}
  </section>
</div>
