<script setup lang="ts">
/**
 * Reusable transport bar for the replayable islands. Pure presentation +
 * events; the parent owns state via usePlayhead. Fully keyboard-operable:
 * buttons are buttons, the scrubber is a native range input (arrow keys,
 * Home/End all work for free).
 */
const props = defineProps<{
  index: number;
  count: number;
  playing: boolean;
  reducedMotion: boolean;
  /** spoken description of the current position, e.g. "Step 2 of 5: Auth" */
  valueText: string;
  /** hide the scrubber for very short sequences if desired */
  showScrubber?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'restart'): void;
  (e: 'seek', value: number): void;
}>();

function onScrub(event: Event) {
  emit('seek', Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="controls" role="group" aria-label="Playback controls">
    <div class="controls__buttons">
      <button type="button" class="ctl" @click="emit('restart')" title="Restart" aria-label="Restart">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <button
        type="button"
        class="ctl"
        @click="emit('prev')"
        :disabled="index <= 0"
        title="Step back"
        aria-label="Step back"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 5v14l-9-7 9-7ZM6 5h2v14H6z" fill="currentColor" />
        </svg>
      </button>

      <button
        v-if="!reducedMotion"
        type="button"
        class="ctl ctl--primary"
        @click="emit('toggle')"
        :aria-pressed="playing"
        :title="playing ? 'Pause' : 'Play'"
        :aria-label="playing ? 'Pause' : 'Play'"
      >
        <svg v-if="!playing" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />
        </svg>
      </button>

      <button
        type="button"
        class="ctl"
        @click="emit('next')"
        :disabled="index >= count - 1"
        title="Step forward"
        aria-label="Step forward"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14l9-7-9-7ZM16 5h2v14h-2z" fill="currentColor" />
        </svg>
      </button>
    </div>

    <label v-if="showScrubber !== false" class="controls__scrub">
      <span class="visually-hidden">Timeline position</span>
      <input
        type="range"
        min="0"
        :max="Math.max(count - 1, 0)"
        :value="index"
        step="1"
        :aria-valuetext="valueText"
        @input="onScrub"
      />
    </label>

    <p v-if="reducedMotion" class="controls__rm" role="note">
      Reduced-motion: step manually.
    </p>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.controls__buttons {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.ctl {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: var(--border-thin) solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-color var(--motion-micro) var(--ease),
    border-color var(--motion-micro) var(--ease),
    color var(--motion-micro) var(--ease),
    transform var(--motion-micro) var(--ease);
}
.ctl svg {
  width: 1.15rem;
  height: 1.15rem;
}
.ctl:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  color: var(--color-accent);
}
.ctl:active:not(:disabled) {
  transform: scale(0.94);
}
.ctl:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ctl--primary {
  background: var(--color-accent-solid);
  border-color: var(--color-accent-solid);
  color: var(--color-accent-contrast);
  width: 2.9rem;
  height: 2.9rem;
}
.ctl--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  color: var(--color-accent-contrast);
}
.ctl--primary svg {
  width: 1.35rem;
  height: 1.35rem;
}

.controls__scrub {
  flex: 1 1 12rem;
  display: flex;
  align-items: center;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--color-accent-solid);
  cursor: pointer;
  height: 1.5rem;
}

.controls__rm {
  font-size: var(--step--1);
  color: var(--color-text-muted);
  flex-basis: 100%;
}
</style>
