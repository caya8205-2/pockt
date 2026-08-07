<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate } from '$lib/format';
  import { HandCoins, Plus, Trash2, Edit3, DollarSign, History, X } from 'lucide-svelte';

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
    if (!confirm('Hapus catatan hutang ini?')) return;
    await fetchApi(`/debts/${id}`, { method: 'DELETE' });
    loadDebts();
  }

  onMount(() => {
    loadDebts();
  });
</script>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-2.5 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] border border-[var(--color-border)] rounded-md">
        <HandCoins class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">Catatan Hutang & Pinjaman</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">Pantau kewajiban hutang kepada pihak lain dan riwayat pelunasan.</p>
      </div>
    </div>

    <button
      on:click={openCreateModal}
      class="flex items-center gap-2 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-mono font-bold text-xs rounded-md transition-colors shadow-xs cursor-pointer"
    >
      <Plus class="w-4 h-4 stroke-[3]" />
      <span>Catat Hutang Baru</span>
    </button>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">Memuat catatan hutang...</div>
  {:else if debts.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
      <p class="text-[var(--color-ink)] font-semibold text-sm">Belum Ada Catatan Hutang</p>
    </div>
  {:else}
    <div class="grid gap-2.5">
      {#each debts as item}
        <div class={`border rounded-md p-4 space-y-3 transition-colors ${
          item.isPaid ? 'bg-[var(--color-paper-2)]/40 border-[var(--color-border)] opacity-75' : 'bg-[var(--color-paper-2)] border-[var(--color-border)] hover:border-slate-400'
        }`}>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm sm:text-base text-[var(--color-ink)]">{item.person}</span>
                {#if item.isPaid}
                  <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)] rounded">
                    LUNAS
                  </span>
                {/if}
              </div>
              {#if item.notes}
                <div class="text-xs text-[var(--color-ink-muted)] mt-0.5">{item.notes}</div>
              {/if}
              {#if item.dueDate}
                <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">Jatuh tempo: {formatDate(item.dueDate)}</div>
              {/if}
            </div>

            <div class="text-right font-mono">
              <div class="text-xs text-[var(--color-ink-muted)]">Sisa Pokok:</div>
              <div class="text-base sm:text-lg font-bold text-[var(--color-ink)]">{formatRupiah(item.remainingAmount)}</div>
              <div class="text-[10px] text-[var(--color-ink-muted)]">Total: {formatRupiah(item.totalAmount)}</div>
            </div>
          </div>

          <div class="pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
            <div class="flex items-center gap-2">
              {#if !item.isPaid}
                <button
                  on:click={() => openPayModal(item)}
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-md transition-colors cursor-pointer"
                >
                  <DollarSign class="w-3.5 h-3.5" />
                  <span>Bayar / Angsur</span>
                </button>
              {/if}

              <button
                on:click={() => openHistoryModal(item)}
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-3)] rounded-md transition-colors cursor-pointer"
              >
                <History class="w-3.5 h-3.5" />
                <span>Riwayat</span>
              </button>
            </div>

            <div class="flex items-center gap-1">
              <button
                on:click={() => openEditModal(item)}
                class="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded transition-colors cursor-pointer"
                aria-label="Edit"
              >
                <Edit3 class="w-4 h-4" />
              </button>
              <button
                on:click={() => handleDelete(item.id)}
                class="p-1.5 text-[var(--color-ink-muted)] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                aria-label="Hapus"
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
      <button on:click={() => (showModal = false)} class="absolute top-4 right-4 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer" aria-label="Tutup">
        <X class="w-5 h-5" />
      </button>

      <h2 class="text-base font-bold font-mono text-[var(--color-ink)]">{editingId ? 'Edit Catatan Hutang' : 'Tambah Catatan Hutang'}</h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-3.5">
        <div>
          <label id="lbl-dbt-person" for="inp-dbt-person" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Nama Pihak yang Diutangi</label>
          <input
            id="inp-dbt-person"
            type="text"
            bind:value={person}
            placeholder="mis. Budi / Pinjaman Bank"
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-dbt-amount" for="inp-dbt-amount" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Total Nominal Hutang (Rp)</label>
          <input
            id="inp-dbt-amount"
            type="number"
            bind:value={totalAmount}
            placeholder="0"
            required
            min="1"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-dbt-date" for="inp-dbt-date" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Tanggal Jatuh Tempo (Opsional)</label>
          <input
            id="inp-dbt-date"
            type="date"
            bind:value={dueDate}
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-dbt-notes" for="inp-dbt-notes" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Catatan</label>
          <input
            id="inp-dbt-notes"
            type="text"
            bind:value={notes}
            placeholder="Opsional..."
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" on:click={() => (showModal = false)} class="px-4 py-2 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">Batal</button>
          <button type="submit" class="px-4 py-2 text-xs font-mono font-bold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-md">Simpan</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Pay Modal -->
{#if showPayModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-paper)]/85 backdrop-blur-md">
    <div class="w-full max-w-md bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-6 space-y-4 shadow-xl relative">
      <button on:click={() => (showPayModal = false)} class="absolute top-4 right-4 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer" aria-label="Tutup">
        <X class="w-5 h-5" />
      </button>

      <h2 class="text-base font-bold font-mono text-[var(--color-ink)]">Catat Pembayaran Hutang</h2>
      <form on:submit|preventDefault={handlePaySubmit} class="space-y-3.5">
        <div>
          <label id="lbl-pay-amount" for="inp-pay-amount" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Nominal Pembayaran (Rp)</label>
          <input
            id="inp-pay-amount"
            type="number"
            bind:value={payAmount}
            required
            min="1"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-pay-date" for="inp-pay-date" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Tanggal Pembayaran</label>
          <input
            id="inp-pay-date"
            type="date"
            bind:value={payDate}
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-pay-notes" for="inp-pay-notes" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Catatan</label>
          <input
            id="inp-pay-notes"
            type="text"
            bind:value={payNotes}
            placeholder="mis. Angsuran ke-1"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" on:click={() => (showPayModal = false)} class="px-4 py-2 text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">Batal</button>
          <button type="submit" class="px-4 py-2 text-xs font-mono font-bold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-md">Konfirmasi Pembayaran</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- History Modal -->
{#if showHistoryModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-paper)]/85 backdrop-blur-md">
    <div class="w-full max-w-md bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-6 space-y-4 shadow-xl relative">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold font-mono text-[var(--color-ink)]">Riwayat Angsuran — {historyPerson}</h2>
        <button on:click={() => (showHistoryModal = false)} class="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer" aria-label="Tutup">
          <X class="w-5 h-5" />
        </button>
      </div>

      {#if historyPayments.length === 0}
        <p class="text-xs font-mono text-[var(--color-ink-muted)] py-6 text-center">Belum ada catatan pembayaran angsuran.</p>
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
    </div>
  </div>
{/if}
