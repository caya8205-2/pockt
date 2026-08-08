import { writable } from 'svelte/store';

export type AuthTransitionMode = 'none' | 'login_to_dash' | 'logout' | 'register_to_login' | 'navigating';

export interface AuthTransitionState {
  mode: AuthTransitionMode;
  stage: 'enter' | 'hold' | 'exit' | 'idle';
  message?: string;
}

export const authTransition = writable<AuthTransitionState>({
  mode: 'none',
  stage: 'idle',
});

export async function runAuthTransition(
  mode: AuthTransitionMode,
  message: string,
  onHold: () => Promise<void> | void
) {
  // Stage 1: Curtain & logo slide down into view
  authTransition.set({ mode, stage: 'enter', message });
  await new Promise((r) => setTimeout(r, 350));

  // Stage 2: Hold in center with pulse/message while executing route change
  authTransition.set({ mode, stage: 'hold', message });
  await onHold();
  await new Promise((r) => setTimeout(r, 650));

  // Stage 3: Slide downward off-screen to reveal target page
  authTransition.set({ mode, stage: 'exit', message });
  await new Promise((r) => setTimeout(r, 450));

  // Stage 4: Reset state
  authTransition.set({ mode: 'none', stage: 'idle' });
}
