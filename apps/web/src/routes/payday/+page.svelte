<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah } from '$lib/format';
  import { CalendarCheck, HandCoins, Receipt, Wallet } from 'lucide-svelte';

  interface PaydayData {
    salaryReceived: number;
    billsTotal: number;
    debtDueTotal: number;
    spentTotal: number;
    freeToSpend: number;
    unpaidBills: any[];
    unpaidDebts: any[];
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
      <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">Payday Planning Overview</h1>
      <p class="text-xs text-[var(--color-ink-muted)]">Ringkasan alokasi dana bulanan instan setiap kali gaji diterima.</p>
    </div>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">Memuat kalkulasi Payday...</div>
  {:else if data}
    <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-6 space-y-6 shadow-xs">
      <div class="flex items-center justify-between pb-5 border-b border-[var(--color-border)]">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded-md">
            <Wallet class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Total Gaji / Pemasukan Bulan Ini</div>
            <div class="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--color-ink)] mt-1">
              {formatRupiah(data.salaryReceived)}
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Kewajiban & Komitmen Terjadwal</div>

        <div class="grid gap-2.5 font-mono">
          <div class="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <CalendarCheck class="w-4 h-4 text-[var(--color-ink-muted)]" />
              <div>
                <div class="text-sm font-bold text-[var(--color-ink)]">Tagihan Bulanan (Bills)</div>
                <div class="text-xs text-[var(--color-ink-muted)]">{data.unpaidBills.length} tagihan belum dibayar</div>
              </div>
            </div>
            <div class="text-base font-bold text-[var(--color-ink)]">
              - {formatRupiah(data.billsTotal)}
            </div>
          </div>

          <div class="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <HandCoins class="w-4 h-4 text-[var(--color-ink-muted)]" />
              <div>
                <div class="text-sm font-bold text-[var(--color-ink)]">Pokok / Angsuran Hutang</div>
                <div class="text-xs text-[var(--color-ink-muted)]">{data.unpaidDebts.length} catatan hutang aktif</div>
              </div>
            </div>
            <div class="text-base font-bold text-[var(--color-ink)]">
              - {formatRupiah(data.debtDueTotal)}
            </div>
          </div>

          <div class="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md p-3.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Receipt class="w-4 h-4 text-[var(--color-ink-muted)]" />
              <div>
                <div class="text-sm font-bold text-[var(--color-ink)]">Pengeluaran Terjadi (Spent)</div>
                <div class="text-xs text-[var(--color-ink-muted)]">Total belanja bulan ini</div>
              </div>
            </div>
            <div class="text-base font-bold text-[var(--color-ink)]">
              - {formatRupiah(data.spentTotal)}
            </div>
          </div>
        </div>
      </div>

      <div class="pt-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-accent-subtle)] p-5 rounded-md border border-[var(--color-border)]">
        <div>
          <div class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent)]">Hasil Akhir: Net Disposable Income</div>
          <div class="text-xs text-[var(--color-ink-muted)] mt-0.5">Dana bersih bebas yang aman dipakai belanja atau ditabung.</div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-accent)]">
          {formatRupiah(data.freeToSpend)}
        </div>
      </div>
    </div>
  {/if}
</div>
