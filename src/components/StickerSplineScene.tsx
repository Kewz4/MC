import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import type { Application, Easing, SPEObject, TransitionFactory } from '@splinetool/runtime';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Spline = lazy(() => import('@splinetool/react-spline'));

type SplineSceneErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type SplineSceneErrorBoundaryState = {
  failed: boolean;
};

class SplineSceneErrorBoundary extends Component<SplineSceneErrorBoundaryProps, SplineSceneErrorBoundaryState> {
  declare readonly props: SplineSceneErrorBoundaryProps;
  state: SplineSceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SplineSceneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Sticker Spline scene failed to load.', error, info);
    this.props.onError();
  }

  render() {
    if (this.state.failed) {
      return (
        <img
          src="/assets/images/stickers-hero-v2.webp"
          alt="Custom Merchcraft sticker samples"
          className="h-full w-full object-cover object-center opacity-55"
        />
      );
    }

    return this.props.children;
  }
}

type SplineEventMap = ReturnType<Application['getSplineEvents']>;

type SplineDebugWindow = Window & {
  __MC_SPLINE_APP__?: Application;
  __MC_SPLINE_OBJECTS__?: Array<{ name: string; id: string; color: string }>;
  __MC_SPLINE_EVENTS__?: SplineEventMap;
};

function getSplineEventsSafely(app: Application): SplineEventMap {
  try {
    return app.getSplineEvents() ?? {};
  } catch {
    // Runtime 2.x throws when the exported scene has no Spline event handler.
    return {};
  }
}

const READY_POLL_INTERVAL = 180;
const READY_POLL_LIMIT = 50;
// The longest authored Start path is 5s (1s delay + 1s hold + 3s transition).
const INTRO_PLAYBACK_DURATION = 5_000;
const PLAYBACK_IDLE_DELAY = 160;
const SCENE_ZOOM = 1.36;
const SPLINE_EASE_IN_OUT = 4 as Easing;
const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' ']);
const STICKER_TRANSITION_DELAYS = new Map<string, number>([
  ['d9120f9d-8cff-492b-bd91-1e084fc96f84', 1_400],
  ['6dec1384-1629-46fa-bfb6-a7017ee021c4', 1_000],
  ['6f32aac6-21e0-436c-8b13-494c1f25bbb0', 1_000],
  ['a61efeda-ebda-463c-9606-d38d8353bf73', 2_000],
]);

type ScenePhase = 'initial' | 'playing-forward' | 'paused-forward' | 'final' | 'playing-reverse' | 'paused-reverse';

type OrbitControlsLike = {
  enablePan?: boolean;
  enableRotate?: boolean;
  enableZoom?: boolean;
  isTouchZoom?: boolean;
  mouseButtons?: number[];
  update?: () => void;
};

type SplineEventManagerLike = {
  pause?: () => void;
};

function getOrbitControls(app: Application): OrbitControlsLike | undefined {
  return (app.controls as { orbitControls?: OrbitControlsLike } | undefined)?.orbitControls;
}

function getEventManager(app: Application): SplineEventManagerLike | undefined {
  return app.eventManager as SplineEventManagerLike | undefined;
}

function dispatchSceneStatus(type: 'mc:spline-loading' | 'mc:spline-ready' | 'mc:spline-error') {
  window.dispatchEvent(new CustomEvent(type));
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));
}

function getStartEventObjects(app: Application, events: SplineEventMap) {
  return Object.keys(events.start ?? {})
    .map((id) => app.findObjectById(id))
    .filter((object): object is SPEObject => Boolean(object));
}

