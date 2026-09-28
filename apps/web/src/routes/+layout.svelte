<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { currentLang, toggleLang, translations } from '$lib/i18n';
  import {
    LayoutDashboard,
    Wallet,
    Receipt,
    CalendarCheck,
    HandCoins,
    BadgeCheck,
    Plus,
    Download,
    ChevronLeft,
    Menu,
    X,
    Sun,
    Moon,
    LogOut,
    Languages
  } from 'lucide-svelte';
  import QuickAddModal from '$components/QuickAddModal.svelte';

  $: t = translations[$currentLang];

  let isSidebarCompact = false;
  let isMobileMenuOpen = false;
  let isQuickAddOpen = false;
  let currentTheme: 'light' | 'dark' = 'light';
  let isAuthenticated = false;

  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/register';

  let lastCheckedPath = '';

  $: if (browser && $page.url.pathname !== lastCheckedPath) {
    lastCheckedPath = $page.url.pathname;
    checkAuth();
  }

  onMount(() => {
    const saved = localStorage.getItem('pockt-theme') as 'light' | 'dark' | null;
    if (saved === 'dark' || saved === 'light') {
      currentTheme = saved;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme = 'dark';
    }
    applyTheme(currentTheme);
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        isAuthenticated = true;
        if (isAuthPage) {
          goto('/dashboard');
        }
      } else {
        isAuthenticated = false;
        if (!isAuthPage) {
          if (data.needsSetup) {
            goto('/register');
          } else {
            goto('/login');
          }
        }
      }
    } catch (err) {
      isAuthenticated = false;
      if (!isAuthPage) {
        goto('/login');
      }
    }
  }

  import { authTransition, runAuthTransition } from '$lib/authTransition';

  async function handleLogout() {
    await runAuthTransition(
      'logout',
      $currentLang === 'id' ? 'Mengakhiri Sesi Akun...' : 'Signing Out...',
      async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
          console.error(err);
        }
        isAuthenticated = false;
        goto('/login');
      }
    );
  }

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

  $: navItems = [
    { href: '/dashboard', label: t.nav_timeline, icon: LayoutDashboard },
    { href: '/payday', label: t.nav_payday, icon: Wallet },
    { href: '/incomes', label: t.nav_incomes, icon: Wallet },
    { href: '/expenses', label: t.nav_expenses, icon: Receipt },
    { href: '/bills', label: t.nav_bills, icon: CalendarCheck },
    { href: '/debts', label: t.nav_debts, icon: HandCoins },
    { href: '/settled', label: t.nav_settled, icon: BadgeCheck },
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

{#if isAuthPage}
  <main class="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] transition-colors duration-150">
    <slot />
  </main>
{:else if isAuthenticated}
  <div class="min-h-screen flex flex-col md:flex-row bg-[var(--color-paper)] text-[var(--color-ink)] selection:bg-[var(--color-accent-subtle)] selection:text-[var(--color-accent)] transition-colors duration-150">
    <!-- Mobile Header Bar -->
    <header class="md:hidden sticky top-0 z-40 bg-[var(--color-paper-2)] border-b border-[var(--color-border)] px-4 h-14 flex items-center justify-between shadow-xs">
      <a href="/dashboard" class="flex items-center gap-2.5">
        <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-8 w-auto object-contain" />
        <span class="font-mono font-extrabold text-base text-[var(--color-ink)] tracking-tight">POCKT</span>
      </a>

      <div class="flex items-center gap-1.5">
        <!-- Language Toggle Mobile Button -->
        <button
          on:click={toggleLang}
          class="w-9 h-9 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-lg cursor-pointer transition-colors"
          title="Switch Language (ID / EN)"
          aria-label="Toggle Language"
        >
          <Languages class="w-4 h-4 text-[var(--color-ink-muted)]" />
        </button>

        <!-- Theme Toggle Mobile Button -->
        <button
          on:click={toggleTheme}
          class="w-9 h-9 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-lg cursor-pointer transition-colors"
          title={currentTheme === 'light' ? 'Switch to Dark Mode (Wise Dark)' : 'Switch to Light Mode (Wise Light)'}
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
          class="w-9 h-9 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-bold text-xs flex items-center justify-center cursor-pointer rounded-lg shadow-xs transition-colors"
          aria-label={t.quick_add}
        >
          <Plus class="w-4 h-4 stroke-[3]" />
        </button>

        <button
          on:click={toggleMobileMenu}
          class="w-9 h-9 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-lg cursor-pointer transition-colors"
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
          <a href="/dashboard" on:click={() => (isMobileMenuOpen = false)} class="flex items-center gap-3">
            <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-9 w-auto object-contain" />
            <span class="font-mono font-extrabold text-lg text-[var(--color-ink)] tracking-tight">POCKT</span>
          </a>
          <button on:click={toggleMobileMenu} class="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded-lg">
            <X class="w-6 h-6" />
          </button>
        </div>

        <nav class="space-y-1 flex-1">
          {#each navItems as item}
            {@const isActive = $page.url.pathname === item.href}
            <a
              href={item.href}
              on:click={() => (isMobileMenuOpen = false)}
              class={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-ink)] font-bold shadow-xs border-l-3 border-[var(--color-accent)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]'
              }`}
            >
              <div class={`p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ${
                isActive
                  ? 'bg-[var(--color-accent)] text-slate-950 shadow-xs'
                  : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]'
              }`}>
                <svelte:component this={item.icon} class="w-4 h-4" />
              </div>
              <span class="text-sm font-semibold">{item.label}</span>
            </a>
          {/each}
        </nav>

        <div class="pt-4 border-t border-[var(--color-border)] space-y-2.5">
          <!-- Mobile Drawer Language Toggle -->
          <button
            on:click={toggleLang}
            class="w-full py-2.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors"
          >
            <div class="p-1 rounded-md bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
              <Languages class="w-3.5 h-3.5" />
            </div>
            <span>{t.lang_label}</span>
          </button>

          <!-- Mobile Drawer Theme Toggle Button -->
          <button
            on:click={toggleTheme}
            class="w-full py-2.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors"
          >
            <div class="p-1 rounded-md bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
              {#if currentTheme === 'light'}
                <Moon class="w-3.5 h-3.5" />
              {:else}
                <Sun class="w-3.5 h-3.5" />
              {/if}
            </div>
            <span>{currentTheme === 'light' ? t.switch_theme_dark : t.switch_theme_light}</span>
          </button>

          <button
            on:click={() => { isMobileMenuOpen = false; openQuickAdd(); }}
            class="w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>{t.quick_add}</span>
          </button>

          <a
            href="/api/export/csv"
            download
            class="w-full py-2.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <div class="p-1 rounded-md bg-[var(--color-paper-3)]">
              <Download class="w-3.5 h-3.5" />
            </div>
            <span>{t.export_csv}</span>
          </a>

          <button
            on:click={handleLogout}
            class="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 font-mono text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut class="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
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
      <div class={`px-4 flex items-center border-b border-[var(--color-border)] h-[68px] ${isSidebarCompact ? 'justify-center px-2' : 'justify-between'}`}>
        {#if isSidebarCompact}
          <button
            on:click={toggleSidebar}
            class="p-1.5 rounded-xl hover:bg-[var(--color-paper-3)] transition-all cursor-pointer group"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform" />
          </button>
        {:else}
          <a href="/dashboard" class="flex items-center gap-3 overflow-hidden">
            <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-9 w-auto object-contain shrink-0" />
            <div class="flex flex-col min-w-0">
              <span class="font-mono font-extrabold text-base tracking-tight text-[var(--color-ink)] leading-none">POCKT</span>
              <span class="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider mt-1">{t.sidebar_tagline}</span>
            </div>
          </a>

          <button
            on:click={toggleSidebar}
            class="w-7 h-7 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] border border-[var(--color-border)] rounded-lg transition-colors cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
        {/if}
      </div>

      <!-- Quick Action CTA Button -->
      <div class="p-3">
        <button
          on:click={openQuickAdd}
          class={`w-full h-10 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
            isSidebarCompact ? 'px-0' : 'px-3'
          }`}
          title={t.quick_add}
        >
          <div class="p-1 rounded-md bg-slate-950/15 text-slate-950">
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
          </div>
          {#if !isSidebarCompact}
            <span class="tracking-wide">{t.quick_add}</span>
          {/if}
        </button>
      </div>

      <!-- Navigation Items -->
      <nav class="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        {#each navItems as item}
          {@const isActive = $page.url.pathname === item.href}
          <a
            href={item.href}
            class={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all group ${
              isActive
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-ink)] font-bold shadow-xs border-l-3 border-[var(--color-accent)]'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
            } ${isSidebarCompact ? 'justify-center px-0' : ''}`}
            title={isSidebarCompact ? item.label : undefined}
          >
            <div class={`p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ${
              isActive
                ? 'bg-[var(--color-accent)] text-slate-950 shadow-xs'
                : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]'
            }`}>
              <svelte:component this={item.icon} class="w-4 h-4" />
            </div>
            {#if !isSidebarCompact}
              <span class="truncate">{item.label}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <!-- Sidebar Footer / Actions -->
      <div class="p-3 border-t border-[var(--color-border)] space-y-2">
        <!-- Language Switcher Button -->
        <button
          on:click={toggleLang}
          class={`w-full py-2 bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono text-[11px] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            isSidebarCompact ? 'px-0' : 'px-3'
          }`}
          title="Switch Language (ID / EN)"
        >
          <div class="p-1 rounded-md bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
            <Languages class="w-3.5 h-3.5 shrink-0" />
          </div>
          {#if !isSidebarCompact}
            <span>{t.lang_label}</span>
          {/if}
        </button>

        <!-- Theme Toggle Switch -->
        <button
          on:click={toggleTheme}
          class={`w-full py-2 bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono text-[11px] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            isSidebarCompact ? 'px-0' : 'px-3'
          }`}
          title={currentTheme === 'light' ? t.switch_theme_dark : t.switch_theme_light}
        >
          <div class="p-1 rounded-md bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
            {#if currentTheme === 'light'}
              <Moon class="w-3.5 h-3.5 shrink-0" />
            {:else}
              <Sun class="w-3.5 h-3.5 shrink-0" />
            {/if}
          </div>
          {#if !isSidebarCompact}
            <span>{currentTheme === 'light' ? t.switch_theme_dark : t.switch_theme_light}</span>
          {/if}
        </button>

        <a
          href="/api/export/csv"
          download
          class={`w-full py-2 bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono text-[11px] rounded-xl transition-colors flex items-center justify-center gap-2 ${
            isSidebarCompact ? 'px-0' : 'px-3'
          }`}
          title={t.export_csv}
        >
          <div class="p-1 rounded-md bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
            <Download class="w-3.5 h-3.5 shrink-0" />
          </div>
          {#if !isSidebarCompact}
            <span>{t.export_csv}</span>
          {/if}
        </a>

        <button
          on:click={handleLogout}
          class={`w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 font-mono text-[11px] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            isSidebarCompact ? 'px-0' : 'px-3'
          }`}
          title={t.logout}
        >
          <LogOut class="w-3.5 h-3.5 shrink-0" />
          {#if !isSidebarCompact}
            <span>{t.logout}</span>
          {/if}
        </button>
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
{/if}

<!-- Fullscreen Auth Transition Overlay (Logo Glide Animation) -->
{#if $authTransition.mode !== 'none'}
  <div
    class={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink)] transition-transform duration-500 ease-in-out ${
      $authTransition.stage === 'enter'
        ? 'translate-y-0 opacity-100'
        : $authTransition.stage === 'hold'
        ? 'translate-y-0 opacity-100'
        : $authTransition.stage === 'exit'
        ? 'translate-y-full opacity-0 pointer-events-none'
        : '-translate-y-full opacity-0'
    }`}
  >
    <div
      class={`flex flex-col items-center gap-4 transition-all duration-500 transform ${
        $authTransition.stage === 'hold'
          ? 'scale-105 translate-y-0'
          : 'scale-100 translate-y-0'
      }`}
    >
      <div class="relative flex items-center justify-center p-4 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-border)] shadow-xl">
        <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-16 w-auto object-contain animate-bounce" />
      </div>

      <div class="text-center space-y-1.5 font-mono">
        <div class="font-bold text-2xl tracking-tight text-[var(--color-ink)]">
          POCKT
        </div>
        {#if $authTransition.message}
          <div class="text-xs text-emerald-700 dark:text-[var(--color-accent)] font-bold tracking-wide animate-pulse">
            {$authTransition.message}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
