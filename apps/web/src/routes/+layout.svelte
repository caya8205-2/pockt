<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import {
    LayoutDashboard,
    Wallet,
    Receipt,
    CalendarCheck,
    HandCoins,
    Plus,
    Download,
    ChevronLeft,
    Menu,
    X,
    Sun,
    Moon
  } from 'lucide-svelte';
  import QuickAddModal from '$components/QuickAddModal.svelte';

  let isSidebarCompact = false;
  let isMobileMenuOpen = false;
  let isQuickAddOpen = false;
  let currentTheme: 'light' | 'dark' = 'light';

  onMount(() => {
    const saved = localStorage.getItem('pockt-theme') as 'light' | 'dark' | null;
    if (saved === 'dark' || saved === 'light') {
      currentTheme = saved;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme = 'dark';
    }
    applyTheme(currentTheme);
  });

  function applyTheme(theme: 'light' | 'dark') {
    currentTheme = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('pockt-theme', theme);
    }
  }

  function toggleTheme() {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  }

  const navItems = [
    { href: '/', label: 'Timeline & Status', icon: LayoutDashboard },
    { href: '/payday', label: 'Payday View', icon: Wallet },
    { href: '/incomes', label: 'Pemasukan', icon: Wallet },
    { href: '/expenses', label: 'Pengeluaran', icon: Receipt },
    { href: '/bills', label: 'Tagihan', icon: CalendarCheck },
    { href: '/debts', label: 'Hutang', icon: HandCoins },
  ];

  function toggleSidebar() {
    isSidebarCompact = !isSidebarCompact;
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function openQuickAdd() {
    isQuickAddOpen = true;
  }
</script>

<div class="min-h-screen flex flex-col md:flex-row bg-[var(--color-paper)] text-[var(--color-ink)] selection:bg-[var(--color-accent-subtle)] selection:text-[var(--color-accent)] transition-colors duration-150">
  <!-- Mobile Header Bar -->
  <header class="md:hidden sticky top-0 z-40 bg-[var(--color-paper-2)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between shadow-xs">
    <a href="/" class="flex items-center gap-2.5">
      <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-9 w-auto object-contain" />
      <span class="font-mono font-bold text-lg text-[var(--color-ink)] tracking-tight">POCKT</span>
    </a>

    <div class="flex items-center gap-2">
      <!-- Theme Toggle Mobile Button -->
      <button
        on:click={toggleTheme}
        class="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md cursor-pointer transition-colors"
        title={currentTheme === 'light' ? 'Beralih ke Dark Mode (Aurora)' : 'Beralih ke Light Mode (Bloom)'}
        aria-label="Toggle Theme"
      >
        {#if currentTheme === 'light'}
          <Moon class="w-4 h-4 text-[var(--color-ink-muted)]" />
        {:else}
          <Sun class="w-4 h-4 text-[var(--color-ink-muted)]" />
        {/if}
      </button>

      <button
        on:click={openQuickAdd}
        class="p-2 bg-[var(--color-accent)] text-slate-950 font-bold text-xs flex items-center justify-center cursor-pointer rounded-md shadow-xs"
        aria-label="Catat Transaksi"
      >
        <Plus class="w-4 h-4 stroke-[3]" />
      </button>

      <button
        on:click={toggleMobileMenu}
        class="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md cursor-pointer"
        aria-label="Toggle Menu"
      >
        {#if isMobileMenuOpen}
          <X class="w-5 h-5" />
        {:else}
          <Menu class="w-5 h-5" />
        {/if}
      </button>
    </div>
  </header>

  <!-- Mobile Drawer Menu -->
  {#if isMobileMenuOpen}
    <div class="md:hidden fixed inset-0 z-50 bg-[var(--color-paper)]/95 backdrop-blur-md flex flex-col p-6 space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
        <a href="/" on:click={() => (isMobileMenuOpen = false)} class="flex items-center gap-3">
          <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-10 w-auto object-contain" />
          <span class="font-mono font-bold text-lg text-[var(--color-ink)]">POCKT</span>
        </a>
        <button on:click={toggleMobileMenu} class="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
          <X class="w-6 h-6" />
        </button>
      </div>

      <nav class="space-y-1.5 flex-1">
        {#each navItems as item}
          {@const isActive = $page.url.pathname === item.href}
          <a
            href={item.href}
            on:click={() => (isMobileMenuOpen = false)}
            class={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
              isActive
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]'
            }`}
          >
            <svelte:component this={item.icon} class={`w-5 h-5 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'}`} />
            <span>{item.label}</span>
          </a>
        {/each}
      </nav>

      <div class="pt-4 border-t border-[var(--color-border)] space-y-3">
        <!-- Mobile Drawer Theme Toggle Button -->
        <button
          on:click={toggleTheme}
          class="w-full py-2.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono text-xs rounded-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {#if currentTheme === 'light'}
            <Moon class="w-4 h-4 text-[var(--color-ink-muted)]" />
            <span>Switch to Dark Mode (Aurora)</span>
          {:else}
            <Sun class="w-4 h-4 text-[var(--color-ink-muted)]" />
            <span>Switch to Light Mode (Bloom)</span>
          {/if}
        </button>

        <button
          on:click={() => { isMobileMenuOpen = false; openQuickAdd(); }}
          class="w-full py-3 bg-[var(--color-accent)] text-slate-950 font-mono font-bold text-sm rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          <span>Catat Transaksi</span>
        </button>

        <a
          href="/api/export/csv"
          download
          class="w-full py-2.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink-muted)] font-mono text-xs rounded-md flex items-center justify-center gap-2"
        >
          <Download class="w-4 h-4" />
          <span>Export CSV</span>
        </a>
      </div>
    </div>
  {/if}

  <!-- Desktop Collapsible Sidebar (Side-Rail Nav Archetype N3) -->
  <aside
    class={`hidden md:flex flex-col sticky top-0 h-screen border-r border-[var(--color-border)] bg-[var(--color-paper-2)] transition-all duration-200 z-30 shrink-0 ${
      isSidebarCompact ? 'w-20' : 'w-64'
    }`}
  >
    <!-- Sidebar Header -->
    <div class={`p-4 flex items-center border-b border-[var(--color-border)] h-18 ${isSidebarCompact ? 'justify-center px-2' : 'justify-between'}`}>
      {#if isSidebarCompact}
        <button
          on:click={toggleSidebar}
          class="p-1 rounded-md hover:bg-[var(--color-paper-3)] transition-all cursor-pointer group"
          title="Perluas Sidebar"
          aria-label="Perluas Sidebar"
        >
          <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform" />
        </button>
      {:else}
        <a href="/" class="flex items-center gap-3 overflow-hidden">
          <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-10 w-auto object-contain shrink-0" />
          <div class="flex flex-col min-w-0">
            <span class="font-mono font-extrabold text-lg tracking-tight text-[var(--color-ink)] leading-none">POCKT</span>
            <span class="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider mt-0.5">Finance</span>
          </div>
        </a>

        <button
          on:click={toggleSidebar}
          class="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] border border-[var(--color-border)] rounded-md transition-colors cursor-pointer"
          title="Ciutkan Sidebar"
          aria-label="Ciutkan Sidebar"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
      {/if}
    </div>

    <!-- Quick Action CTA Button -->
    <div class="p-3">
      <button
        on:click={openQuickAdd}
        class={`w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
          isSidebarCompact ? 'px-0' : 'px-3'
        }`}
        title="Catat Transaksi"
      >
        <Plus class="w-4 h-4 stroke-[3]" />
        {#if !isSidebarCompact}
          <span>Catat Transaksi</span>
        {/if}
      </button>
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
      {#each navItems as item}
        {@const isActive = $page.url.pathname === item.href}
        <a
          href={item.href}
          class={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
            isActive
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
          } ${isSidebarCompact ? 'justify-center px-0' : ''}`}
          title={isSidebarCompact ? item.label : undefined}
        >
          <svelte:component this={item.icon} class={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'}`} />
          {#if !isSidebarCompact}
            <span class="truncate">{item.label}</span>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- Sidebar Footer / Actions -->
    <div class="p-3 border-t border-[var(--color-border)] space-y-2">
      <!-- Theme Toggle Switch -->
      <button
        on:click={toggleTheme}
        class={`w-full py-2 bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono text-[11px] rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          isSidebarCompact ? 'px-0' : 'px-3'
        }`}
        title={currentTheme === 'light' ? 'Mode Gelap (Aurora)' : 'Mode Terang (Bloom)'}
      >
        {#if currentTheme === 'light'}
          <Moon class="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
          {#if !isSidebarCompact}
            <span>Dark Mode (Aurora)</span>
          {/if}
        {:else}
          <Sun class="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
          {#if !isSidebarCompact}
            <span>Light Mode (Bloom)</span>
          {/if}
        {/if}
      </button>

      <a
        href="/api/export/csv"
        download
        class={`w-full py-2 bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono text-[11px] rounded-md transition-colors flex items-center justify-center gap-2 ${
          isSidebarCompact ? 'px-0' : 'px-3'
        }`}
        title="Export CSV"
      >
        <Download class="w-3.5 h-3.5" />
        {#if !isSidebarCompact}
          <span>Export CSV</span>
        {/if}
      </a>
    </div>
  </aside>

  <!-- Main Area -->
  <div class="flex-1 flex flex-col min-w-0">
    <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
      <slot />
    </main>

    <!-- Clean Minimal Footer -->
    <footer class="border-t border-[var(--color-border)] bg-[var(--color-paper-2)] px-6 py-4 text-xs font-mono text-[var(--color-ink-muted)] flex items-center justify-between">
      <div>Pockt — Personal Finance Companion</div>
      <div class="text-[10px] uppercase font-mono tracking-wider">
        MIT License
      </div>
    </footer>
  </div>
</div>

<!-- Quick Add Modal -->
<QuickAddModal bind:isOpen={isQuickAddOpen} />
