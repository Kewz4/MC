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
  enabled?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  enableZoom?: boolean;
  isTouchZoom?: boolean;
  mouseButtons?: number[];
  update?: () => void;
};

type SplineEventManagerLike = {
  pause?: () => void;
  eventContext?: SplineEventContextLike;
};

type RuntimePoint = { x: number; y: number; z: number };

type RuntimeObject = {
  uuid?: string;
  parent?: RuntimeObject | null;
  object?: RuntimeObject;
};

type RuntimeRay = {
  origin: RuntimePoint;
  direction: RuntimePoint;
};

type RuntimeHit = {
  object?: RuntimeObject;
  point?: RuntimePoint;
};

type SplineEventContextLike = {
  domRect?: DOMRect;
  updateRaycaster?: (event: PointerEvent) => void;
  raycaster?: { ray?: RuntimeRay };
  page?: { raycastWithClones?: (raycaster: unknown) => RuntimeHit[] };
};

type DragOffset = RuntimePoint;

type StickerHit = {
  track: StickerTrack;
  point: RuntimePoint;
};

type ActiveStickerDrag = {
  pointerId: number;
  track: StickerTrack;
  planePoint: RuntimePoint;
  planeNormal: RuntimePoint;
  startIntersection: RuntimePoint;
  startOffset: DragOffset;
};

type SplineDebugWindow = Window & {
  __MC_SPLINE_APP__?: Application;
  __MC_SPLINE_OBJECTS__?: Array<{ name: string; id: string }>;
};

const READY_POLL_INTERVAL = 180;
const READY_POLL_LIMIT = 50;
const INTRO_PLAYBACK_DURATION = 5_000;
const TRACK_DURATION = 3_000;
const DRAG_RETURN_DURATION = 440;
const DESKTOP_SCENE_ZOOM = 2.25;
const MOBILE_SCENE_ZOOM = 1.72;
const DEGREES_TO_RADIANS = Math.PI / 180;
const SCROLL_BOUNDARY_EPSILON = 1;

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

function applyTrack(track: StickerTrack, masterProgress: number, dragOffset?: DragOffset) {
  const playhead = masterProgress * INTRO_PLAYBACK_DURATION;
  const localProgress = easeInOut(clamp01((playhead - track.delay) / TRACK_DURATION));
  applyVector(track.object.position, track.from.position, track.to.position, localProgress);
  if (dragOffset) {
    track.object.position.x += dragOffset.x;
    track.object.position.y += dragOffset.y;
    track.object.position.z += dragOffset.z;
  }
  applyVector(track.object.rotation, track.from.rotation, track.to.rotation, localProgress, DEGREES_TO_RADIANS);
  applyVector(track.object.scale, track.from.scale, track.to.scale, localProgress);
}

function copyPoint(point: RuntimePoint): RuntimePoint {
  return { x: point.x, y: point.y, z: point.z };
}

function normalizePoint(point: RuntimePoint): RuntimePoint | null {
  const length = Math.hypot(point.x, point.y, point.z);
  if (!Number.isFinite(length) || length < 0.000001) return null;
  return { x: point.x / length, y: point.y / length, z: point.z / length };
}

