<script lang="ts">
  import { onMount } from 'svelte';
  import { currentLang, translations } from '$lib/i18n';
  import { currentUser } from '$lib/user';
  import Icon from '$components/Icon.svelte';
  import {
    UserIcon,
    Shield01Icon,
    Settings02Icon,
    CheckmarkBadge01Icon,
    Calendar03Icon,
  } from '@hugeicons/core-free-icons';

  $: t = translations[$currentLang];

  onMount(async () => {
    if (!$currentUser) {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data?.user) {
          currentUser.set(data.user);
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      }
    }
  });
</script>

<svelte:head>
  <title>{t.profile_title} — Pockt</title>
</svelte:head>

<div class="space-y-6 max-w-3xl mx-auto pb-12">
  <!-- Header -->
  <div class="flex items-start sm:items-center gap-3.5 pb-2 border-b border-[var(--color-border)]">
    <div class="p-2.5 bg-[var(--color-accent-subtle)] text-emerald-700 dark:text-[var(--color-accent)] border border-[var(--color-border)] rounded-xl shrink-0 shadow-xs">
      <Icon icon={UserIcon} class="w-6 h-6" />
    </div>
    <div>
      <h1 class="text-2xl font-extrabold font-mono text-[var(--color-ink)] tracking-tight">
        {t.profile_title}
      </h1>
      <p class="text-xs font-mono text-[var(--color-ink-muted)] mt-0.5">
        {t.profile_subtitle}
      </p>
    </div>
  </div>

  <!-- Profile Card -->
  <div class="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs font-mono">
    <div class="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-[var(--color-border)]">
      <!-- Avatar: Person icon placeholder (not initials as requested) -->
      <div class="w-20 h-20 rounded-2xl bg-[var(--color-paper-3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] shrink-0 shadow-xs">
        <Icon icon={UserIcon} class="w-10 h-10" />
      </div>

      <div class="space-y-1">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="text-xl font-extrabold text-[var(--color-ink)]">
            {$currentUser?.username || 'owner'}
          </span>
          <span class="px-2.5 py-0.5 text-[11px] font-bold bg-[var(--color-accent-subtle)] text-emerald-700 dark:text-[var(--color-accent)] rounded-full flex items-center gap-1 border border-[var(--color-border)]">
            <Icon icon={CheckmarkBadge01Icon} class="w-3.5 h-3.5" />
            <span>Owner</span>
          </span>
        </div>
        <p class="text-xs text-[var(--color-ink-muted)]">
          {t.settings_account_role}
        </p>
      </div>
    </div>

    <!-- Quick Info Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div class="p-4 rounded-xl bg-[var(--color-paper)] border border-[var(--color-border)] space-y-1">
        <div class="text-[var(--color-ink-muted)] flex items-center gap-2">
          <Icon icon={Shield01Icon} class="w-4 h-4 text-emerald-700 dark:text-[var(--color-accent)]" />
          <span class="font-bold">{t.settings_account_role_label}</span>
        </div>
        <div class="text-sm font-extrabold text-[var(--color-ink)]">Single-Owner Instance</div>
        <div class="text-[10px] text-[var(--color-ink-muted)]">Akses penuh seluruh catatan keuangan</div>
      </div>

      <div class="p-4 rounded-xl bg-[var(--color-paper)] border border-[var(--color-border)] space-y-1">
        <div class="text-[var(--color-ink-muted)] flex items-center gap-2">
          <Icon icon={Calendar03Icon} class="w-4 h-4 text-blue-500" />
          <span class="font-bold">Keamanan Sesi</span>
        </div>
        <div class="text-sm font-extrabold text-[var(--color-ink)]">HTTP-Only Cookie</div>
        <div class="text-[10px] text-[var(--color-ink-muted)]">Terenkripsi aman di sisi server</div>
      </div>
    </div>

    <!-- Notice -->
    <div class="p-4 rounded-xl bg-[var(--color-accent-subtle)]/40 border border-[var(--color-border)] text-xs text-[var(--color-ink)] leading-relaxed">
      {t.profile_placeholder_note}
    </div>

    <!-- Link to Settings -->
    <div class="pt-2 flex justify-end">
      <a
        href="/settings"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
      >
        <Icon icon={Settings02Icon} class="w-4 h-4" />
        <span>Buka Pengaturan Sistem →</span>
      </a>
    </div>
  </div>
</div>
