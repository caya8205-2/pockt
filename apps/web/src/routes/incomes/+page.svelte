<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchApi } from '$lib/api';
  import { formatRupiah, formatDate } from '$lib/format';
  import { Wallet, Plus, Trash2, Edit3, ArrowDownLeft, X } from 'lucide-svelte';

  interface Income {
    id: string;
    title: string;
    amount: number;
    date: string;
    notes: string | null;
  }

  let incomes: Income[] = [];
  let isLoading = true;

  // Form modal state
  let showModal = false;
  let editingId: string | null = null;
  let title = '';
  let amount: number | null = null;
  let date = new Date().toISOString().split('T')[0];
  let notes = '';

  async function loadIncomes() {
    isLoading = true;
    try {
      incomes = await fetchApi<Income[]>('/incomes');
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingId = null;
    title = '';
    amount = null;
    date = new Date().toISOString().split('T')[0];
    notes = '';
    showModal = true;
  }

  function openEditModal(item: Income) {
    editingId = item.id;
    title = item.title;
    amount = item.amount;
    date = item.date;
    notes = item.notes || '';
    showModal = true;
  }

  async function handleSubmit() {
    if (!title || !amount || amount <= 0) return;

    if (editingId) {
      await fetchApi(`/incomes/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, amount: Number(amount), date, notes }),
      });
    } else {
      await fetchApi('/incomes', {
        method: 'POST',
        body: JSON.stringify({ title, amount: Number(amount), date, notes }),
      });
    }

    showModal = false;
    loadIncomes();
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pencatatan pemasukan ini?')) return;
    await fetchApi(`/incomes/${id}`, { method: 'DELETE' });
    loadIncomes();
  }

  onMount(() => {
    loadIncomes();
  });
</script>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-2.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-border)] rounded-md">
        <Wallet class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-xl font-bold font-mono text-[var(--color-ink)]">Kelola Pemasukan</h1>
        <p class="text-xs text-[var(--color-ink-muted)]">Catat gaji, bonus, freelance, atau pengembalian dana.</p>
      </div>
    </div>

    <button
      on:click={openCreateModal}
      class="flex items-center gap-2 px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-mono font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs"
    >
      <Plus class="w-4 h-4 stroke-[3]" />
      <span>Tambah Pemasukan</span>
    </button>
  </div>

  {#if isLoading}
    <div class="p-10 text-center font-mono text-xs text-[var(--color-ink-muted)]">Memuat data pemasukan...</div>
  {:else if incomes.length === 0}
    <div class="p-10 text-center border border-dashed border-[var(--color-border)] rounded-md space-y-1">
      <p class="text-[var(--color-ink)] font-semibold text-sm">Belum Ada Catatan Pemasukan</p>
    </div>
  {:else}
    <div class="grid gap-2.5">
      {#each incomes as item}
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-md p-3.5 flex items-center justify-between gap-4 hover:border-slate-400 transition-colors">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded">
              <ArrowDownLeft class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-[var(--color-ink)] text-sm">{item.title}</div>
              <div class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
                {formatDate(item.date)} {#if item.notes}• <span class="italic text-[var(--color-ink-muted)] font-sans">{item.notes}</span>{/if}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 font-mono">
            <div class="font-bold text-[var(--color-accent)] text-sm sm:text-base">
              +{formatRupiah(item.amount)}
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

      <h2 class="text-base font-bold font-mono text-[var(--color-ink)]">{editingId ? 'Edit Pemasukan' : 'Tambah Pemasukan Baru'}</h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-3.5">
        <div>
          <label id="lbl-inc-title" for="inp-inc-title" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Judul Pemasukan</label>
          <input
            id="inp-inc-title"
            type="text"
            bind:value={title}
            placeholder="mis. Gaji Bulanan"
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-inc-amount" for="inp-inc-amount" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Nominal (Rp)</label>
          <input
            id="inp-inc-amount"
            type="number"
            bind:value={amount}
            placeholder="0"
            required
            min="1"
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-inc-date" for="inp-inc-date" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Tanggal</label>
          <input
            id="inp-inc-date"
            type="date"
            bind:value={date}
            required
            class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md text-[var(--color-ink)] text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label id="lbl-inc-notes" for="inp-inc-notes" class="block text-xs font-mono font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">Catatan</label>
          <input
            id="inp-inc-notes"
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
