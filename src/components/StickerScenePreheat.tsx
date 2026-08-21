import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SCENE_URL = '/assets/3d/stickers-scene-brand-v3.splinecode';
const READY_HOLD_TIME = 520;
const FALLBACK_HOLD_TIME = 650;
const EXIT_DURATION = 420;
const HARD_RELEASE_TIMEOUT = 25_000;
const CHECK_ROTATION_INTERVAL = 1_800;

type PreheatState = 'preheating' | 'initializing' | 'ready' | 'fallback' | 'background';

type CacheProgress = {
  loaded: number;
  total: number | null;
};

const productionChecks = [
  'Testing the glue strength.',
  'Shining a million lights at the gloss.',
  'Dialing in the die-cut alignment.',
  'Checking the holographic sparkle.',
];

const stateContent: Record<PreheatState, { phase: string; detail: string }> = {
  preheating: {
    phase: 'Caching the 3D scene',
    detail: 'Getting the sticker wall ready to move.',
  },
  initializing: {
    phase: 'Starting the interaction',
    detail: 'The stickers are loaded. Motion is coming online.',
  },
  ready: {
    phase: 'Scene ready',
    detail: 'Everything is ready to move.',
  },
  fallback: {
    phase: 'Opening the page',
    detail: 'The lightweight sticker experience is ready.',
  },
  background: {
    phase: 'Opening the page',
    detail: 'The sticker scene will finish loading in the background.',
  },
};

let scenePreheatPromise: Promise<boolean> | undefined;
let latestCacheProgress: CacheProgress = { loaded: 0, total: null };
const cacheProgressListeners = new Set<(progress: CacheProgress) => void>();

function publishCacheProgress(progress: CacheProgress) {
  latestCacheProgress = progress;
  cacheProgressListeners.forEach((listener) => listener(progress));
}

function subscribeToCacheProgress(listener: (progress: CacheProgress) => void) {
  cacheProgressListeners.add(listener);
  listener(latestCacheProgress);
  return () => {
    cacheProgressListeners.delete(listener);
  };
}

async function consumeSceneResponse(response: Response) {
  if (!response.ok) throw new Error(`Sticker scene preheat failed with ${response.status}.`);

  const contentLength = Number(response.headers.get('content-length'));
  const total = Number.isFinite(contentLength) && contentLength > 0 ? contentLength : null;
  let loaded = 0;
  publishCacheProgress({ loaded, total });

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    publishCacheProgress({ loaded: buffer.byteLength, total: total ?? buffer.byteLength });
    return;
  }

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    loaded += value.byteLength;
    publishCacheProgress({ loaded, total });
  }

  publishCacheProgress({ loaded, total: total ?? loaded });
}

