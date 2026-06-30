<script setup lang="ts">
import { computed } from 'vue';
import { usePlayhead } from '../../lib/usePlayhead';
import PlayerControls from './PlayerControls.vue';

/**
 * Replayable sequence diagram — the marquee island.
 * Actors get lifelines; messages are drawn between them one at a time with
 * play / pause / step / scrub. The active message animates in (draw effect),
 * a live caption narrates it, and a visually-hidden ordered list gives screen
 * readers the full flow. Reduced-motion parks on a static, fully-drawn frame.
 */
interface Actor {
  id: string;
  label: string;
}
interface Message {
  from: string;
  to: string;
  label: string;
  note?: string;
}

const props = defineProps<{
  actors: Actor[];
  messages: Message[];
  title?: string;
  caption?: string;
}>();

// Geometry (SVG user units; the viewBox scales to any width).
const W = 760;
const PAD = 28;
const HEAD = 56;
const TOP = 34;
const ROW = 64;
const BOT = 28;

const count = computed(() => props.messages.length);
const height = computed(() => HEAD + TOP + ROW * count.value + BOT);
const laneW = computed(() => (W - PAD * 2) / Math.max(props.actors.length, 1));
const actorIndex = computed(
  () => new Map(props.actors.map((a, i) => [a.id, i] as const)),
);

function laneX(id: string): number {
  const i = actorIndex.value.get(id) ?? 0;
  return PAD + laneW.value * (i + 0.5);
}
function rowY(i: number): number {
  return HEAD + TOP + ROW * i + ROW * 0.45;
}

// Start fully revealed so the no-JS / pre-hydration frame shows the whole flow.
const ph = usePlayhead({ count: count.value, intervalMs: 1500, initial: count.value - 1 });

const active = computed(() => props.messages[ph.index.value]);
const liveCaption = computed(() => {
  const m = active.value;
  if (!m) return props.caption ?? '';
  return m.note ?? m.label;
});
const valueText = computed(
  () => `Message ${ph.index.value + 1} of ${count.value}: ${active.value?.label ?? ''}`,
);

function pathFor(m: Message): string {
  const x1 = laneX(m.from);
  const x2 = laneX(m.to);
  const y = rowY(props.messages.indexOf(m));
  if (m.from === m.to) {
    // self-call loop
    const r = 30;
    return `M ${x1} ${y - 8} h ${r} v 18 h ${-r}`;
  }
  return `M ${x1} ${y} H ${x2}`;
}
function labelX(m: Message): number {
  if (m.from === m.to) return laneX(m.from) + 36;
  return (laneX(m.from) + laneX(m.to)) / 2;
}
function dir(m: Message): 1 | -1 {
  return laneX(m.to) >= laneX(m.from) ? 1 : -1;
}
</script>

<template>
  <figure class="seq" :class="{ 'is-interactive': ph.interactive.value }">
    <div class="seq__frame" role="group" :aria-label="title ?? 'Sequence diagram'">
      <p v-if="title" class="seq__title">{{ title }}</p>

      <div class="seq__scroll">
      <svg
        class="seq__canvas"
        :viewBox="`0 0 ${W} ${height}`"
        role="img"
        :aria-label="`Sequence diagram with ${actors.length} participants and ${count} messages`"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="seq-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" class="seq__arrowhead" />
          </marker>
        </defs>

        <!-- lifelines -->
        <g class="seq__lifelines">
          <line
            v-for="a in actors"
            :key="'ll-' + a.id"
            :x1="laneX(a.id)"
            :y1="HEAD"
            :x2="laneX(a.id)"
            :y2="height - BOT"
            class="seq__lifeline"
          />
        </g>

        <!-- actor headers -->
        <g class="seq__actors">
          <g v-for="a in actors" :key="'ac-' + a.id">
            <rect
              :x="laneX(a.id) - Math.min(laneW / 2 - 6, 70)"
              y="14"
              :width="Math.min(laneW - 12, 140)"
              height="34"
              rx="8"
              class="seq__actor-box"
            />
            <text :x="laneX(a.id)" y="36" class="seq__actor-label">{{ a.label }}</text>
          </g>
        </g>

        <!-- messages -->
        <g class="seq__messages">
          <g
            v-for="(m, i) in messages"
            :key="'m-' + i"
            class="seq__msg"
            :class="{
              'is-active': i === ph.index.value,
              'is-hidden': ph.interactive.value && i > ph.index.value,
            }"
          >
            <path
              :d="pathFor(m)"
              class="seq__msg-line"
              :class="{ draw: i === ph.index.value && ph.interactive.value && !ph.reducedMotion.value }"
              pathLength="1"
              marker-end="url(#seq-arrow)"
              fill="none"
            />
            <text
              :x="labelX(m)"
              :y="rowY(i) - 12"
              class="seq__msg-label"
              :text-anchor="m.from === m.to ? 'start' : 'middle'"
            >
              {{ m.label }}
            </text>
          </g>
        </g>
      </svg>
      </div>

      <p class="seq__caption" aria-live="polite">
        <span class="seq__step-badge">{{ ph.index.value + 1 }}/{{ count }}</span>
        {{ liveCaption }}
      </p>
    </div>

    <PlayerControls
      :index="ph.index.value"
      :count="count"
      :playing="ph.playing.value"
      :reduced-motion="ph.reducedMotion.value"
      :value-text="valueText"
      @toggle="ph.toggle"
      @next="ph.next"
      @prev="ph.prev"
      @restart="ph.restart"
      @seek="ph.seek"
    />

    <!-- Full transcript for screen readers and the no-JS audience. -->
    <figcaption class="seq__sr">
      <span class="visually-hidden">Sequence steps:</span>
      <ol class="seq__transcript">
        <li v-for="(m, i) in messages" :key="'t-' + i">
          <strong>{{ m.label }}</strong>
          <span class="seq__transcript-meta">
            ({{ actors.find((a) => a.id === m.from)?.label }} →
            {{ actors.find((a) => a.id === m.to)?.label }})</span
          ><template v-if="m.note"> — {{ m.note }}</template>
        </li>
      </ol>
      <span v-if="caption" class="seq__visible-caption">{{ caption }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.seq {
  display: grid;
  gap: var(--space-4);
  margin: 0;
}

.seq__frame {
  background: var(--color-surface);
  border: var(--border-thin) solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: var(--space-4);
}

.seq__title {
  font-weight: var(--weight-bold);
  font-size: var(--step-1);
  letter-spacing: var(--tracking-tight);
}

.seq__scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}
.seq__canvas {
  width: 100%;
  height: auto;
  overflow: visible;
}
/* On a phone, don't shrink labels into illegibility — keep a legible minimum
   width and let the diagram scroll horizontally instead. */
