<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { currentLang, translations } from '$lib/i18n';
  import { currentTheme, initTheme } from '$lib/theme';
  import { currentUser } from '$lib/user';
  import Icon from '$components/Icon.svelte';
  import {
    DashboardSquare01Icon,
    Wallet01Icon,
    ReceiptIcon,
    CalendarCheck01Icon,
    HandCoinsIcon,
    CheckmarkBadge01Icon,
    PlusSignIcon,
    Download01Icon,
    ArrowLeft01Icon,
    Menu01Icon,
    Cancel01Icon,
    Logout01Icon,
    Settings02Icon,
    UserIcon,
    MoreVerticalIcon,
  } from '@hugeicons/core-free-icons';
  import QuickAddModal from '$components/QuickAddModal.svelte';
  import { authTransition, runAuthTransition } from '$lib/authTransition';

  $: t = translations[$currentLang];

  let isSidebarCompact = false;
  let isMobileMenuOpen = false;
  let isQuickAddOpen = false;
  let isProfileMenuOpen = false;
  let isAuthenticated = false;

  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/register';

  let lastCheckedPath = '';

  $: if (browser && $page.url.pathname !== lastCheckedPath) {
    lastCheckedPath = $page.url.pathname;
    isProfileMenuOpen = false;
    checkAuth();
  }

  onMount(() => {
    initTheme();
    checkAuth();
  });

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        isAuthenticated = true;
        if (data.user) {
          currentUser.set(data.user);
        }
        if (isAuthPage) {
          goto('/dashboard');
        }
      } else {
        isAuthenticated = false;
        currentUser.set(null);
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
      currentUser.set(null);
      if (!isAuthPage) {
        goto('/login');
      }
    }
  }

  async function handleLogout() {
    isProfileMenuOpen = false;
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
        currentUser.set(null);
        goto('/login');
      }
    );
  }

  $: navItems = [
    { href: '/dashboard', label: t.nav_timeline, icon: DashboardSquare01Icon },
    { href: '/payday', label: t.nav_payday, icon: Wallet01Icon },
    { href: '/incomes', label: t.nav_incomes, icon: Wallet01Icon },
    { href: '/expenses', label: t.nav_expenses, icon: ReceiptIcon },
    { href: '/bills', label: t.nav_bills, icon: CalendarCheck01Icon },
    { href: '/debts', label: t.nav_debts, icon: HandCoinsIcon },
    { href: '/settled', label: t.nav_settled, icon: CheckmarkBadge01Icon },
  ];

  function toggleSidebar() {
    isSidebarCompact = !isSidebarCompact;
    isProfileMenuOpen = false;
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function openQuickAdd() {
    isQuickAddOpen = true;
  }

  function toggleProfileMenu() {
    isProfileMenuOpen = !isProfileMenuOpen;
  }

  function closeProfileMenu() {
    isProfileMenuOpen = false;
  }

  function handleGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (isProfileMenuOpen && target && !target.closest('#profile-menu-container')) {
      isProfileMenuOpen = false;
    }
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isProfileMenuOpen = false;
      isMobileMenuOpen = false;
    }
  }
</script>

