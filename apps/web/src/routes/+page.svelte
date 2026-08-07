<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate } from '$lib/format';
  import { Wallet, Receipt, CalendarCheck, HandCoins, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw } from 'lucide-svelte';

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
    notes?: string | null;
    status?: string;
  }

  let dashboard: DashboardData | null = null;
  let timeline: TimelineItem[] = [];
  let isLoading = true;

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

  onMount(() => {
    loadData();
  });
</script>

<!-- Hallmark Bloom Stat-Led Hero Section -->
<div class="space-y-6">
  {#if dashboard}
    <section class="border border-[var(--color-border)] bg-[var(--color-paper-2)] rounded-md p-6 space-y-6 shadow-xs">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Free to Spend (Net Disposable Income)
          </div>

          <div class="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] font-mono tracking-tight">
            {formatRupiah(dashboard.freeToSpend)}
          </div>

          <p class="text-xs text-[var(--color-ink-muted)] max-w-lg leading-relaxed">
            Sisa uang yang aman dibelanjakan hari ini setelah memperhitungkan saldo saat ini, tagihan berjalan, dan sisa pokok hutang.
          </p>
        </div>

        <!-- Financial Equation Card -->
        <div class="w-full lg:w-80 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 space-y-2 font-mono text-xs">
          <div class="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]">
            <span class="text-[var(--color-ink-muted)]">Total Saldo Kas</span>
            <span class="font-bold">{formatRupiah(dashboard.currentBalance)}</span>
          </div>
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span>- Tagihan ({dashboard.unpaidBillsCount})</span>
            <span class="font-semibold">{formatRupiah(dashboard.outstandingBills)}</span>
          </div>
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span>- Sisa Hutang ({dashboard.unpaidDebtsCount})</span>
            <span class="font-semibold">{formatRupiah(dashboard.outstandingDebt)}</span>
          </div>
          <div class="pt-1.5 border-t border-[var(--color-border)] flex items-center justify-between text-[var(--color-accent)] font-bold">
            <span>= Net Disposable</span>
            <span>{formatRupiah(dashboard.freeToSpend)}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Unified Stat Cards Grid (Single Accent Tone) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-4 space-y-1">
        <div class="flex items-start justify-between gap-2 text-[var(--color-ink-muted)]">
          <span class="text-xs font-mono font-semibold uppercase tracking-wider min-w-0">Pemasukan Bulan Ini</span>
          <Wallet class="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
        </div>
        <div class="text-lg sm:text-xl font-bold font-mono text-[var(--color-ink)]">
          {formatRupiah(dashboard.monthlyIncome)}
        </div>
      </div>

      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-4 space-y-1">
        <div class="flex items-start justify-between gap-2 text-[var(--color-ink-muted)]">
          <span class="text-xs font-mono font-semibold uppercase tracking-wider min-w-0">Pengeluaran Bulan Ini</span>
          <Receipt class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-0.5" />
        </div>
        <div class="text-lg sm:text-xl font-bold font-mono text-[var(--color-ink)]">
          {formatRupiah(dashboard.monthlyExpenses)}
        </div>
      </div>

      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-4 space-y-1">
        <div class="flex items-start justify-between gap-2 text-[var(--color-ink-muted)]">
          <span class="text-xs font-mono font-semibold uppercase tracking-wider min-w-0">Tagihan Belum Lunas</span>
          <CalendarCheck class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-0.5" />
        </div>
        <div class="text-lg sm:text-xl font-bold font-mono text-[var(--color-ink)]">
          {formatRupiah(dashboard.outstandingBills)}
        </div>
      </div>

      <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-4 space-y-1">
        <div class="flex items-start justify-between gap-2 text-[var(--color-ink-muted)]">
          <span class="text-xs font-mono font-semibold uppercase tracking-wider min-w-0">Total Sisa Hutang</span>
          <HandCoins class="w-4 h-4 text-[var(--color-ink-muted)] shrink-0 mt-0.5" />
        </div>
        <div class="text-lg sm:text-xl font-bold font-mono text-[var(--color-ink)]">
          {formatRupiah(dashboard.outstandingDebt)}
        </div>
      </div>
    </div>
  {/if}

  <!-- Timeline Feed Section -->
  <section class="space-y-3">
    <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-[var(--color-accent)]" />
        <h2 class="text-base font-bold text-[var(--color-ink)] font-mono">Timeline Alur Keuangan</h2>
      </div>

      <button
        on:click={loadData}
        class="flex items-center gap-1.5 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Refresh</span>
      </button>
    </div>

    {#if isLoading}
      <div class="p-8 text-center text-[var(--color-ink-muted)] text-xs font-mono">Memuat timeline...</div>
    {:else if timeline.length === 0}
      <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
        <p class="text-[var(--color-ink)] font-semibold text-sm">Belum Ada Transaksi</p>
        <p class="text-xs text-[var(--color-ink-muted)]">Klik "Catat Transaksi" untuk menambahkan catatan pertama.</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each timeline as item}
          <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] hover:border-slate-400 rounded-md p-3 flex items-center justify-between gap-4 transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              {#if item.type === 'income'}
                <div class="p-2 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded shrink-0">
                  <ArrowDownLeft class="w-4 h-4" />
                </div>
              {:else if item.type === 'expense'}
                <div class="p-2 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0">
                  <ArrowUpRight class="w-4 h-4" />
                </div>
              {:else if item.type === 'bill'}
                <div class="p-2 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0">
                  <CalendarCheck class="w-4 h-4" />
                </div>
              {:else}
                <div class="p-2 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0">
                  <HandCoins class="w-4 h-4" />
                </div>
              {/if}

              <div class="min-w-0">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-bold text-[var(--color-ink)] text-sm truncate">{item.title}</span>
                  {#if item.category}
                    <span class="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] rounded shrink-0 whitespace-nowrap">
                      {item.category}
                    </span>
                  {/if}
                </div>
                <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                  {formatDate(item.date)} {#if item.notes} • <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
                </div>
              </div>
            </div>

            <div class="text-right shrink-0 font-mono">
              <div class={`text-sm font-bold ${
                item.type === 'income' ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
              }`}>
                {item.type === 'income' ? '+' : '-'}{formatRupiah(item.amount)}
              </div>
              <div class="text-[10px] uppercase font-bold tracking-wider text-[var(--color-ink-muted)] mt-0.5">
                {item.type.replace('_', ' ')}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
