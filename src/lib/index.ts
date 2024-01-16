import { tweened } from "svelte/motion";
import { writable } from "svelte/store";

export const cursorPos = tweened({ x: 0, y: 0 }, { duration: 1000 / 60 });
export const scrollPos = writable(0);
