import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import type { Application, SPEObject } from '@splinetool/runtime';

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

type Vector3 = readonly [number, number, number];

type StickerTrackDefinition = {
  id: string;
  delay: number;
  from: {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
  };
  to: {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
  };
};

type StickerTrack = StickerTrackDefinition & { object: SPEObject };

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

type SplineDebugWindow = Window & {
  __MC_SPLINE_APP__?: Application;
  __MC_SPLINE_OBJECTS__?: Array<{ name: string; id: string }>;
};

const READY_POLL_INTERVAL = 180;
const READY_POLL_LIMIT = 50;
const INTRO_PLAYBACK_DURATION = 5_000;
const TRACK_DURATION = 3_000;
const PAN_RETURN_DURATION = 440;
const DESKTOP_SCENE_ZOOM = 2.05;
const MOBILE_SCENE_ZOOM = 1.6;
const DEGREES_TO_RADIANS = Math.PI / 180;
const WHEEL_BURST_GAP = 650;
const SCROLL_BOUNDARY_EPSILON = 1;
const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' ']);

// These are the authored Base and State transforms. The two original full-spin
// paths have been normalized to their equivalent shortest angles so the front
// artwork stays facing the viewer instead of flashing the plain sticker backs.
const STICKER_TRACKS: StickerTrackDefinition[] = [
  {
    id: 'd9120f9d-8cff-492b-bd91-1e084fc96f84',
    delay: 1_400,
    from: {
      position: [-21.5745166926, -8.4886221254, -30],
      rotation: [90, 0, 0],
      scale: [300, 300, 300],
    },
    to: {
      position: [-0.8147166503, -4.1869846017, 55.4989690991],
      rotation: [62, -3.97, 12.8],
      scale: [800, 800, 800],
    },
  },
  {
    id: '6dec1384-1629-46fa-bfb6-a7017ee021c4',
    delay: 1_000,
    from: {
      position: [3.9372433947, -5.6872322467, -32.64],
      rotation: [90, 0, 0],
      scale: [300, 20, 20],
    },
    to: {
      position: [-77.3118600077, 1.5097974471, -40.6996413927],
      rotation: [81.2262535769, 10.9145243741, -36.7210768543],
      scale: [500, 500, 500],
    },
  },
  {
    id: '6f32aac6-21e0-436c-8b13-494c1f25bbb0',
    delay: 1_000,
    from: {
      position: [5.5135117648, -3.9420259062, -8.2238970152],
      rotation: [90, 0, 0],
      scale: [500, 499.9999960674, 499.9999960674],
    },
    to: {
      position: [75.5062428291, -2.2168667901, 9.9755012437],
      rotation: [63.78, -2.97, 29.23],
      scale: [500, 499.9999960674, 499.9999960674],
    },
  },
  {
    id: 'a61efeda-ebda-463c-9606-d38d8353bf73',
    delay: 2_000,
    from: {
      position: [17.94, -10.59, -59.21],
      rotation: [90, 21, 1.7054227567],
      scale: [100, 100, 100],
    },
    to: {
      position: [5.2234361731, 56.2019810104, -16.2428461586],
      rotation: [91.89, 15.0966563783, 26.6640200527],
      scale: [500, 500, 500],
    },
  },
];

const STICKER_BACK_IDS = [
  '91ee1369-c247-43d9-bdc3-8e6e1cef7e39',
  'be6b8d40-dc3b-4a66-adda-cb5147901a14',
  '714b76a2-4684-415e-9d2f-9872619f6a9c',
  'd95c0965-bc2d-4540-8302-76243d1ba9fb',
];

function getOrbitControls(app: Application): OrbitControlsLike | undefined {
  return (app.controls as { orbitControls?: OrbitControlsLike } | undefined)?.orbitControls;
}

function getEventManager(app: Application): SplineEventManagerLike | undefined {
  return app.eventManager as SplineEventManagerLike | undefined;
}

