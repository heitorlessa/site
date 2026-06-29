import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

/**
 * Shared playback engine for the replayable islands (sequence diagram, loop
 * player, stepper). Owns: a playhead index, play/pause, stepping, scrubbing,
 * looping, and reduced-motion awareness.
 *
 * SSR-safe: no browser APIs touched until onMounted, so the server renders a
 * sensible static frame and the component degrades gracefully without JS.
 */
export interface PlayheadOptions {
  count: number;
  /** ms between auto-advance ticks while playing */
  intervalMs?: number;
  /** wrap from last back to first (loop animations) */
  loop?: boolean;
  /** index to rest on for the server-rendered / no-JS frame */
  initial?: number;
}

export function usePlayhead(opts: PlayheadOptions) {
  const { count, intervalMs = 1400, loop = false, initial = 0 } = opts;

  const index = ref(Math.min(Math.max(initial, 0), Math.max(count - 1, 0)));
  const playing = ref(false);
  const reducedMotion = ref(false);
  // Becomes true after hydration; templates gate "hide inactive" on this so the
  // no-JS render shows everything.
  const interactive = ref(false);

  let timer: ReturnType<typeof setInterval> | null = null;
  let mql: MediaQueryList | null = null;

  const atEnd = computed(() => index.value >= count - 1);
  const atStart = computed(() => index.value <= 0);
  const progress = computed(() => (count <= 1 ? 1 : index.value / (count - 1)));

  function clear() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function pause() {
    playing.value = false;
    clear();
  }

  function next() {
    if (index.value < count - 1) {
      index.value += 1;
    } else if (loop) {
      index.value = 0;
    } else {
      pause();
    }
  }

  function prev() {
    if (index.value > 0) index.value -= 1;
    else if (loop) index.value = count - 1;
  }

  function seek(i: number) {
    index.value = Math.min(Math.max(i, 0), count - 1);
  }

  function play() {
    if (count <= 1) return;
    // Reduced motion: never auto-run a timer. Treat play as "advance once".
    if (reducedMotion.value) {
      next();
      return;
    }
    if (!loop && atEnd.value) index.value = 0; // replay from the top
    playing.value = true;
    clear();
    timer = setInterval(next, intervalMs);
  }

  function toggle() {
    playing.value ? pause() : play();
  }

  function restart() {
    pause();
    index.value = 0;
  }

  onMounted(() => {
    interactive.value = true;
    mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.value = mql.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotion.value = e.matches;
      if (e.matches) pause();
    };
    mql.addEventListener('change', onChange);
    onBeforeUnmount(() => mql?.removeEventListener('change', onChange));
  });

  onBeforeUnmount(clear);

  return {
    index,
    playing,
    reducedMotion,
    interactive,
    atEnd,
    atStart,
    progress,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    restart,
  };
}
