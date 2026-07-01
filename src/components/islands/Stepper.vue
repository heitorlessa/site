<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

/**
 * Step-by-step walkthrough of a concept.
 * - prev / next + step counter
 * - left/right arrow keys (and Home/End) when the widget has focus
 * - deep-linkable: each step syncs to the URL hash (#<id>-step-N)
 * - no-JS / pre-hydration: every step renders stacked and readable
 */
interface Step {
  title?: string;
  /** trusted, author-written HTML (rendered with v-html) */
  body: string;
}

const props = defineProps<{
  id: string;
  steps: Step[];
  label?: string;
}>();

const count = computed(() => props.steps.length);
const active = ref(0);
const interactive = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const hashFor = (i: number) => `${props.id}-step-${i + 1}`;

function go(i: number) {
  active.value = Math.min(Math.max(i, 0), count.value - 1);
}

function next() {
  go(active.value + 1);
}
function prev() {
  go(active.value - 1);
}

function syncHash() {
  if (!interactive.value) return;
  const url = new URL(window.location.href);
  url.hash = hashFor(active.value);
  history.replaceState(null, '', url);
}

function readHash() {
  const m = window.location.hash.match(new RegExp(`${props.id}-step-(\\d+)`));
  if (m) go(Number(m[1]) - 1);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    next();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prev();
  } else if (e.key === 'Home') {
    e.preventDefault();
    go(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    go(count.value - 1);
  }
}

watch(active, syncHash);

onMounted(() => {
  interactive.value = true;
  readHash();
  window.addEventListener('hashchange', readHash);
});
onBeforeUnmount(() => window.removeEventListener('hashchange', readHash));
</script>

<template>
  <section
    ref="rootRef"
    :id="id"
    class="stepper"
    :class="{ 'is-interactive': interactive }"
    :aria-label="label ?? 'Step-by-step walkthrough'"
    tabindex="0"
    @keydown="onKeydown"
  >
    <header class="stepper__bar">
      <p class="stepper__count" aria-live="polite">
        Step <strong>{{ active + 1 }}</strong> of {{ count }}
      </p>
      <div class="stepper__dots" aria-hidden="true">
        <button
          v-for="(s, i) in steps"
          :key="i"
          class="dot"
          :class="{ 'dot--on': i === active, 'dot--done': i < active }"
          type="button"
          tabindex="-1"
          @click="go(i)"
        />
      </div>
    </header>

    <ol class="stepper__steps">
      <li
        v-for="(step, i) in steps"
        :key="i"
        class="step"
        :class="{ 'step--active': i === active }"
        :id="hashFor(i)"
      >
        <h4 v-if="step.title" class="step__title">
          <span class="step__num" aria-hidden="true">{{ i + 1 }}</span>
          {{ step.title }}
        </h4>
        <div class="step__body" v-html="step.body"></div>
      </li>
    </ol>

    <footer class="stepper__nav">
      <button type="button" class="btn" @click="prev" :disabled="active === 0">
        ← Prev
      </button>
      <button
        type="button"
        class="btn btn--primary"
        @click="next"
        :disabled="active === count - 1"
      >
        Next →
      </button>
    </footer>
  </section>
</template>

<style scoped>
.stepper {
  background: var(--color-surface);
  border: var(--border-thin) solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: var(--space-4);
}
.stepper:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.stepper__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.stepper__count {
  font-size: var(--step--1);
  color: var(--color-text-muted);
}
.stepper__count strong {
  color: var(--color-text);
}

.stepper__dots {
  display: inline-flex;
  gap: var(--space-2);
}
.dot {
  width: 0.7rem;
  height: 0.7rem;
  padding: 0;
  border-radius: var(--radius-full);
  border: var(--border-thin) solid var(--color-border-strong);
  background: transparent;
  cursor: pointer;
  transition:
    background-color var(--motion-micro) var(--ease),
    transform var(--motion-micro) var(--ease);
}
.dot--done {
  background: var(--color-accent-wash);
  border-color: var(--color-accent);
}
.dot--on {
  background: var(--color-accent-solid);
  border-color: var(--color-accent-solid);
  transform: scale(1.2);
}

.stepper__steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
}

/* No-JS / pre-hydration: stack ALL steps so nothing is hidden. */
.step {
  padding-block: var(--space-2);
}
.step + .step {
  margin-top: var(--space-4);
  border-top: var(--border-thin) solid var(--color-border);
  padding-top: var(--space-4);
}

/* Interactive: stack every step in the SAME grid cell so the card height stays
   constant (no layout jump between steps) and the active step crossfades in. */
.is-interactive .stepper__steps {
  display: grid;
  align-items: start;
}
.is-interactive .step {
  grid-area: 1 / 1;
  border-top: none;
  margin-top: 0;
  padding-top: var(--space-2);
  /* Inactive steps are hidden immediately (kept out of the a11y tree); only the
     entering step animates in. No layout shift — all steps share one cell. */
  visibility: hidden;
  opacity: 0;
  transform: translateY(6px);
}
.is-interactive .step--active {
  visibility: visible;
  opacity: 1;
  transform: none;
  transition:
    opacity var(--motion-content) var(--ease),
    transform var(--motion-content) var(--ease);
}

.step__title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.step__num {
  display: inline-grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  flex: none;
  font-size: var(--step--1);
  border-radius: var(--radius-full);
  background: var(--color-accent-solid);
  color: var(--color-accent-contrast);
}
.step__body :deep(p + p) {
  margin-top: var(--space-3);
}
.step__body :deep(code) {
  background: var(--color-surface-2);
  padding: 0.12em 0.35em;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}

.stepper__nav {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
/* No-JS: the counter/dots/nav are meaningless when all steps already show. */
.stepper:not(.is-interactive) .stepper__nav,
.stepper:not(.is-interactive) .stepper__bar {
  display: none;
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: var(--border-thin) solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--step--1);
  transition:
    background-color var(--motion-micro) var(--ease),
    border-color var(--motion-micro) var(--ease);
}
.btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn--primary {
  background: var(--color-accent-solid);
  border-color: var(--color-accent-solid);
  color: var(--color-accent-contrast);
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  color: var(--color-accent-contrast);
}

@media (prefers-reduced-motion: reduce) {
  .is-interactive .step,
  .is-interactive .step--active {
    transition: none;
    transform: none;
  }
}
</style>