<svelte:window on:click={handleGlobalClick} on:keydown={handleGlobalKeydown} />

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
        <!-- Settings Shortcut Mobile Button -->
        <a
          href="/settings"
          class="w-9 h-9 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-lg cursor-pointer transition-colors"
          title={t.nav_settings}
          aria-label={t.nav_settings}
        >
          <Icon icon={Settings02Icon} class="w-4 h-4 text-[var(--color-ink-muted)]" />
        </a>

        <button
          on:click={openQuickAdd}
          class="w-9 h-9 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-bold text-xs flex items-center justify-center cursor-pointer rounded-lg shadow-xs transition-colors"
          aria-label={t.quick_add}
        >
          <Icon icon={PlusSignIcon} class="w-4 h-4 stroke-[3]" />
        </button>

        <button
          on:click={toggleMobileMenu}
          class="w-9 h-9 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-lg cursor-pointer transition-colors"
          aria-label="Toggle Menu"
        >
          {#if isMobileMenuOpen}
            <Icon icon={Cancel01Icon} class="w-5 h-5" />
          {:else}
            <Icon icon={Menu01Icon} class="w-5 h-5" />
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
            <Icon icon={Cancel01Icon} class="w-6 h-6" />
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
                <Icon icon={item.icon} class="w-4 h-4" />
              </div>
              <span class="text-sm font-semibold">{item.label}</span>
            </a>
          {/each}
        </nav>

        <div class="pt-4 border-t border-[var(--color-border)] space-y-2.5">
          <!-- Mobile Drawer User Profile Summary Card -->
          <div class="p-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl flex items-center gap-3">
            <!-- Avatar: Placeholder Icon Orang (NO initials) -->
            <div class="w-10 h-10 rounded-xl bg-[var(--color-paper-3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] shrink-0">
              <Icon icon={UserIcon} class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1 font-mono">
              <div class="font-extrabold text-xs text-[var(--color-ink)] truncate">
                {$currentUser?.username || 'owner'}
              </div>
              <div class="text-[10px] text-emerald-700 dark:text-[var(--color-accent)] font-bold">
                Owner
              </div>
            </div>
          </div>

          <button
            on:click={() => { isMobileMenuOpen = false; openQuickAdd(); }}
            class="w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Icon icon={PlusSignIcon} class="w-4 h-4 stroke-[3]" />
            <span>{t.quick_add}</span>
          </button>

          <div class="grid grid-cols-2 gap-2">
            <a
              href="/profile"
              on:click={() => (isMobileMenuOpen = false)}
              class="py-2.5 px-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--color-paper-3)] transition-colors"
            >
              <Icon icon={UserIcon} class="w-3.5 h-3.5" />
              <span>{t.menu_profile}</span>
            </a>

            <a
              href="/settings"
              on:click={() => (isMobileMenuOpen = false)}
              class="py-2.5 px-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--color-paper-3)] transition-colors"
            >
              <Icon icon={Settings02Icon} class="w-3.5 h-3.5" />
              <span>{t.nav_settings}</span>
            </a>
          </div>

          <button
            on:click={() => { isMobileMenuOpen = false; handleLogout(); }}
            class="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 font-mono text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Icon icon={Logout01Icon} class="w-3.5 h-3.5" />
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
            <Icon icon={ArrowLeft01Icon} class="w-3.5 h-3.5" />
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
            <Icon icon={PlusSignIcon} class="w-3.5 h-3.5 stroke-[3]" />
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
              <Icon icon={item.icon} class="w-4 h-4" />
            </div>
            {#if !isSidebarCompact}
              <span class="truncate">{item.label}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <!-- Sidebar Footer / User Profile & Drop-Up -->
      <div id="profile-menu-container" class="p-3 border-t border-[var(--color-border)] relative">
        <!-- Drop-Up Popover Menu (anchored above) -->
        {#if isProfileMenuOpen}
          <div
            class={`absolute bottom-full mb-2 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl shadow-xl p-1.5 space-y-1 font-mono text-xs z-50 animate-in fade-in zoom-in-95 duration-150 ${
              isSidebarCompact ? 'left-3 w-56' : 'left-3 right-3'
            }`}
          >
            <!-- User Summary Header -->
            <div class="px-3 py-2 border-b border-[var(--color-border)]/60 flex items-center gap-2.5">
              <!-- Avatar: Placeholder Icon Orang (NO initials) -->
              <div class="w-8 h-8 rounded-xl bg-[var(--color-paper-3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] shrink-0">
                <Icon icon={UserIcon} class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-extrabold text-xs text-[var(--color-ink)] truncate">
                  {$currentUser?.username || 'owner'}
                </div>
                <div class="text-[10px] text-emerald-700 dark:text-[var(--color-accent)] font-bold">
                  Owner
                </div>
              </div>
            </div>

            <!-- Menu Links -->
            <div class="py-1 space-y-0.5">
              <a
                href="/profile"
                on:click={closeProfileMenu}
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors cursor-pointer font-semibold group"
              >
                <div class="p-1 rounded-lg bg-[var(--color-paper-3)] group-hover:bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] shrink-0">
                  <Icon icon={UserIcon} class="w-3.5 h-3.5" />
                </div>
                <span>{t.menu_profile}</span>
              </a>

              <a
                href="/settings"
                on:click={closeProfileMenu}
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors cursor-pointer font-semibold group"
              >
                <div class="p-1 rounded-lg bg-[var(--color-paper-3)] group-hover:bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] shrink-0">
                  <Icon icon={Settings02Icon} class="w-3.5 h-3.5" />
                </div>
                <span>{t.menu_settings}</span>
              </a>
            </div>

            <!-- Logout Item -->
            <div class="pt-1 border-t border-[var(--color-border)]/60">
              <button
                type="button"
                on:click={() => { closeProfileMenu(); handleLogout(); }}
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer font-semibold group text-left"
              >
                <div class="p-1 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                  <Icon icon={Logout01Icon} class="w-3.5 h-3.5" />
                </div>
                <span>{t.menu_logout}</span>
              </button>
            </div>
          </div>
        {/if}

        <!-- Profile Pill Trigger Button -->
        <button
          type="button"
          on:click={toggleProfileMenu}
          class={`w-full rounded-xl bg-[var(--color-paper)] hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] transition-all cursor-pointer group shadow-xs ${
            isSidebarCompact
              ? 'h-11 flex items-center justify-center p-0'
              : 'p-2 flex items-center justify-between gap-2.5'
          } ${isProfileMenuOpen ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20' : ''}`}
          title={$currentUser?.username || 'owner'}
          aria-expanded={isProfileMenuOpen}
        >
          <div class={`flex items-center gap-2.5 min-w-0 ${isSidebarCompact ? 'justify-center' : ''}`}>
            <!-- Avatar: Placeholder Icon Orang (NO initials) -->
            <div class="w-8 h-8 rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)] shrink-0">
              <Icon icon={UserIcon} class="w-4 h-4" />
            </div>

            {#if !isSidebarCompact}
              <div class="flex flex-col min-w-0 text-left">
                <span class="font-mono font-bold text-xs text-[var(--color-ink)] truncate leading-tight">
                  {$currentUser?.username || 'owner'}
                </span>
                <span class="text-[10px] font-mono text-[var(--color-ink-muted)] truncate leading-tight mt-0.5">
                  Personal Account
                </span>
              </div>
            {/if}
          </div>

          {#if !isSidebarCompact}
            <div class="p-1 rounded-md text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)] shrink-0">
              <Icon icon={MoreVerticalIcon} class="w-4 h-4" />
            </div>
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
{:else}
  <!-- Clean Loading Fallback while verifying session -->
  <div class="min-h-screen flex flex-col items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink)] p-4">
    <div class="flex flex-col items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-border)] shadow-xs flex items-center justify-center">
        <img src="/logo-no-bg.png" alt="Pockt" class="w-8 h-8 object-contain" />
      </div>
      <div class="flex items-center gap-2 font-mono text-xs text-[var(--color-ink-muted)]">
        <div class="w-3.5 h-3.5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        <span>Memuat...</span>
      </div>
    </div>
  </div>
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
