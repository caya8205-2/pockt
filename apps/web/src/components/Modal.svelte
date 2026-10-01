<script lang="ts">
  import Icon from './Icon.svelte';
  import { Cancel01Icon } from '@hugeicons/core-free-icons';

  export let isOpen = false;
  export let title = '';
  export let maxWidth = 'max-w-md';
  export let onClose: () => void = () => {};

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-paper)]/85 backdrop-blur-md transition-opacity">
    <div class={`w-full ${maxWidth} bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl relative animate-in fade-in zoom-in-95 duration-150`}>
      <button
        on:click={onClose}
        class="absolute top-4 right-4 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] w-8 h-8 rounded-lg bg-[var(--color-paper-3)]/60 hover:bg-[var(--color-paper-3)] border border-[var(--color-border)] flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Close"
      >
        <Icon icon={Cancel01Icon} class="w-4 h-4" />
      </button>

      {#if title}
        <h2 class="text-base sm:text-lg font-extrabold font-mono text-[var(--color-ink)] pr-8">{title}</h2>
      {/if}

      <div>
        <slot />
      </div>
    </div>
  </div>
{/if}