export default function StickerSplineScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const splineRef = useRef<Application | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const setupScroll = useCallback((app: Application) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    cleanupRef.current?.();
    let cancelled = false;
    let pollCount = 0;
    let pollTimer: number | undefined;
    let preheatTimer: number | undefined;
    let readyRaf: number | undefined;
    let playbackIdleTimer: number | undefined;
    let progressRaf: number | undefined;
    let pinTrigger: ScrollTrigger | undefined;
    let phase: ScenePhase = 'initial';
    let activeDirection: -1 | 1 = 1;
    let progressMs = 0;
    let lastProgressAt = 0;
    let sceneReady = false;
    let scrollLocked = false;
    let lockedScrollY = 0;
    let touchY: number | undefined;
    let startObjects: SPEObject[] = [];
    let transitionControllers: TransitionFactory[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const eventManager = getEventManager(app);

    const updatePhase = (nextPhase: ScenePhase) => {
      phase = nextPhase;
      stage.dataset.scenePhase = nextPhase;
      stage.dataset.sceneProgress = (progressMs / INTRO_PLAYBACK_DURATION).toFixed(3);
      stage.setAttribute('aria-busy', String(nextPhase !== 'initial' && nextPhase !== 'final'));
    };

    const lockScroll = () => {
      if (scrollLocked) return;
      lockedScrollY = window.scrollY;
      scrollLocked = true;
      stage.dataset.scrollGate = 'locked';
    };

    const unlockScroll = () => {
      scrollLocked = false;
      delete stage.dataset.scrollGate;
    };

    const cancelProgressFrame = () => {
      if (progressRaf !== undefined) window.cancelAnimationFrame(progressRaf);
      progressRaf = undefined;
    };

    const seekScene = (timeMs: number) => {
      transitionControllers.forEach((controller) => controller.seek(timeMs));
      app.requestRender();
    };

    const settlePlayback = (target: 'initial' | 'final') => {
      if (cancelled) return;
      if (playbackIdleTimer !== undefined) window.clearTimeout(playbackIdleTimer);
      playbackIdleTimer = undefined;
      cancelProgressFrame();
      progressMs = target === 'final' ? INTRO_PLAYBACK_DURATION : 0;
      eventManager?.pause?.();
      seekScene(progressMs);
      updatePhase(target);
      unlockScroll();
    };

    const advanceProgress = (now: number) => {
      if (cancelled || (phase !== 'playing-forward' && phase !== 'playing-reverse')) {
        cancelProgressFrame();
        return;
      }
      const elapsed = Math.min(64, Math.max(0, now - lastProgressAt));
      lastProgressAt = now;
      progressMs = Math.max(0, Math.min(INTRO_PLAYBACK_DURATION, progressMs + elapsed * activeDirection));
      seekScene(progressMs);
      stage.dataset.sceneProgress = (progressMs / INTRO_PLAYBACK_DURATION).toFixed(3);
      if (activeDirection > 0 && progressMs >= INTRO_PLAYBACK_DURATION) {
        settlePlayback('final');
        return;
      }
      if (activeDirection < 0 && progressMs <= 0) {
        settlePlayback('initial');
        return;
      }
      progressRaf = window.requestAnimationFrame(advanceProgress);
    };

    const pausePlayback = () => {
      playbackIdleTimer = undefined;
      if (phase !== 'playing-forward' && phase !== 'playing-reverse') return;
      eventManager?.pause?.();
      cancelProgressFrame();
      updatePhase(activeDirection > 0 ? 'paused-forward' : 'paused-reverse');
      seekScene(progressMs);
    };

    const requestedDirection = (direction: -1 | 1) => {
      if (
        cancelled
        || reducedMotion
        || !sceneReady
        || startObjects.length === 0
        || document.querySelector('[data-sticker-scene-preheat-dialog]')
      ) return false;
      if (direction > 0 && progressMs >= INTRO_PLAYBACK_DURATION) return false;
      if (direction < 0 && progressMs <= 0) return false;

      const wasPlaying = phase === 'playing-forward' || phase === 'playing-reverse';
      if (wasPlaying && lastProgressAt > 0) {
        const now = performance.now();
        const elapsed = Math.min(64, Math.max(0, now - lastProgressAt));
        progressMs = Math.max(0, Math.min(INTRO_PLAYBACK_DURATION, progressMs + elapsed * activeDirection));
        seekScene(progressMs);
        lastProgressAt = now;
      }

      lockScroll();
      activeDirection = direction;
      updatePhase(direction > 0 ? 'playing-forward' : 'playing-reverse');

      if (progressRaf === undefined) {
        lastProgressAt = performance.now();
        progressRaf = window.requestAnimationFrame(advanceProgress);
      }
      if (playbackIdleTimer !== undefined) window.clearTimeout(playbackIdleTimer);
      playbackIdleTimer = window.setTimeout(pausePlayback, PLAYBACK_IDLE_DELAY);
      return true;
    };

    const getScrollBoundaries = () => {
      const rect = section.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      return { start: top, end: top + rect.height - window.innerHeight };
    };

    const gateProjectedCrossing = (direction: -1 | 1, projectedScrollY: number) => {
      if (!sceneReady || reducedMotion) return false;
      const currentScrollY = window.scrollY;
      const { start, end } = getScrollBoundaries();
      if (direction > 0 && progressMs < INTRO_PLAYBACK_DURATION && currentScrollY < start && projectedScrollY >= start) {
        window.scrollTo({ top: start, left: window.scrollX, behavior: 'instant' });
        return requestedDirection(1);
      }
      if (direction < 0 && progressMs > 0 && currentScrollY > end && projectedScrollY <= end) {
        window.scrollTo({ top: end, left: window.scrollX, behavior: 'instant' });
        return requestedDirection(-1);
      }
      return false;
    };

    const handleWheel = (event: WheelEvent) => {
      if (reducedMotion || Math.abs(event.deltaY) < 1) return;
      const direction: -1 | 1 = event.deltaY > 0 ? 1 : -1;
      if (scrollLocked) {
        requestedDirection(direction);
        event.preventDefault();
        return;
      }
      if (gateProjectedCrossing(direction, window.scrollY + event.deltaY)) {
        event.preventDefault();
        return;
      }
      const isInsideGate = Boolean(pinTrigger?.isActive) || scrollLocked;
      if (!isInsideGate) return;
      if (requestedDirection(direction)) event.preventDefault();
    };

    const stopSplineWheel = (event: WheelEvent) => {
      // Keep wheel/trackpad input for the document. Stopping propagation here
      // prevents Spline from interpreting it as camera dolly or trackpad pan;
      // the default page scroll remains untouched when the gate is open.
      event.stopPropagation();
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (reducedMotion || touchY === undefined) return;
      const currentY = event.touches[0]?.clientY;
      if (currentY === undefined) return;
      const delta = touchY - currentY;
      touchY = currentY;
      if (Math.abs(delta) < 2) return;
      const direction: -1 | 1 = delta > 0 ? 1 : -1;
      if (scrollLocked) {
        requestedDirection(direction);
        event.preventDefault();
        return;
      }
      if (gateProjectedCrossing(direction, window.scrollY + delta)) {
        event.preventDefault();
        return;
      }
      const isInsideGate = Boolean(pinTrigger?.isActive) || scrollLocked;
      if (isInsideGate && requestedDirection(direction)) event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (reducedMotion || event.defaultPrevented || !SCROLL_KEYS.has(event.key) || isEditableTarget(event.target)) return;
      const direction: -1 | 1 = event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home' || (event.key === ' ' && event.shiftKey) ? -1 : 1;
      const keyDistance = event.key === 'ArrowDown' || event.key === 'ArrowUp' ? 40 : window.innerHeight * 0.9;
      if (scrollLocked) {
        requestedDirection(direction);
        event.preventDefault();
        return;
      }
      if (gateProjectedCrossing(direction, window.scrollY + direction * keyDistance)) {
        event.preventDefault();
        return;
      }
      const isInsideGate = Boolean(pinTrigger?.isActive) || scrollLocked;
      if (!isInsideGate) return;
      if (requestedDirection(direction)) event.preventDefault();
    };

    const holdScrollPosition = () => {
      if (!scrollLocked || Math.abs(window.scrollY - lockedScrollY) < 1) return;
      window.scrollTo({ top: lockedScrollY, left: window.scrollX, behavior: 'instant' });
    };

    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('scroll', holdScrollPosition, { passive: true });
    stage.addEventListener('wheel', stopSplineWheel, { capture: true, passive: true });

    const cleanup = () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
      if (preheatTimer !== undefined) window.clearTimeout(preheatTimer);
      if (readyRaf !== undefined) window.cancelAnimationFrame(readyRaf);
      if (playbackIdleTimer !== undefined) window.clearTimeout(playbackIdleTimer);
      cancelProgressFrame();
      transitionControllers.forEach((controller) => controller.pause());
      transitionControllers = [];
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('scroll', holdScrollPosition);
      stage.removeEventListener('wheel', stopSplineWheel, { capture: true });
      unlockScroll();
      pinTrigger?.kill();
    };

    cleanupRef.current = cleanup;
    pinTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: stage,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: () => {
        if (!scrollLocked && progressMs < INTRO_PLAYBACK_DURATION) requestedDirection(1);
      },
      onEnterBack: () => {
        if (!scrollLocked && progressMs > 0) requestedDirection(-1);
      },
    });

    const initializeWhenReady = () => {
      if (cancelled || splineRef.current !== app) return;

      const allObjects = app.getAllObjects();
      const events = getSplineEventsSafely(app);
      startObjects = getStartEventObjects(app, events);
      const backdrop = app.findObjectByName('Backdrop');

      if (backdrop?.visible) {
        backdrop.hide();
      }
      // Spline's runtime ignores alpha in background colors. Matching the
      // canvas clear color to this section removes the exported rectangle.
      app.setBackgroundColor('#cb9933');
      app.setZoom(SCENE_ZOOM);
      const orbitControls = getOrbitControls(app);
      if (orbitControls) {
        orbitControls.enableZoom = false;
        orbitControls.isTouchZoom = false;
        orbitControls.enablePan = true;
        orbitControls.enableRotate = true;
        // Runtime input mode 3 maps primary drag to orbit and Shift+drag to pan.
        if (Array.isArray(orbitControls.mouseButtons)) orbitControls.mouseButtons[0] = 3;
        orbitControls.update?.();
      }
      app.canvas.style.touchAction = 'pan-y pinch-zoom';
      app.requestRender();

      if (import.meta.env.DEV) {
        const debugWindow = window as SplineDebugWindow;
        debugWindow.__MC_SPLINE_APP__ = app;
        debugWindow.__MC_SPLINE_OBJECTS__ = allObjects.map((object) => ({ name: object.name, id: object.uuid, color: object.color }));
        debugWindow.__MC_SPLINE_EVENTS__ = events;
      }

      if (startObjects.length === 0) {
        pollCount += 1;
        if (pollCount < READY_POLL_LIMIT) {
          pollTimer = window.setTimeout(initializeWhenReady, READY_POLL_INTERVAL);
        } else {
          updatePhase('final');
          setIsLoaded(true);
          dispatchSceneStatus('mc:spline-error');
        }
        return;
      }

      const finishPreheat = (target: 'initial' | 'final') => {
        if (cancelled || splineRef.current !== app) return;
        progressMs = target === 'final' ? INTRO_PLAYBACK_DURATION : 0;
        eventManager?.pause?.();
        sceneReady = true;
        updatePhase(target);
        setIsLoaded(true);
        dispatchSceneStatus('mc:spline-ready');
        ScrollTrigger.refresh();
      };

      eventManager?.pause?.();

      if (reducedMotion) {
        // Resolve directly to the authored final state and pause only Spline's
        // event timelines. Camera controls and on-demand rendering stay live.
        startObjects.forEach((object) => {
          try {
            object.state = 'State';
          } catch {
            // Ignore an object disposed during hot reload.
          }
        });
        app.requestRender();
        readyRaf = window.requestAnimationFrame(() => {
          finishPreheat('final');
        });
        return;
      }

      startObjects.forEach((object) => {
        try {
          object.state = undefined;
        } catch {
          // Ignore an object disposed during hot reload.
        }
      });
      transitionControllers = startObjects.map((object) => {
        const delay = STICKER_TRANSITION_DELAYS.get(object.uuid);
        if (delay === undefined) throw new Error(`Missing authored transition timing for ${object.uuid}.`);
        return object.transition({
          from: null,
          to: 'State',
          duration: 3_000,
          delay,
          easing: SPLINE_EASE_IN_OUT,
          autoPlay: false,
        }).pause().seek(0);
      });
      seekScene(0);
      // onLoad has resolved all scene assets; this short hold lets the first
      // GPU frame settle behind the preheat takeover before it exits.
      preheatTimer = window.setTimeout(() => {
        readyRaf = window.requestAnimationFrame(() => finishPreheat('initial'));
      }, 320);
    };

    initializeWhenReady();
  }, []);

  const handleLoad = useCallback((app: Application) => {
    splineRef.current = app;
    app.setGlobalEvents(false);
    setIsLoaded(false);
    dispatchSceneStatus('mc:spline-loading');
    setupScroll(app);
  }, [setupScroll]);

  const handleSceneError = useCallback(() => {
    cleanupRef.current?.();
    setIsLoaded(true);
    dispatchSceneStatus('mc:spline-error');
  }, []);

  useEffect(() => {
    dispatchSceneStatus('mc:spline-loading');
    return () => cleanupRef.current?.();
  }, []);

  return (
    <section ref={sectionRef} data-sticker-scene-section className="relative h-[115vh] bg-lab-gold text-lab-black">
      <div ref={stageRef} className="relative h-screen overflow-hidden bg-lab-gold">
        <div
          className="absolute inset-0 origin-center will-change-transform"
          style={{ transform: 'translate3d(clamp(2rem, 9vw, 9rem), 0, 0) scale(1.1)' }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-lab-gold" role="status">
              <span className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-lab-black/55">Loading sticker scene…</span>
            </div>
          )}
          <SplineSceneErrorBoundary onError={handleSceneError}>
            <Suspense fallback={null}>
              <Spline
                scene="/assets/3d/stickers-scene-brand-v3.splinecode"
                onLoad={handleLoad}
                renderOnDemand
                className="h-full w-full [&_canvas]:!bg-transparent"
                style={{ background: 'transparent' }}
              />
            </Suspense>
          </SplineSceneErrorBoundary>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(203,153,51,0.92)_0%,rgba(203,153,51,0.62)_28%,rgba(203,153,51,0)_62%)]" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto flex h-full max-w-7xl items-start px-6 pt-28 sm:px-8 sm:pt-32 lg:px-10 lg:pt-36">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-lab-red sm:text-sm">Custom stickers</p>
            <h2 className="mt-3 max-w-[7ch] font-display text-[clamp(4.5rem,10vw,10.5rem)] font-bold uppercase leading-[0.78] tracking-[-0.045em]">
              Make it<br />stick.
            </h2>
          </div>
        </div>

      </div>
    </section>
  );
}