@media (max-width: 40rem) {
  .seq__canvas {
    min-width: 32rem;
  }
}

.seq__lifeline {
  stroke: var(--color-border-strong);
  stroke-width: 1.5;
  stroke-dasharray: 3 5;
}

.seq__actor-box {
  fill: var(--color-accent-wash);
  stroke: var(--color-accent);
  stroke-width: 1.2;
}
.seq__actor-label {
  fill: var(--color-text);
  font-size: 16px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
  font-family: var(--font-body);
}

.seq__arrowhead {
  fill: var(--color-text-muted);
}

.seq__msg-line {
  stroke: var(--color-text-muted);
  stroke-width: 2;
}
.seq__msg-label {
  fill: var(--color-text-muted);
  font-size: 14px;
  font-family: var(--font-body);
}

/* Active message pops in the accent color. */
.seq__msg.is-active .seq__msg-line {
  stroke: var(--color-accent-solid);
  stroke-width: 2.6;
}
.seq__msg.is-active .seq__msg-label {
  fill: var(--color-text);
  font-weight: 700;
}
.seq__msg.is-active :deep(.seq__arrowhead),
.seq__msg.is-active .seq__msg-line {
  filter: drop-shadow(0 0 2px color-mix(in oklab, var(--color-accent-solid) 40%, transparent));
}

/* Pre-revealed messages stay visible but quiet; future ones hide (JS only). */
.seq__msg.is-hidden {
  opacity: 0;
  pointer-events: none;
}
.seq__msg {
  transition: opacity var(--motion-content) var(--ease);
}

/* Draw-in animation, normalized via pathLength="1". */
.seq__msg-line.draw {
  animation: seq-draw var(--motion-content) var(--ease);
}
@keyframes seq-draw {
  from {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
  }
  to {
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
  }
}

.seq__caption {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  min-height: 1.6em;
  font-size: var(--step-0);
  color: var(--color-text);
}
.seq__step-badge {
  flex: none;
  font-size: var(--step--1);
  font-weight: 700;
  color: var(--color-accent-contrast);
  background: var(--color-accent-solid);
  padding: 0.1em 0.55em;
  border-radius: var(--radius-full);
}

.seq__transcript {
  display: grid;
  gap: var(--space-2);
  padding-left: var(--space-5);
  text-align: left;
  font-size: var(--step--1);
  color: var(--color-text-muted);
}
.seq__transcript-meta {
  color: var(--color-text-subtle);
}
.seq__visible-caption {
  display: block;
  margin-top: var(--space-3);
}

/* When interactive, the transcript is redundant with the live caption — keep
   it for screen readers only. Without JS, it's the full, visible fallback. */
.is-interactive .seq__transcript {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .seq__msg-line.draw {
    animation: none;
  }
  .seq__msg {
    transition: none;
  }
}
</style>
