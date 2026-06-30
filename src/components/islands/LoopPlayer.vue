<script setup lang="ts">
import { computed } from 'vue';
import { usePlayhead } from '../../lib/usePlayhead';
import PlayerControls from './PlayerControls.vue';

/**
 * Replayable loop for a cyclic mental model (a feedback loop, a state cycle…).
 * Phases sit around a ring; playback walks the cycle and wraps. Reduced-motion
 * parks on the current phase and lets the reader step manually.
 */
interface Frame {
  label: string;
  caption?: string;
}

const props = defineProps<{
  frames: Frame[];
  title?: string;
  caption?: string;
}>();

const count = computed(() => props.frames.length);
const ph = usePlayhead({ count: count.value, intervalMs: 1300, loop: true, initial: 0 });

// Geometry
const S = 340;
const C = S / 2;
const R = 118;
const NODE_R = 30;

function angle(i: number): number {
  // start at top (−90°) and go clockwise
  return (-90 + (360 / count.value) * i) * (Math.PI / 180);
}
function nodePos(i: number) {
  const a = angle(i);
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
}
function arcPath(i: number): string {
  // arc from node i to node i+1 along the ring, trimmed so it doesn't overlap
  const n = count.value;
  const gap = (NODE_R + 8) / R; // radians of clearance near each node
  const a1 = angle(i) + gap;
  const a2 = angle((i + 1) % n) - gap + (i + 1 >= n ? 2 * Math.PI : 0);
  const start = { x: C + R * Math.cos(a1), y: C + R * Math.sin(a1) };
  const end = { x: C + R * Math.cos(a2), y: C + R * Math.sin(a2) };
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${R} ${R} 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

const activeFrame = computed(() => props.frames[ph.index.value]);
const valueText = computed(
  () => `Phase ${ph.index.value + 1} of ${count.value}: ${activeFrame.value?.label ?? ''}`,
);
</script>

<template>
  <figure class="loop" :class="{ 'is-interactive': ph.interactive.value }">
    <div class="loop__frame" role="group" :aria-label="title ?? 'Loop animation'">
      <p v-if="title" class="loop__title">{{ title }}</p>

      <div class="loop__stage">
        <svg
          class="loop__canvas"
          :viewBox="`0 0 ${S} ${S}`"
          role="img"
          :aria-label="`Cycle of ${count} phases`"
        >
          <defs>
            <marker
              id="loop-arrow"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 z" class="loop__arrowhead" />
            </marker>
          </defs>

          <g class="loop__arcs">
            <path
              v-for="(f, i) in frames"
              :key="'arc-' + i"
              :d="arcPath(i)"
              class="loop__arc"
              :class="{ 'is-active': i === ph.index.value }"
              fill="none"
              marker-end="url(#loop-arrow)"
            />
          </g>

          <g class="loop__nodes">
            <g
              v-for="(f, i) in frames"
              :key="'node-' + i"
              class="loop__node"
              :class="{ 'is-active': i === ph.index.value, 'is-past': i < ph.index.value }"
            >
              <circle :cx="nodePos(i).x" :cy="nodePos(i).y" :r="NODE_R" class="loop__node-bg" />
              <text :x="nodePos(i).x" :y="nodePos(i).y - 4" class="loop__node-num">{{ i + 1 }}</text>
              <text :x="nodePos(i).x" :y="nodePos(i).y + 12" class="loop__node-label">
                {{ f.label }}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <p class="loop__caption" aria-live="polite">
        <span class="loop__badge">{{ ph.index.value + 1 }}/{{ count }}</span>
        <span><strong>{{ activeFrame?.label }}</strong><template v-if="activeFrame?.caption">
          — {{ activeFrame.caption }}</template></span>
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

    <figcaption v-if="caption" class="loop__fig">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.loop {
  display: grid;
  gap: var(--space-4);
  margin: 0;
}
.loop__frame {
  background: var(--color-surface);
  border: var(--border-thin) solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: var(--space-4);
  justify-items: center;
}
.loop__title {
  font-weight: var(--weight-bold);
  font-size: var(--step-1);
  letter-spacing: var(--tracking-tight);
  justify-self: start;
}
.loop__stage {
  width: min(100%, 24rem);
}
.loop__canvas {
  width: 100%;
  height: auto;
}

.loop__arc {
  stroke: var(--color-border-strong);
  stroke-width: 2.5;
  transition: stroke var(--motion-content) var(--ease);
}
.loop__arc.is-active {
  stroke: var(--color-accent-solid);
}
.loop__arrowhead {
  fill: var(--color-border-strong);
}

.loop__node-bg {
  fill: var(--color-surface-2);
  stroke: var(--color-border-strong);
  stroke-width: 1.5;
  transition:
    fill var(--motion-content) var(--ease),
    stroke var(--motion-content) var(--ease);
}
.loop__node.is-active .loop__node-bg {
  fill: var(--color-accent-solid);
  stroke: var(--color-accent-solid);
}
.loop__node.is-past .loop__node-bg {
  fill: var(--color-accent-wash);
  stroke: var(--color-accent);
}
.loop__node-num {
  text-anchor: middle;
  font-size: 13px;
  font-weight: 700;
  fill: var(--color-text-muted);
  font-family: var(--font-body);
}
.loop__node.is-active .loop__node-num {
  fill: var(--color-accent-contrast);
}
.loop__node-label {
  text-anchor: middle;
  font-size: 11px;
  fill: var(--color-text);
  font-family: var(--font-body);
}
.loop__node.is-active .loop__node-label {
  fill: var(--color-accent-contrast);
  font-weight: 700;
}

.loop__caption {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  min-height: 1.6em;
  justify-self: stretch;
  font-size: var(--step-0);
}
.loop__badge {
  flex: none;
  font-size: var(--step--1);
  font-weight: 700;
  color: var(--color-accent-contrast);
  background: var(--color-accent-solid);
  padding: 0.1em 0.55em;
  border-radius: var(--radius-full);
}
.loop__fig {
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .loop__arc,
  .loop__node-bg {
    transition: none;
  }
}
</style>
