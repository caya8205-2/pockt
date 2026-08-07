import { randomUUID } from 'crypto';

export function cryptoNative(): string {
  return randomUUID();
}
