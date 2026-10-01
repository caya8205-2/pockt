import { writable } from 'svelte/store';

export interface UserProfile {
  username: string;
}

export const currentUser = writable<UserProfile | null>(null);