function preheatStickerScene() {
  if (scenePreheatPromise) return scenePreheatPromise;

  const existingPreload = document.querySelector<HTMLLinkElement>('link[data-mc-sticker-scene-preheat]');
  if (!existingPreload) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'fetch';
    preload.href = SCENE_URL;
    preload.crossOrigin = 'anonymous';
    preload.fetchPriority = 'high';
    preload.dataset.mcStickerScenePreheat = 'true';
    document.head.append(preload);
  }

  scenePreheatPromise = fetch(SCENE_URL, {
    cache: 'force-cache',
    mode: 'cors',
  })
    .then(consumeSceneResponse)
    .then(() => true)
    .catch(() => false);

  return scenePreheatPromise;
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return 'Connecting';
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB cached`;
  return `${(bytes / 1_000_000).toFixed(1)} MB cached`;
}

export default function StickerScenePreheat() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const settledRef = useRef(false);
  const cacheCompleteRef = useRef(false);
  const splineLoadingRef = useRef(false);
  const [state, setState] = useState<PreheatState>('preheating');
  const [cacheProgress, setCacheProgress] = useState<CacheProgress>(latestCacheProgress);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'complete' | 'failed'>('loading');
  const [activeCheck, setActiveCheck] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mc:preheat-mounted'));
  }, []);

  useEffect(() => subscribeToCacheProgress(setCacheProgress), []);

  useEffect(() => {
    if (!isMounted) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const body = document.body;
    const bodyStyle = {
      overflow: body.style.overflow,
      overscrollBehavior: body.style.overscrollBehavior,
    };
    const siblings = Array.from(body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== dialog && !/^(SCRIPT|STYLE|LINK)$/.test(element.tagName))
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute('aria-hidden'),
      }));

    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    siblings.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });

    const focusDialog = () => dialog.focus({ preventScroll: true });
    const animationFrame = window.requestAnimationFrame(focusDialog);
    const handleFocusIn = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) focusDialog();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Escape') {
        event.preventDefault();
        focusDialog();
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      siblings.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
      body.style.overflow = bodyStyle.overflow;
      body.style.overscrollBehavior = bodyStyle.overscrollBehavior;
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveCheck((current) => (current + 1) % productionChecks.length);
    }, CHECK_ROTATION_INTERVAL);
    return () => window.clearInterval(timer);
  }, [isMounted]);

  useEffect(() => {
    let cancelled = false;
    let settleTimer: number | undefined;
    let unmountTimer: number | undefined;
    let releaseTimer: number | undefined;

    const settle = (nextState: Extract<PreheatState, 'ready' | 'fallback' | 'background'>) => {
      if (cancelled || settledRef.current) return;
      settledRef.current = true;
      window.clearTimeout(releaseTimer);
      setState(nextState);
      const holdTime = nextState === 'ready' ? READY_HOLD_TIME : FALLBACK_HOLD_TIME;
      settleTimer = window.setTimeout(() => {
        setIsVisible(false);
        unmountTimer = window.setTimeout(() => setIsMounted(false), EXIT_DURATION);
      }, holdTime);
    };

    const handleLoading = () => {
      splineLoadingRef.current = true;
      if (cacheCompleteRef.current && !settledRef.current) setState('initializing');
    };
    const handleReady = () => settle('ready');
    const handleError = () => settle('fallback');

    window.addEventListener('mc:spline-loading', handleLoading);
    window.addEventListener('mc:spline-ready', handleReady);
    window.addEventListener('mc:spline-error', handleError);

    releaseTimer = window.setTimeout(() => settle('background'), HARD_RELEASE_TIMEOUT);
    void preheatStickerScene().then((warmed) => {
      if (cancelled || settledRef.current) return;
      cacheCompleteRef.current = warmed;
      setCacheStatus(warmed ? 'complete' : 'failed');
      if (warmed || splineLoadingRef.current) setState('initializing');
    });

    return () => {
      cancelled = true;
      window.clearTimeout(settleTimer);
      window.clearTimeout(unmountTimer);
      window.clearTimeout(releaseTimer);
      window.removeEventListener('mc:spline-loading', handleLoading);
      window.removeEventListener('mc:spline-ready', handleReady);
      window.removeEventListener('mc:spline-error', handleError);
    };
  }, []);

  if (!isMounted) return null;

  const content = stateContent[state];
  const hasKnownTotal = Boolean(cacheProgress.total && cacheProgress.total > 0);
  const cachePercent = hasKnownTotal
    ? Math.min(100, Math.round((cacheProgress.loaded / (cacheProgress.total ?? 1)) * 100))
    : null;
  const isCacheComplete = cacheStatus === 'complete' || state === 'ready';
  const isIndeterminate = cachePercent === null && !isCacheComplete;
  const progressWidth = isCacheComplete ? '100%' : cachePercent === null ? '34%' : `${Math.max(2, cachePercent)}%`;
  const progressText = state === 'ready'
    ? 'Ready'
    : state === 'initializing'
      ? cacheStatus === 'complete' ? 'Scene cached · starting motion' : 'Starting scene directly'
      : state === 'fallback' || state === 'background'
        ? 'Opening page'
        : cachePercent === null
          ? formatBytes(cacheProgress.loaded)
          : `${cachePercent}% cached`;
  const progressMetric = isCacheComplete
    ? '100%'
    : state === 'fallback' || state === 'background'
      ? 'Opening'
      : cachePercent === null
        ? formatBytes(cacheProgress.loaded)
        : `${cachePercent}%`;

  return createPortal(
    <div
      ref={dialogRef}
      data-sticker-scene-preheat-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="sticker-preheat-title"
      aria-describedby="sticker-preheat-description sticker-preheat-status"
      tabIndex={-1}
      aria-busy={state === 'preheating' || state === 'initializing'}
      className={`fixed inset-0 z-[200] overflow-x-hidden overflow-y-auto overscroll-contain bg-lab-white text-lab-black outline-none transition-opacity duration-[420ms] ease-out motion-reduce:transition-none ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-6 py-12 text-center sm:px-8 sm:py-16">
        <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft" className="h-auto w-[min(17rem,68vw)]" />

        <div className="mt-12 flex items-center justify-center gap-3 font-accent text-[10px] font-bold uppercase tracking-[0.16em] text-lab-red sm:text-xs">
          <span className={`h-2 w-2 rounded-full ${state === 'ready' ? 'bg-lab-gold' : 'animate-pulse bg-lab-red motion-reduce:animate-none'}`} aria-hidden="true" />
          <span aria-live="polite">{content.phase}</span>
        </div>

        <h1 id="sticker-preheat-title" className="mt-5 max-w-[11ch] font-display text-[clamp(3.25rem,8vw,5.8rem)] font-bold uppercase leading-[0.88] tracking-[-0.035em]">
          Loading interactive stickers
        </h1>
        <p id="sticker-preheat-description" className="mt-5 max-w-md text-sm font-semibold leading-relaxed text-lab-black/58 sm:text-base">
          {content.detail}
        </p>

        <div className="mt-11 w-full text-left sm:mt-12">
          <div className="flex items-end justify-between gap-5">
            <span className="font-accent text-[10px] font-bold uppercase tracking-[0.14em] text-lab-black/50 sm:text-xs">Scene progress</span>
            <span className="font-accent text-sm font-bold tracking-[-0.02em] text-lab-black sm:text-base">{progressMetric}</span>
          </div>
          <div
            className="mt-3 h-3 overflow-hidden bg-lab-black/10"
            role="progressbar"
            aria-label="Sticker scene cache progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={isCacheComplete ? 100 : cachePercent ?? undefined}
            aria-valuetext={progressText}
          >
            <div
              className={`h-full bg-lab-gold transition-[width] duration-200 ease-out motion-reduce:transition-none ${isIndeterminate ? 'animate-pulse motion-reduce:animate-none' : ''}`}
              style={{ width: progressWidth }}
            />
          </div>
          <p id="sticker-preheat-status" className="mt-3 text-center font-accent text-[10px] font-bold uppercase tracking-[0.12em] text-lab-black/48 sm:text-xs" role="status" aria-live="polite">
            {progressText}
          </p>
        </div>

        <div className="mt-10 w-full border-t border-lab-black/12 pt-6 sm:mt-12">
          <p className="font-accent text-[9px] font-bold uppercase tracking-[0.16em] text-lab-black/42 sm:text-[10px]">Production check</p>
          <p className="mt-2 min-h-[1.6em] text-sm font-semibold text-lab-black/72 sm:text-base" aria-live="off">
            {productionChecks[activeCheck]}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
