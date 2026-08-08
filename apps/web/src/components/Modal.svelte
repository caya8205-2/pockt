<script lang="ts">
  import { X } from 'lucide-svelte';

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
    <div class={`w-full ${maxWidth} bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-xl relative animate-in fade-in zoom-in-95 duration-150`}>
      <button
        on:click={onClose}
        class="absolute top-4 right-4 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 rounded-md hover:bg-[var(--color-paper-3)] transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X class="w-5 h-5" />
      </button>

      {#if title}
        <h2 class="text-base font-bold font-mono text-[var(--color-ink)] pr-6">{title}</h2>
      {/if}

      <div>
        <slot />
      </div>
    </div>
  </div>
{/if}
