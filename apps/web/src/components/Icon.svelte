<script lang="ts">
  import { HugeiconsIcon } from '@hugeicons/svelte';

  interface Props {
    icon: any;
    size?: number | string;
    strokeWidth?: number;
    color?: string;
    class?: string;
    altIcon?: any;
    showAlt?: boolean;
    style?: string;
    id?: string;
    title?: string;
    [key: string]: any;
  }

  let {
    icon,
    size = 20,
    strokeWidth,
    color,
    class: className = '',
    ...restProps
  }: Props = $props();
</script>

<HugeiconsIcon
  {icon}
  {size}
  {strokeWidth}
  {color}
  class={className}
  {...restProps}
/>
