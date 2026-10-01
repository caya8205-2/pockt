<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchApi } from '$lib/api';
  import { currentLang, setLang, translations } from '$lib/i18n';
  import { currentTheme, applyTheme } from '$lib/theme';
  import { currentUser } from '$lib/user';
  import { runAuthTransition } from '$lib/authTransition';
  import Icon from '$components/Icon.svelte';
  import {
    Settings02Icon,
    Sun03Icon,
    Moon02Icon,
    TranslateIcon,
    DollarSignIcon,
    Calendar03Icon,
    Download01Icon,
    UserIcon,
    Shield01Icon,
    Database01Icon,
    CheckmarkCircle02Icon,
    Logout01Icon,
    InformationCircleIcon,
  } from '@hugeicons/core-free-icons';

  $: t = translations[$currentLang];

  let paydayDate = 5;
  let isSavingPayday = false;
  let paydayFeedback = '';
  let paydayFeedbackType: 'success' | 'error' = 'success';

  onMount(async () => {
    try {
      const paydayRes = await fetchApi<any>('/payday');
      if (paydayRes?.paydayDate) {
        paydayDate = paydayRes.paydayDate;
      }
    } catch (err) {
      console.error('Failed to load payday settings:', err);
    }

    if (!$currentUser) {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData?.user) {
          currentUser.set(meData.user);
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      }
    }
  });

  async function handleSavePayday() {
    isSavingPayday = true;
    paydayFeedback = '';
    try {
      await fetchApi('/user/settings', {
        method: 'PUT',
        body: JSON.stringify({ paydayDate: Number(paydayDate) }),
      });
      paydayFeedback = `${t.settings_payday_success} ${paydayDate}`;
      paydayFeedbackType = 'success';
    } catch (err: any) {
      paydayFeedback = err?.message || 'Gagal menyimpan pengaturan';
      paydayFeedbackType = 'error';
    } finally {
      isSavingPayday = false;
    }
  }

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
        currentUser.set(null);
        goto('/login');
      }
    );
  }
</script>

<svelte:head>
  <title>{t.settings_title} — Pockt</title>
</svelte:head>

