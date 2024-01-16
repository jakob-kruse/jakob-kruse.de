import { tweened } from "svelte/motion";
import { writable } from "svelte/store";
import { debounce } from "@antfu/utils";

export const cursorPos = tweened({ x: 0, y: 0 }, { duration: 1000 / 60 });
export const scrollPos = writable(0);

let context: AudioContext;
const activeNotes = new Map<
	number,
	{ oscillator: OscillatorNode; gain: GainNode }
>();

export function playNote(frequency: number, type: OscillatorType = "sine") {
	if (!context) {
		context = new AudioContext();
	}

	if (activeNotes.has(frequency)) {
		const note = activeNotes.get(frequency);
		note?.oscillator.stop();
		note?.oscillator.disconnect();
		note?.gain.disconnect();
		activeNotes.delete(frequency);
	}

	const o = context.createOscillator();
	const g = context.createGain();
	o.type = type;
	o.frequency.value = frequency;

	const attack = 0.01;
	const decay = 0.2;
	const sustain = 0.7;
	const release = 1.5;
	const now = context.currentTime;

	const gainValue = 1 / (1 + Math.sqrt(activeNotes.size + 1));
	g.gain.setValueAtTime(0, now);
	g.gain.linearRampToValueAtTime(gainValue, now + attack);
	g.gain.linearRampToValueAtTime(sustain * gainValue, now + attack + decay);

	o.connect(g);
	g.connect(context.destination);
	o.start(now);

	g.gain.exponentialRampToValueAtTime(0.00001, now + attack + decay + release);
	o.stop(now + attack + decay + release);

	activeNotes.set(frequency, { oscillator: o, gain: g });
}

export const debouncedPlayNote = debounce(10, playNote);
