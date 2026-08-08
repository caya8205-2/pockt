<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchApi } from '$lib/api';
  import { currentLang, toggleLang, translations } from '$lib/i18n';
  import { User, KeyRound, ArrowRight, Languages } from 'lucide-svelte';

  $: t = translations[$currentLang];

  let needsSetup = false;
  let isLoading = true;
  let isSubmitting = false;

  let username = '';
  let password = '';
  let confirmPassword = '';
  let errorMessage = '';

  onMount(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        goto('/');
        return;
      }
      needsSetup = !!data.needsSetup;
      if (needsSetup) {
        username = 'owner';
      }
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  async function handleSubmit() {
    errorMessage = '';

    if (!username.trim() || !password.trim()) {
      errorMessage = $currentLang === 'id' ? 'Username dan password wajib diisi' : 'Username and password are required';
      return;
    }

    if (needsSetup && password !== confirmPassword) {
      errorMessage = $currentLang === 'id' ? 'Konfirmasi password tidak cocok' : 'Password confirmation does not match';
      return;
    }

    isSubmitting = true;

    try {
      const endpoint = needsSetup ? '/api/auth/setup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorMessage = data.error || ($currentLang === 'id' ? 'Terjadi kesalahan saat masuk' : 'Error signing in');
        return;
      }

      goto('/');
    } catch (err) {
      errorMessage = $currentLang === 'id' ? 'Gagal terhubung ke server' : 'Failed to connect to server';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>{needsSetup ? t.setup_title : t.login_title} — Pockt</title>
</svelte:head>

<div class="min-h-[85vh] flex flex-col items-center justify-center p-4 relative">
  <!-- Top Language Selector Button -->
  <div class="absolute top-4 right-4 sm:top-6 sm:right-6">
    <button
      on:click={toggleLang}
      class="px-3 py-1.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] hover:border-[var(--color-ink-muted)] text-[var(--color-ink)] font-mono text-xs rounded-md transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
    >
      <Languages class="w-4 h-4 text-[var(--color-ink-muted)]" />
      <span>{t.lang_label}</span>
    </button>
  </div>

  <div class="w-full max-w-md bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 space-y-6 shadow-md">
    <!-- Header Logo & Title (Clean - No redundant Lock SVG) -->
    <div class="text-center space-y-3 pt-2">
      <div class="flex items-center justify-center gap-3">
        <img src="/logo-no-bg.png" alt="Pockt Logo" class="h-12 w-auto object-contain" />
        <span class="font-mono font-extrabold text-3xl tracking-tight text-[var(--color-ink)]">POCKT</span>
      </div>

      <p class="text-xs font-mono text-[var(--color-ink-muted)] max-w-xs mx-auto leading-relaxed">
        {#if needsSetup}
          {t.setup_desc}
        {:else}
          {t.login_desc}
        {/if}
      </p>
    </div>

    {#if isLoading}
      <div class="p-8 text-center font-mono text-xs text-[var(--color-ink-muted)]">
        {$currentLang === 'id' ? 'Memeriksa status autentikasi...' : 'Checking authentication status...'}
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="space-y-4 font-mono">
        {#if errorMessage}
          <div class="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-md">
            {errorMessage}
          </div>
        {/if}

        <div class="space-y-1.5">
          <label for="username-input" class="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">{t.username}</label>
          <div class="relative">
            <User class="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 top-3" />
            <input
              id="username-input"
              type="text"
              bind:value={username}
              placeholder={$currentLang === 'id' ? 'Masukkan username' : 'Enter username'}
              required
              class="w-full pl-9 pr-3 py-2 bg-[var(--color-paper-3)] border border-[var(--color-border)] rounded-md text-sm text-[var(--color-ink)] focus:outline-hidden focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="password-input" class="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">{t.password}</label>
          <div class="relative">
            <KeyRound class="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 top-3" />
            <input
              id="password-input"
              type="password"
              bind:value={password}
              placeholder={$currentLang === 'id' ? 'Masukkan password' : 'Enter password'}
              required
              class="w-full pl-9 pr-3 py-2 bg-[var(--color-paper-3)] border border-[var(--color-border)] rounded-md text-sm text-[var(--color-ink)] focus:outline-hidden focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
        </div>

        {#if needsSetup}
          <div class="space-y-1.5">
            <label for="confirm-password-input" class="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider block">{t.confirm_password}</label>
            <div class="relative">
              <KeyRound class="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 top-3" />
              <input
                id="confirm-password-input"
                type="password"
                bind:value={confirmPassword}
                placeholder={$currentLang === 'id' ? 'Ulangi password' : 'Confirm password'}
                required
                class="w-full pl-9 pr-3 py-2 bg-[var(--color-paper-3)] border border-[var(--color-border)] rounded-md text-sm text-[var(--color-ink)] focus:outline-hidden focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
          </div>
        {/if}

        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full py-2.5 mt-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-950 font-mono font-bold text-xs rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {#if isSubmitting}
            <span>{$currentLang === 'id' ? 'Memproses...' : 'Processing...'}</span>
          {:else}
            <span>{needsSetup ? t.btn_setup : t.btn_login}</span>
            <ArrowRight class="w-4 h-4" />
          {/if}
        </button>
      </form>
    {/if}
  </div>
</div>
