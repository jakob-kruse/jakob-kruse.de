import { writable } from 'svelte/store';

export type Integrity = 'intact' | 'collapsing' | 'collapsed';

// Lives outside the engine so the page can subscribe without loading the engine.
export const integrity = writable<Integrity>('intact');