<div class="space-y-6 max-w-4xl mx-auto pb-12">
  <!-- Page Header -->
  <div class="flex items-start sm:items-center gap-3.5 pb-2 border-b border-[var(--color-border)]">
    <div class="p-2.5 bg-[var(--color-accent-subtle)] text-emerald-700 dark:text-[var(--color-accent)] border border-[var(--color-border)] rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-xs">
      <Icon icon={Settings02Icon} class="w-6 h-6" />
    </div>
    <div>
      <h1 class="text-2xl font-extrabold font-mono text-[var(--color-ink)] tracking-tight">
        {t.settings_title}
      </h1>
      <p class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
        {t.settings_subtitle}
      </p>
    </div>
  </div>

  <!-- Section 1: Appearance & Theme -->
  <section class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
    <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border)]">
      <div class="p-1.5 rounded-lg bg-[var(--color-paper-3)] text-emerald-700 dark:text-[var(--color-accent)]">
        {#if $currentTheme === 'light'}
          <Icon icon={Sun03Icon} class="w-4 h-4" />
        {:else}
          <Icon icon={Moon02Icon} class="w-4 h-4" />
        {/if}
      </div>
      <div>
        <h2 class="text-sm font-bold font-mono text-[var(--color-ink)]">{t.settings_theme_title}</h2>
        <p class="text-[11px] font-mono text-[var(--color-ink-muted)]">{t.settings_theme_desc}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
      <!-- Wise Light Option -->
      <button
        type="button"
        on:click={() => applyTheme('light')}
        class={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
          $currentTheme === 'light'
            ? 'bg-[#ffffff] text-[#0e0f0c] border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 shadow-sm'
            : 'bg-[var(--color-paper)] border-[var(--color-border)] hover:border-[var(--color-ink-muted)]/50'
        }`}
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Icon icon={Sun03Icon} class="w-4 h-4" />
            </div>
            <div>
              <div class="font-mono font-bold text-xs text-[var(--color-ink)]">{t.settings_theme_light_name}</div>
              <div class="text-[10px] font-mono text-[var(--color-ink-muted)]">Light Canvas</div>
            </div>
          </div>
          {#if $currentTheme === 'light'}
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-accent)] text-slate-950 rounded-full flex items-center gap-1 shadow-xs">
              <Icon icon={CheckmarkCircle02Icon} class="w-3 h-3" />
              <span>{$currentLang === 'id' ? 'Aktif' : 'Active'}</span>
            </span>
          {/if}
        </div>
        <p class="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
          {t.settings_theme_light_desc}
        </p>
      </button>

      <!-- Obsidian Forest Option -->
      <button
        type="button"
        on:click={() => applyTheme('dark')}
        class={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
          $currentTheme === 'dark'
            ? 'bg-[#131b15] text-[#f4f6f2] border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 shadow-sm'
            : 'bg-[var(--color-paper)] border-[var(--color-border)] hover:border-[var(--color-ink-muted)]/50'
        }`}
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Icon icon={Moon02Icon} class="w-4 h-4" />
            </div>
            <div>
              <div class="font-mono font-bold text-xs text-[var(--color-ink)]">{t.settings_theme_dark_name}</div>
              <div class="text-[10px] font-mono text-[var(--color-ink-muted)]">Dark Canvas</div>
            </div>
          </div>
          {#if $currentTheme === 'dark'}
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-accent)] text-slate-950 rounded-full flex items-center gap-1 shadow-xs">
              <Icon icon={CheckmarkCircle02Icon} class="w-3 h-3" />
              <span>{$currentLang === 'id' ? 'Aktif' : 'Active'}</span>
            </span>
          {/if}
        </div>
        <p class="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
          {t.settings_theme_dark_desc}
        </p>
      </button>
    </div>
  </section>

  <!-- Section 2: Language & Localization -->
  <section class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
    <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border)]">
      <div class="p-1.5 rounded-lg bg-[var(--color-paper-3)] text-emerald-700 dark:text-[var(--color-accent)]">
        <Icon icon={TranslateIcon} class="w-4 h-4" />
      </div>
      <div>
        <h2 class="text-sm font-bold font-mono text-[var(--color-ink)]">{t.settings_lang_title}</h2>
        <p class="text-[11px] font-mono text-[var(--color-ink-muted)]">{t.settings_lang_desc}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
      <!-- Bahasa Indonesia Option -->
      <button
        type="button"
        on:click={() => setLang('id')}
        class={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
          $currentLang === 'id'
            ? 'bg-[var(--color-paper-2)] border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 shadow-xs'
            : 'bg-[var(--color-paper)] border-[var(--color-border)] hover:border-[var(--color-ink-muted)]/50'
        }`}
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">🇮🇩</span>
            <div>
              <div class="font-mono font-bold text-xs text-[var(--color-ink)]">Bahasa Indonesia</div>
              <div class="text-[10px] font-mono text-[var(--color-ink-muted)]">Indonesian</div>
            </div>
          </div>
          {#if $currentLang === 'id'}
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-accent)] text-slate-950 rounded-full flex items-center gap-1 shadow-xs">
              <Icon icon={CheckmarkCircle02Icon} class="w-3 h-3" />
              <span>Aktif</span>
            </span>
          {/if}
        </div>
        <p class="text-[11px] text-[var(--color-ink-muted)] font-mono leading-relaxed">
          Menggunakan terminologi finansial lokal Indonesia dan format tanggal standar.
        </p>
      </button>

      <!-- English Option -->
      <button
        type="button"
        on:click={() => setLang('en')}
        class={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
          $currentLang === 'en'
            ? 'bg-[var(--color-paper-2)] border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30 shadow-xs'
            : 'bg-[var(--color-paper)] border-[var(--color-border)] hover:border-[var(--color-ink-muted)]/50'
        }`}
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">🇬🇧</span>
            <div>
              <div class="font-mono font-bold text-xs text-[var(--color-ink)]">English</div>
              <div class="text-[10px] font-mono text-[var(--color-ink-muted)]">International</div>
            </div>
          </div>
          {#if $currentLang === 'en'}
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-accent)] text-slate-950 rounded-full flex items-center gap-1 shadow-xs">
              <Icon icon={CheckmarkCircle02Icon} class="w-3 h-3" />
              <span>Active</span>
            </span>
          {/if}
        </div>
        <p class="text-[11px] text-[var(--color-ink-muted)] font-mono leading-relaxed">
          English localization for menus, transaction forms, ledger feeds, and status badges.
        </p>
      </button>
    </div>

    <!-- Currency Row -->
    <div class="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono text-xs">
      <div class="flex items-center gap-2">
        <div class="p-1 rounded bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]">
          <Icon icon={DollarSignIcon} class="w-3.5 h-3.5" />
        </div>
        <div>
          <span class="font-bold text-[var(--color-ink)]">{t.settings_currency_title}</span>
          <span class="text-[var(--color-ink-muted)] block sm:inline sm:ml-2">Rp (IDR)</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[11px] text-[var(--color-ink-muted)]">{t.settings_currency_val}</span>
        <span class="px-2 py-0.5 bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] text-[10px] rounded-md font-bold">
          {t.settings_currency_badge}
        </span>
      </div>
    </div>
  </section>

  <!-- Section 3: Financial & Payday Configuration -->
  <section class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
    <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border)]">
      <div class="p-1.5 rounded-lg bg-[var(--color-paper-3)] text-emerald-700 dark:text-[var(--color-accent)]">
        <Icon icon={Calendar03Icon} class="w-4 h-4" />
      </div>
      <div>
        <h2 class="text-sm font-bold font-mono text-[var(--color-ink)]">{t.settings_payday_title}</h2>
        <p class="text-[11px] font-mono text-[var(--color-ink-muted)]">{t.settings_payday_desc}</p>
      </div>
    </div>

    <div class="space-y-4 pt-1">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
        <div>
          <label for="settings-payday-input" class="text-xs font-bold text-[var(--color-ink)] block">
            {t.settings_payday_date_label}
          </label>
          <span class="text-[11px] text-[var(--color-ink-muted)]">
            {t.settings_payday_date_hint}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative w-28">
            <select
              id="settings-payday-input"
              bind:value={paydayDate}
              class="w-full px-3 py-2 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-xl text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden focus:border-[var(--color-accent)] cursor-pointer"
            >
              {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                <option value={day} class="bg-[var(--color-paper-2)] text-[var(--color-ink)]">
                  {$currentLang === 'id' ? `Tgl ${day}` : `Day ${day}`}
                </option>
              {/each}
            </select>
          </div>

          <button
            type="button"
            on:click={handleSavePayday}
            disabled={isSavingPayday}
            class="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSavingPayday ? t.common_saving : t.settings_payday_save}
          </button>
        </div>
      </div>

      {#if paydayFeedback}
        <div class={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
          paydayFeedbackType === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-[var(--color-accent)]'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-600'
        }`}>
          <Icon icon={paydayFeedbackType === 'success' ? CheckmarkCircle02Icon : InformationCircleIcon} class="w-4 h-4 shrink-0" />
          <span>{paydayFeedback}</span>
        </div>
      {/if}
    </div>
  </section>

  <!-- Section 4: Data & Backup -->
  <section class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
    <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border)]">
      <div class="p-1.5 rounded-lg bg-[var(--color-paper-3)] text-emerald-700 dark:text-[var(--color-accent)]">
        <Icon icon={Database01Icon} class="w-4 h-4" />
      </div>
      <div>
        <h2 class="text-sm font-bold font-mono text-[var(--color-ink)]">{t.settings_backup_title}</h2>
        <p class="text-[11px] font-mono text-[var(--color-ink-muted)]">{t.settings_backup_desc}</p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 font-mono">
      <div class="space-y-1">
        <div class="font-bold text-xs text-[var(--color-ink)]">pockt-financial-export.csv</div>
        <p class="text-[11px] text-[var(--color-ink-muted)] max-w-lg leading-relaxed">
          {$currentLang === 'id'
            ? 'Mengekspor seluruh tabel pemasukan dan pengeluaran ke berkas format CSV untuk dianalisis di Excel atau Google Sheets.'
            : 'Export all income and expense table rows to a standardized CSV format for external analysis.'}
        </p>
      </div>

      <a
        href="/api/export/csv"
        download
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper)] border border-[var(--color-border)] text-[var(--color-ink)] font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
      >
        <Icon icon={Download01Icon} class="w-4 h-4" />
        <span>{t.settings_backup_btn}</span>
      </a>
    </div>
  </section>

  <!-- Section 5: Account & Session -->
  <section class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
    <div class="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border)]">
      <div class="p-1.5 rounded-lg bg-[var(--color-paper-3)] text-emerald-700 dark:text-[var(--color-accent)]">
        <Icon icon={Shield01Icon} class="w-4 h-4" />
      </div>
      <div>
        <h2 class="text-sm font-bold font-mono text-[var(--color-ink)]">{t.settings_account_title}</h2>
        <p class="text-[11px] font-mono text-[var(--color-ink-muted)]">{t.settings_account_desc}</p>
      </div>
    </div>

    <div class="space-y-3 pt-1 font-mono text-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[var(--color-border)]/60">
        <span class="text-[var(--color-ink-muted)]">{t.settings_account_user}</span>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-[var(--color-paper-3)] flex items-center justify-center text-[var(--color-ink-muted)]">
            <Icon icon={UserIcon} class="w-3.5 h-3.5" />
          </div>
          <span class="font-bold text-[var(--color-ink)]">{$currentUser?.username || 'owner'}</span>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[var(--color-border)]/60">
        <span class="text-[var(--color-ink-muted)]">{t.settings_account_role_label}</span>
        <span class="font-bold text-emerald-700 dark:text-[var(--color-accent)]">{t.settings_account_role}</span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[var(--color-border)]/60">
        <span class="text-[var(--color-ink-muted)]">{t.settings_account_storage}</span>
        <span class="text-[var(--color-ink)] font-semibold">{t.settings_account_storage_val}</span>
      </div>

      <div class="pt-2 flex justify-end">
        <button
          type="button"
          on:click={handleLogout}
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          <Icon icon={Logout01Icon} class="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  </section>

  <!-- Section 6: About Pockt -->
  <section class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
    <div class="flex items-center gap-3">
      <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-8 w-auto object-contain" />
      <div>
        <div class="font-mono font-extrabold text-base text-[var(--color-ink)] tracking-tight">POCKT</div>
        <div class="text-[10px] font-mono text-[var(--color-ink-muted)]">v0.1.0 — Disposable Income Companion</div>
      </div>
    </div>
    <p class="text-xs font-mono text-[var(--color-ink-muted)] leading-relaxed">
      {t.settings_about_desc}
    </p>
  </section>
</div>