function intersectRayWithPlane(ray: RuntimeRay, planePoint: RuntimePoint, planeNormal: RuntimePoint): RuntimePoint | null {
  const denominator = ray.direction.x * planeNormal.x
    + ray.direction.y * planeNormal.y
    + ray.direction.z * planeNormal.z;
  if (Math.abs(denominator) < 0.000001) return null;

  const distance = (
    (planePoint.x - ray.origin.x) * planeNormal.x
    + (planePoint.y - ray.origin.y) * planeNormal.y
    + (planePoint.z - ray.origin.z) * planeNormal.z
  ) / denominator;

  return {
    x: ray.origin.x + ray.direction.x * distance,
    y: ray.origin.y + ray.direction.y * distance,
    z: ray.origin.z + ray.direction.z * distance,
  };
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
    let scrollRaf: number | undefined;
    let wheelRaf: number | undefined;
    let endpointPaintRaf: number | undefined;
    let pointerMoveRaf: number | undefined;
    let latestPointerMove: PointerEvent | undefined;
    let sectionTop = 0;
    let scrollRange = 1;
    let lastScrollY = window.scrollY;
    let pendingWheelDelta = 0;
    let boundaryGuard: 'start' | 'end' | undefined;
    let endpointReleaseReady: 'start' | 'end' | undefined;
    let lastProgress = Number.NaN;
    let currentZoom = 0;
    let tracks: StickerTrack[] = [];
    let tracksById = new Map<string, StickerTrack>();
    let raycastContext: SplineEventContextLike | undefined;
    let activeDrag: ActiveStickerDrag | undefined;
    const dragOffsets = new Map<string, DragOffset>();
    const snapFrames = new Map<string, number>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyProgress = (progress: number, force = false) => {
      const clampedProgress = clamp01(progress);
      const endpointProgress = clampedProgress <= 0.0005 ? 0 : clampedProgress >= 0.9995 ? 1 : clampedProgress;
      const nextProgress = reducedMotion ? 1 : endpointProgress;
      if (!force && Math.abs(nextProgress - lastProgress) < 0.0001) return;
      lastProgress = nextProgress;
      tracks.forEach((track) => applyTrack(track, nextProgress, dragOffsets.get(track.id)));
      stage.dataset.sceneProgress = nextProgress.toFixed(3);
      stage.dataset.scenePhase = nextProgress <= 0 ? 'initial' : nextProgress >= 1 ? 'final' : 'scrubbing';
      app.requestRender();
    };

    const clearBoundaryGuard = () => {
      if (endpointPaintRaf !== undefined) window.cancelAnimationFrame(endpointPaintRaf);
      endpointPaintRaf = undefined;
      boundaryGuard = undefined;
      endpointReleaseReady = undefined;
      delete stage.dataset.sceneBoundary;
    };

    const guardRenderedEndpoint = (endpoint: 'start' | 'end') => {
      if (endpointPaintRaf !== undefined) window.cancelAnimationFrame(endpointPaintRaf);
      boundaryGuard = endpoint;
      endpointReleaseReady = undefined;
      stage.dataset.sceneBoundary = endpoint;

      // Two animation frames guarantee the endpoint has actually been painted
      // before an outward wheel/momentum event is allowed to leave the scene.
      endpointPaintRaf = window.requestAnimationFrame(() => {
        endpointPaintRaf = window.requestAnimationFrame(() => {
          endpointPaintRaf = undefined;
          if (boundaryGuard === endpoint) endpointReleaseReady = endpoint;
        });
      });
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
      if (raycastContext) raycastContext.domRect = app.canvas.getBoundingClientRect();
      lastScrollY = window.scrollY;
      applyProgress((window.scrollY - sectionTop) / scrollRange, true);
    };

    const syncFromScroll = () => {
      scrollRaf = undefined;
      const sectionStart = sectionTop;
      const sectionEnd = sectionTop + scrollRange;
      const currentScrollY = window.scrollY;

      if (boundaryGuard) {
        const boundaryY = boundaryGuard === 'start' ? sectionStart : sectionEnd;
        const movingOutward = boundaryGuard === 'start'
          ? currentScrollY < boundaryY - SCROLL_BOUNDARY_EPSILON
          : currentScrollY > boundaryY + SCROLL_BOUNDARY_EPSILON;
        const movingInward = boundaryGuard === 'start'
          ? currentScrollY > boundaryY + SCROLL_BOUNDARY_EPSILON
          : currentScrollY < boundaryY - SCROLL_BOUNDARY_EPSILON;

        if (movingOutward && endpointReleaseReady !== boundaryGuard) {
          window.scrollTo({ top: boundaryY, left: window.scrollX, behavior: 'instant' });
          lastScrollY = boundaryY;
          applyProgress(boundaryGuard === 'start' ? 0 : 1);
          return;
        }

        if (movingOutward || movingInward) clearBoundaryGuard();
      }

      let boundaryTarget: number | undefined;

      // Catch a single extreme wheel, touch, keyboard, or scrollbar jump at
      // each edge. Ordinary document scrolling remains native and continuous.
      if (lastScrollY < sectionStart - SCROLL_BOUNDARY_EPSILON && currentScrollY >= sectionStart) boundaryTarget = sectionStart;
      else if (lastScrollY > sectionEnd + SCROLL_BOUNDARY_EPSILON && currentScrollY <= sectionEnd) boundaryTarget = sectionEnd;
      else if (lastScrollY >= sectionStart - SCROLL_BOUNDARY_EPSILON && lastScrollY < sectionEnd - SCROLL_BOUNDARY_EPSILON && currentScrollY >= sectionEnd) boundaryTarget = sectionEnd;
      else if (lastScrollY <= sectionEnd + SCROLL_BOUNDARY_EPSILON && lastScrollY > sectionStart + SCROLL_BOUNDARY_EPSILON && currentScrollY <= sectionStart) boundaryTarget = sectionStart;

      if (boundaryTarget !== undefined) {
        window.scrollTo({ top: boundaryTarget, left: window.scrollX, behavior: 'instant' });
        lastScrollY = boundaryTarget;
        guardRenderedEndpoint(boundaryTarget === sectionStart ? 'start' : 'end');
        applyProgress((boundaryTarget - sectionStart) / scrollRange);
        return;
      }

      lastScrollY = currentScrollY;
      applyProgress((currentScrollY - sectionStart) / scrollRange);
    };

    const requestScrollSync = () => {
      if (scrollRaf === undefined) scrollRaf = window.requestAnimationFrame(syncFromScroll);
    };

    const handleWheelIntent = (event: WheelEvent) => {
      const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? window.innerHeight
          : 1;
      const deltaY = event.deltaY * deltaMultiplier;
      if (!Number.isFinite(deltaY) || Math.abs(deltaY) < 0.01) return;
      if (!event.cancelable) return;
      const sectionStart = sectionTop;
      const sectionEnd = sectionTop + scrollRange;
      const currentScrollY = window.scrollY;
      const projectedScrollY = currentScrollY + deltaY;

      // A high-velocity gesture may enter the section, but never jump across
      // it. The following event begins the scroll-linked sticker sequence.
      if (deltaY > 0 && currentScrollY < sectionStart - SCROLL_BOUNDARY_EPSILON) {
        if (projectedScrollY < sectionStart) return;
        event.preventDefault();
        pendingWheelDelta = 0;
        if (wheelRaf !== undefined) window.cancelAnimationFrame(wheelRaf);
        wheelRaf = undefined;
        window.scrollTo({ top: sectionStart, left: window.scrollX, behavior: 'instant' });
        lastScrollY = sectionStart;
        guardRenderedEndpoint('start');
        applyProgress(0);
        return;
      }
      if (deltaY < 0 && currentScrollY > sectionEnd + SCROLL_BOUNDARY_EPSILON) {
        if (projectedScrollY > sectionEnd) return;
        event.preventDefault();
        pendingWheelDelta = 0;
        if (wheelRaf !== undefined) window.cancelAnimationFrame(wheelRaf);
        wheelRaf = undefined;
        window.scrollTo({ top: sectionEnd, left: window.scrollX, behavior: 'instant' });
        lastScrollY = sectionEnd;
        guardRenderedEndpoint('end');
        applyProgress(1);
        return;
      }

      const insideSection = currentScrollY >= sectionStart - SCROLL_BOUNDARY_EPSILON
        && currentScrollY <= sectionEnd + SCROLL_BOUNDARY_EPSILON;
      if (!insideSection) return;

      // Once the authored endpoint is visibly reached, the outward direction
      // returns to native document scrolling immediately.
      if ((deltaY < 0 && currentScrollY <= sectionStart + SCROLL_BOUNDARY_EPSILON)
        || (deltaY > 0 && currentScrollY >= sectionEnd - SCROLL_BOUNDARY_EPSILON)) {
        const endpoint = deltaY < 0 ? 'start' : 'end';
        if (boundaryGuard === endpoint && endpointReleaseReady !== endpoint) {
          event.preventDefault();
          return;
        }
        clearBoundaryGuard();
        return;
      }

      event.preventDefault();
      pendingWheelDelta += deltaY;
      if (wheelRaf !== undefined) return;

      wheelRaf = window.requestAnimationFrame(() => {
        wheelRaf = undefined;
        const accumulatedDelta = pendingWheelDelta;
        pendingWheelDelta = 0;
        if (Math.abs(accumulatedDelta) < 0.01) return;

        const maxStep = Math.max(120, Math.min(scrollRange * 0.18, window.innerHeight * 0.28));
        const cappedDelta = Math.sign(accumulatedDelta) * Math.min(Math.abs(accumulatedDelta), maxStep);
        const targetScrollY = Math.max(sectionStart, Math.min(sectionEnd, window.scrollY + cappedDelta));
        window.scrollTo({ top: targetScrollY, left: window.scrollX, behavior: 'instant' });
        lastScrollY = targetScrollY;
        applyProgress((targetScrollY - sectionStart) / scrollRange);

        if (targetScrollY <= sectionStart + SCROLL_BOUNDARY_EPSILON) guardRenderedEndpoint('start');
        else if (targetScrollY >= sectionEnd - SCROLL_BOUNDARY_EPSILON) guardRenderedEndpoint('end');
        else clearBoundaryGuard();
      });
    };

    const getCurrentRay = () => raycastContext?.raycaster?.ray;

    const pickSticker = (event: PointerEvent): StickerHit | null => {
      if (!raycastContext?.updateRaycaster || !raycastContext.page?.raycastWithClones || !raycastContext.raycaster) return null;
      raycastContext.updateRaycaster(event);
      const hits = raycastContext.page.raycastWithClones(raycastContext.raycaster) ?? [];

      for (const hit of hits) {
        const candidates = [hit.object, hit.object?.object].filter(Boolean) as RuntimeObject[];
        for (const candidate of candidates) {
          const visited = new Set<RuntimeObject>();
          let object: RuntimeObject | null | undefined = candidate;
          while (object && !visited.has(object)) {
            visited.add(object);
            if (object.uuid) {
              const track = tracksById.get(object.uuid);
              if (track && hit.point) return { track, point: copyPoint(hit.point) };
            }
            object = object.parent;
          }
        }
      }

      return null;
    };

    const cancelSnap = (trackId: string) => {
      const frame = snapFrames.get(trackId);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      snapFrames.delete(trackId);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      if (raycastContext) raycastContext.domRect = app.canvas.getBoundingClientRect();
      const hit = pickSticker(event);
      const ray = getCurrentRay();
      if (!hit || !ray) return;
      const planeNormal = normalizePoint(copyPoint(ray.direction));
      if (!planeNormal) return;
      const startIntersection = intersectRayWithPlane(ray, hit.point, planeNormal);
      if (!startIntersection) return;

      if (pointerMoveRaf !== undefined) window.cancelAnimationFrame(pointerMoveRaf);
      pointerMoveRaf = undefined;
      latestPointerMove = undefined;
      cancelSnap(hit.track.id);
      const startOffset = copyPoint(dragOffsets.get(hit.track.id) ?? { x: 0, y: 0, z: 0 });
      activeDrag = {
        pointerId: event.pointerId,
        track: hit.track,
        planePoint: hit.point,
        planeNormal,
        startIntersection,
        startOffset,
      };
      stage.setPointerCapture(event.pointerId);
      stage.dataset.sceneDragging = 'true';
      stage.dataset.sceneDraggedSticker = hit.track.id;
      event.preventDefault();
      event.stopPropagation();
    };

    const processPointerMove = (event: PointerEvent) => {
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
        if (event.pointerType !== 'touch') {
          const hoveredSticker = pickSticker(event);
          stage.dataset.sceneHover = hoveredSticker ? 'true' : 'false';
          if (hoveredSticker) stage.dataset.sceneHoverSticker = hoveredSticker.track.id;
          else delete stage.dataset.sceneHoverSticker;
        }
        return;
      }

      raycastContext?.updateRaycaster?.(event);
      const ray = getCurrentRay();
      if (!ray) return;
      const intersection = intersectRayWithPlane(ray, activeDrag.planePoint, activeDrag.planeNormal);
      if (!intersection) return;
      const offset = {
        x: activeDrag.startOffset.x + intersection.x - activeDrag.startIntersection.x,
        y: activeDrag.startOffset.y + intersection.y - activeDrag.startIntersection.y,
        z: activeDrag.startOffset.z + intersection.z - activeDrag.startIntersection.z,
      };
      dragOffsets.set(activeDrag.track.id, offset);
      applyTrack(activeDrag.track, Number.isFinite(lastProgress) ? lastProgress : 0, offset);
      app.requestRender();
    };

    const flushPointerMove = () => {
      if (pointerMoveRaf !== undefined) window.cancelAnimationFrame(pointerMoveRaf);
      pointerMoveRaf = undefined;
      const event = latestPointerMove;
      latestPointerMove = undefined;
      if (event) processPointerMove(event);
    };

    const handlePointerMove = (event: PointerEvent) => {
      latestPointerMove = event;
      if (activeDrag && event.pointerId === activeDrag.pointerId) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (pointerMoveRaf === undefined) {
        pointerMoveRaf = window.requestAnimationFrame(() => {
          pointerMoveRaf = undefined;
          const latestEvent = latestPointerMove;
          latestPointerMove = undefined;
          if (latestEvent) processPointerMove(latestEvent);
        });
      }
    };

    const snapStickerBack = (track: StickerTrack) => {
      cancelSnap(track.id);
      const startOffset = copyPoint(dragOffsets.get(track.id) ?? { x: 0, y: 0, z: 0 });
      if (reducedMotion || Math.hypot(startOffset.x, startOffset.y, startOffset.z) < 0.0001) {
        dragOffsets.delete(track.id);
        applyTrack(track, Number.isFinite(lastProgress) ? lastProgress : 0);
        app.requestRender();
        return;
      }

      const startedAt = performance.now();
      const animateReturn = (now: number) => {
        const progress = clamp01((now - startedAt) / DRAG_RETURN_DURATION);
        const eased = 1 - Math.pow(1 - progress, 3);
        const offset = {
          x: startOffset.x * (1 - eased),
          y: startOffset.y * (1 - eased),
          z: startOffset.z * (1 - eased),
        };
        if (progress >= 1) dragOffsets.delete(track.id);
        else dragOffsets.set(track.id, offset);
        applyTrack(track, Number.isFinite(lastProgress) ? lastProgress : 0, progress >= 1 ? undefined : offset);
        app.requestRender();

        if (progress < 1) snapFrames.set(track.id, window.requestAnimationFrame(animateReturn));
        else snapFrames.delete(track.id);
      };
      snapFrames.set(track.id, window.requestAnimationFrame(animateReturn));
    };

    const finishPointerDrag = (event: PointerEvent) => {
      if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
      flushPointerMove();
      const releasedTrack = activeDrag.track;
      const releasedOffset = dragOffsets.get(releasedTrack.id);
      activeDrag = undefined;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      delete stage.dataset.sceneDragging;
      delete stage.dataset.sceneDraggedSticker;
      stage.dataset.sceneLastDraggedSticker = releasedTrack.id;
      stage.dataset.sceneLastDragDistance = Math.hypot(
        releasedOffset?.x ?? 0,
        releasedOffset?.y ?? 0,
        releasedOffset?.z ?? 0,
      ).toFixed(2);
      snapStickerBack(releasedTrack);
      event.stopPropagation();
    };

    const clearHover = () => {
      if (!activeDrag) {
        if (pointerMoveRaf !== undefined) window.cancelAnimationFrame(pointerMoveRaf);
        pointerMoveRaf = undefined;
        latestPointerMove = undefined;
        delete stage.dataset.sceneHover;
        delete stage.dataset.sceneHoverSticker;
      }
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(section);
    window.addEventListener('wheel', handleWheelIntent, { capture: true, passive: false });
    window.addEventListener('scroll', requestScrollSync, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    stage.addEventListener('pointerdown', handlePointerDown, { capture: true });
    stage.addEventListener('pointermove', handlePointerMove, { capture: true });
    stage.addEventListener('pointerup', finishPointerDrag, { capture: true });
    stage.addEventListener('pointercancel', finishPointerDrag, { capture: true });
    stage.addEventListener('lostpointercapture', finishPointerDrag, { capture: true });
    stage.addEventListener('pointerleave', clearHover);

    const cleanup = () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
      if (preheatTimer !== undefined) window.clearTimeout(preheatTimer);
      snapFrames.forEach((frame) => window.cancelAnimationFrame(frame));
      snapFrames.clear();
      if (scrollRaf !== undefined) window.cancelAnimationFrame(scrollRaf);
      if (wheelRaf !== undefined) window.cancelAnimationFrame(wheelRaf);
      if (endpointPaintRaf !== undefined) window.cancelAnimationFrame(endpointPaintRaf);
      if (pointerMoveRaf !== undefined) window.cancelAnimationFrame(pointerMoveRaf);
      resizeObserver.disconnect();
      window.removeEventListener('wheel', handleWheelIntent, { capture: true });
      window.removeEventListener('scroll', requestScrollSync);
      window.removeEventListener('resize', measure);
      stage.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      stage.removeEventListener('pointermove', handlePointerMove, { capture: true });
      stage.removeEventListener('pointerup', finishPointerDrag, { capture: true });
      stage.removeEventListener('pointercancel', finishPointerDrag, { capture: true });
      stage.removeEventListener('lostpointercapture', finishPointerDrag, { capture: true });
      stage.removeEventListener('pointerleave', clearHover);
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
          cleanup();
          setIsLoaded(true);
          dispatchSceneStatus('mc:spline-error');
        }
        return;
      }

      tracks = resolvedTracks.filter((track): track is StickerTrack => track !== null);
      tracksById = new Map(tracks.map((track) => [track.id, track]));
      const eventManager = getEventManager(app);
      raycastContext = eventManager?.eventContext;
      eventManager?.pause?.();

      const backdrop = app.findObjectByName('Backdrop');
      if (backdrop?.visible) backdrop.hide();
      STICKER_BACK_IDS.forEach((id) => {
        const back = app.findObjectById(id);
        if (back) back.color = '#101820';
      });

      app.setBackgroundColor('#cb9933');
      const orbitControls = getOrbitControls(app);
      if (orbitControls) {
        orbitControls.enabled = false;
        orbitControls.enableZoom = false;
        orbitControls.isTouchZoom = false;
        orbitControls.enablePan = false;
        orbitControls.enableRotate = false;
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
    <section ref={sectionRef} data-sticker-scene-section className="relative h-[300vh] bg-lab-gold text-lab-black motion-reduce:h-screen">
      <div ref={stageRef} className="sticky top-0 h-screen cursor-default overflow-hidden bg-lab-gold data-[scene-dragging=true]:cursor-grabbing data-[scene-hover=true]:cursor-grab">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 origin-center translate-x-[18vw] scale-[1.18] will-change-transform sm:translate-x-[27vw] sm:scale-[1.36]"
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