function dispatchSceneStatus(type: 'mc:spline-loading' | 'mc:spline-ready' | 'mc:spline-error') {
  window.dispatchEvent(new CustomEvent(type));
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

// Smoothstep is monotonic and symmetric, so reversing the document scroll
// follows the exact same visual path without state callbacks or timeline races.
function easeInOut(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function readTranslation(element: HTMLElement) {
  const transform = window.getComputedStyle(element).transform;
  if (!transform || transform === 'none') return { x: 0, y: 0 };

  try {
    const matrix = new DOMMatrixReadOnly(transform);
    return { x: matrix.m41, y: matrix.m42 };
  } catch {
    return { x: 0, y: 0 };
  }
}

function applyVector(
  target: { x: number; y: number; z: number },
  from: Vector3,
  to: Vector3,
  progress: number,
  multiplier = 1,
) {
  target.x = lerp(from[0], to[0], progress) * multiplier;
  target.y = lerp(from[1], to[1], progress) * multiplier;
  target.z = lerp(from[2], to[2], progress) * multiplier;
}

function applyTrack(track: StickerTrack, masterProgress: number) {
  const playhead = masterProgress * INTRO_PLAYBACK_DURATION;
  const localProgress = easeInOut(clamp01((playhead - track.delay) / TRACK_DURATION));
  applyVector(track.object.position, track.from.position, track.to.position, localProgress);
  applyVector(track.object.rotation, track.from.rotation, track.to.rotation, localProgress, DEGREES_TO_RADIANS);
  applyVector(track.object.scale, track.from.scale, track.to.scale, localProgress);
}

export default function StickerSplineScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panLayerRef = useRef<HTMLDivElement>(null);
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
    let scrollRaf: number | undefined;
    let sectionTop = 0;
    let scrollRange = 1;
    let lastScrollY = window.scrollY;
    let heldBoundary: 'start' | 'end' | undefined;
    let scrollIntentId = 0;
    let heldIntentId: number | undefined;
    let lastWheelIntentAt = Number.NEGATIVE_INFINITY;
    let lastProgress = Number.NaN;
    let currentZoom = 0;
    let tracks: StickerTrack[] = [];
    let panX = 0;
    let panY = 0;
    let panStartX = 0;
    let panStartY = 0;
    let panOriginX = 0;
    let panOriginY = 0;
    let activePointerId: number | undefined;
    let snapTimer: number | undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyProgress = (progress: number, force = false) => {
      const clampedProgress = clamp01(progress);
      const endpointProgress = clampedProgress <= 0.0005 ? 0 : clampedProgress >= 0.9995 ? 1 : clampedProgress;
      const nextProgress = reducedMotion ? 1 : endpointProgress;
      if (!force && Math.abs(nextProgress - lastProgress) < 0.0001) return;
      lastProgress = nextProgress;
      tracks.forEach((track) => applyTrack(track, nextProgress));
      stage.dataset.sceneProgress = nextProgress.toFixed(3);
      stage.dataset.scenePhase = nextProgress <= 0 ? 'initial' : nextProgress >= 1 ? 'final' : 'scrubbing';
      app.requestRender();
    };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      sectionTop = rect.top + window.scrollY;
      scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
      const nextZoom = window.innerWidth < 640 ? MOBILE_SCENE_ZOOM : DESKTOP_SCENE_ZOOM;
      if (nextZoom !== currentZoom) {
        currentZoom = nextZoom;
        app.setZoom(nextZoom);
      }
      lastScrollY = window.scrollY;
      applyProgress((window.scrollY - sectionTop) / scrollRange, true);
    };

    const syncFromScroll = () => {
      scrollRaf = undefined;
      const sectionStart = sectionTop;
      const sectionEnd = sectionTop + scrollRange;
      const currentScrollY = window.scrollY;

      if (heldBoundary) {
        const boundaryY = heldBoundary === 'start' ? sectionStart : sectionEnd;
        const momentumMovingOutside = heldBoundary === 'start'
          ? currentScrollY > boundaryY + 1
          : currentScrollY < boundaryY - 1;

        if (heldIntentId === scrollIntentId && momentumMovingOutside) {
          window.scrollTo({ top: boundaryY, left: window.scrollX, behavior: 'instant' });
          lastScrollY = boundaryY;
          applyProgress((boundaryY - sectionStart) / scrollRange);
          return;
        }

        if (heldIntentId !== scrollIntentId) {
          heldBoundary = undefined;
          heldIntentId = undefined;
        }
      }

      let boundaryTarget: number | undefined;

      // Catch a single extreme wheel, touch, keyboard, or scrollbar jump at
      // each edge. Ordinary document scrolling remains native and continuous.
      if (lastScrollY < sectionStart - SCROLL_BOUNDARY_EPSILON && currentScrollY >= sectionEnd) boundaryTarget = sectionStart;
      else if (lastScrollY > sectionEnd + SCROLL_BOUNDARY_EPSILON && currentScrollY <= sectionStart) boundaryTarget = sectionEnd;
      else if (lastScrollY >= sectionStart - SCROLL_BOUNDARY_EPSILON && lastScrollY < sectionEnd - SCROLL_BOUNDARY_EPSILON && currentScrollY >= sectionEnd) boundaryTarget = sectionEnd;
      else if (lastScrollY <= sectionEnd + SCROLL_BOUNDARY_EPSILON && lastScrollY > sectionStart + SCROLL_BOUNDARY_EPSILON && currentScrollY <= sectionStart) boundaryTarget = sectionStart;

      if (boundaryTarget !== undefined) {
        window.scrollTo({ top: boundaryTarget, left: window.scrollX, behavior: 'instant' });
        lastScrollY = boundaryTarget;
        heldBoundary = boundaryTarget === sectionStart ? 'start' : 'end';
        heldIntentId = scrollIntentId;
        stage.dataset.sceneBoundary = heldBoundary;
        applyProgress((boundaryTarget - sectionStart) / scrollRange);
        return;
      }

      delete stage.dataset.sceneBoundary;
      lastScrollY = currentScrollY;
      applyProgress((currentScrollY - sectionStart) / scrollRange);
    };

    const requestScrollSync = () => {
      if (scrollRaf === undefined) scrollRaf = window.requestAnimationFrame(syncFromScroll);
    };

    const holdAtBoundary = (boundary: 'start' | 'end') => {
      const boundaryY = boundary === 'start' ? sectionTop : sectionTop + scrollRange;
      window.scrollTo({ top: boundaryY, left: window.scrollX, behavior: 'instant' });
      lastScrollY = boundaryY;
      heldBoundary = boundary;
      heldIntentId = scrollIntentId;
      stage.dataset.sceneBoundary = boundary;
      applyProgress(boundary === 'start' ? 0 : 1);
    };

    const handleWheelIntent = (event: WheelEvent) => {
      const now = performance.now();
      const gap = now - lastWheelIntentAt;
      if (gap > WHEEL_BURST_GAP) scrollIntentId += 1;
      lastWheelIntentAt = now;

      if (heldBoundary && heldIntentId === scrollIntentId) {
        event.preventDefault();
        return;
      }

      if (heldBoundary && heldIntentId !== scrollIntentId) {
        heldBoundary = undefined;
        heldIntentId = undefined;
        delete stage.dataset.sceneBoundary;
      }

      const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? window.innerHeight
          : 1;
      const deltaY = event.deltaY * deltaMultiplier;
      const sectionStart = sectionTop;
      const sectionEnd = sectionTop + scrollRange;
      const projectedScrollY = window.scrollY + deltaY;
      let boundary: 'start' | 'end' | undefined;

      if (deltaY > 0 && window.scrollY < sectionStart - SCROLL_BOUNDARY_EPSILON && projectedScrollY >= sectionEnd) boundary = 'start';
      else if (deltaY > 0 && window.scrollY >= sectionStart - SCROLL_BOUNDARY_EPSILON && window.scrollY < sectionEnd - SCROLL_BOUNDARY_EPSILON && projectedScrollY >= sectionEnd) boundary = 'end';
      else if (deltaY < 0 && window.scrollY > sectionEnd + SCROLL_BOUNDARY_EPSILON && projectedScrollY <= sectionStart) boundary = 'end';
      else if (deltaY < 0 && window.scrollY <= sectionEnd + SCROLL_BOUNDARY_EPSILON && window.scrollY > sectionStart + SCROLL_BOUNDARY_EPSILON && projectedScrollY <= sectionStart) boundary = 'start';

      if (boundary) {
        event.preventDefault();
        holdAtBoundary(boundary);
        return;
      }

      // Own wheel movement so Spline never receives a camera-dolly gesture.
      // Trackpads still supply their native momentum deltas; each delta simply
      // advances the document instead of altering the scene camera.
      event.preventDefault();
      window.scrollTo({ top: window.scrollY + deltaY, left: window.scrollX, behavior: 'instant' });
    };

    const noteTouchIntent = () => {
      scrollIntentId += 1;
    };

    const noteKeyboardIntent = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) scrollIntentId += 1;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const panLayer = panLayerRef.current;
      if (event.pointerType === 'touch' || event.button !== 0 || !panLayer) return;
      if (snapTimer !== undefined) {
        window.clearTimeout(snapTimer);
        snapTimer = undefined;
      }
      const currentPan = readTranslation(panLayer);
      panLayer.style.transition = 'none';
      panLayer.style.transform = `translate3d(${currentPan.x}px, ${currentPan.y}px, 0)`;
      panX = currentPan.x;
      panY = currentPan.y;
      activePointerId = event.pointerId;
      panStartX = event.clientX;
      panStartY = event.clientY;
      panOriginX = panX;
      panOriginY = panY;
      stage.setPointerCapture(event.pointerId);
      stage.dataset.sceneDragging = 'true';
      event.preventDefault();
      event.stopPropagation();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId || !panLayerRef.current) return;
      const maxX = Math.min(180, window.innerWidth * 0.14);
      const maxY = Math.min(110, window.innerHeight * 0.14);
      panX = Math.max(-maxX, Math.min(maxX, panOriginX + event.clientX - panStartX));
      panY = Math.max(-maxY, Math.min(maxY, panOriginY + event.clientY - panStartY));
      panLayerRef.current.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
      event.preventDefault();
      event.stopPropagation();
    };

    const finishPointerPan = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;
      activePointerId = undefined;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      delete stage.dataset.sceneDragging;
      const panLayer = panLayerRef.current;
      if (panLayer) {
        panLayer.style.transition = reducedMotion
          ? 'none'
          : `transform ${PAN_RETURN_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        panLayer.style.transform = `translate3d(${panOriginX}px, ${panOriginY}px, 0)`;
        panX = panOriginX;
        panY = panOriginY;
        snapTimer = window.setTimeout(() => {
          panLayer.style.transition = 'none';
          snapTimer = undefined;
        }, reducedMotion ? 0 : PAN_RETURN_DURATION);
      }
      event.stopPropagation();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(section);
    window.addEventListener('wheel', handleWheelIntent, { capture: true, passive: false });
    window.addEventListener('touchstart', noteTouchIntent, { capture: true, passive: true });
    window.addEventListener('keydown', noteKeyboardIntent, { capture: true });
    window.addEventListener('scroll', requestScrollSync, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    stage.addEventListener('pointerdown', handlePointerDown, { capture: true });
    stage.addEventListener('pointermove', handlePointerMove, { capture: true });
    stage.addEventListener('pointerup', finishPointerPan, { capture: true });
    stage.addEventListener('pointercancel', finishPointerPan, { capture: true });
    stage.addEventListener('lostpointercapture', finishPointerPan, { capture: true });

    const cleanup = () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
      if (preheatTimer !== undefined) window.clearTimeout(preheatTimer);
      if (snapTimer !== undefined) window.clearTimeout(snapTimer);
      if (scrollRaf !== undefined) window.cancelAnimationFrame(scrollRaf);
      resizeObserver.disconnect();
      window.removeEventListener('wheel', handleWheelIntent, { capture: true });
      window.removeEventListener('touchstart', noteTouchIntent, { capture: true });
      window.removeEventListener('keydown', noteKeyboardIntent, { capture: true });
      window.removeEventListener('scroll', requestScrollSync);
      window.removeEventListener('resize', measure);
      stage.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      stage.removeEventListener('pointermove', handlePointerMove, { capture: true });
      stage.removeEventListener('pointerup', finishPointerPan, { capture: true });
      stage.removeEventListener('pointercancel', finishPointerPan, { capture: true });
      stage.removeEventListener('lostpointercapture', finishPointerPan, { capture: true });
    };

    cleanupRef.current = cleanup;

    const initializeWhenReady = () => {
      if (cancelled || splineRef.current !== app) return;

      const resolvedTracks = STICKER_TRACKS.map((definition) => {
        const object = app.findObjectById(definition.id);
        return object ? { ...definition, object } : null;
      });

      if (resolvedTracks.some((track) => track === null)) {
        pollCount += 1;
        if (pollCount < READY_POLL_LIMIT) {
          pollTimer = window.setTimeout(initializeWhenReady, READY_POLL_INTERVAL);
        } else {
          setIsLoaded(true);
          dispatchSceneStatus('mc:spline-error');
        }
        return;
      }

      tracks = resolvedTracks.filter((track): track is StickerTrack => track !== null);
      getEventManager(app)?.pause?.();

      const backdrop = app.findObjectByName('Backdrop');
      if (backdrop?.visible) backdrop.hide();
      STICKER_BACK_IDS.forEach((id) => {
        const back = app.findObjectById(id);
        if (back) back.color = '#101820';
      });

      app.setBackgroundColor('#cb9933');
      const orbitControls = getOrbitControls(app);
      if (orbitControls) {
        orbitControls.enableZoom = false;
        orbitControls.isTouchZoom = false;
        orbitControls.enablePan = true;
        orbitControls.enableRotate = true;
        if (Array.isArray(orbitControls.mouseButtons)) orbitControls.mouseButtons[0] = 3;
        orbitControls.update?.();
      }
      app.canvas.style.touchAction = 'pan-y pinch-zoom';

      tracks.forEach(({ object }) => {
        try {
          object.state = undefined;
        } catch {
          // Ignore an object disposed during hot reload.
        }
      });

      if (import.meta.env.DEV) {
        const debugWindow = window as SplineDebugWindow;
        debugWindow.__MC_SPLINE_APP__ = app;
        debugWindow.__MC_SPLINE_OBJECTS__ = app.getAllObjects().map((object) => ({ name: object.name, id: object.uuid }));
      }

      measure();
      preheatTimer = window.setTimeout(() => {
        if (cancelled || splineRef.current !== app) return;
        applyProgress((window.scrollY - sectionTop) / scrollRange, true);
        setIsLoaded(true);
        dispatchSceneStatus('mc:spline-ready');
      }, 280);
    };

    initializeWhenReady();
  }, []);

  const handleLoad = useCallback((app: Application) => {
    splineRef.current = app;
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
    <section ref={sectionRef} data-sticker-scene-section className="relative h-[240vh] bg-lab-gold text-lab-black motion-reduce:h-screen">
      <div ref={stageRef} className="sticky top-0 h-screen cursor-grab overflow-hidden bg-lab-gold data-[scene-dragging=true]:cursor-grabbing">
        <div ref={panLayerRef} className="absolute inset-0 will-change-transform">
          <div
            className="absolute inset-0 origin-center translate-x-[22vw] scale-[1.14] will-change-transform sm:translate-x-[32vw] sm:scale-[1.3]"
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
