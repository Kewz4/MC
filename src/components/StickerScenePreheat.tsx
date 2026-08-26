import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SCENE_URL = '/assets/3d/stickers-scene-brand-v3.splinecode';
const READY_HOLD_TIME = 420;
const FALLBACK_HOLD_TIME = 520;
const EXIT_DURATION = 620;
const HARD_RELEASE_TIMEOUT = 25_000;

type PreheatState = 'preheating' | 'initializing' | 'ready' | 'fallback' | 'background';

type CacheProgress = {
  loaded: number;
  total: number | null;
};

const stateContent: Record<PreheatState, { phase: string; detail: string }> = {
  preheating: {
    phase: 'Loading stickers',
    detail: 'Fresh ink, strong glue, and a little motion. Almost ready.',
  },
  initializing: {
    phase: 'Almost ready',
    detail: 'Putting the final touches in place.',
  },
  ready: {
    phase: 'Ready',
    detail: 'Your sticker page is ready to explore.',
  },
  fallback: {
    phase: 'Opening now',
    detail: 'Your sticker page is ready to explore.',
  },
  background: {
    phase: 'Opening now',
    detail: 'Your sticker page is ready to explore.',
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

export default function StickerScenePreheat() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const settledRef = useRef(false);
  const cacheCompleteRef = useRef(false);
  const splineLoadingRef = useRef(false);
  const [state, setState] = useState<PreheatState>('preheating');
  const [cacheProgress, setCacheProgress] = useState<CacheProgress>(latestCacheProgress);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'complete' | 'failed'>('loading');
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
  const isOpening = state === 'fallback' || state === 'background';
  const isIndeterminate = cachePercent === null && !isCacheComplete && !isOpening;
  const progressWidth = isCacheComplete || isOpening ? '100%' : cachePercent === null ? '32%' : `${Math.max(2, cachePercent)}%`;
  const progressText = state === 'ready'
    ? 'Ready'
    : state === 'initializing'
      ? 'Almost there'
      : isOpening
        ? 'Opening now'
        : cachePercent === null
          ? 'Loading'
          : `${cachePercent}%`;
  const progressMetric = isCacheComplete || isOpening
    ? '100%'
    : cachePercent === null
      ? 'Please wait'
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
      className={`fixed inset-0 z-[200] overflow-x-hidden overflow-y-auto overscroll-contain bg-lab-white text-lab-black outline-none transition-opacity duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className={`relative mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center px-6 py-12 text-center transition-[opacity,transform] duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-8 sm:py-16 ${isVisible ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-[0.985] opacity-0'}`}>
        <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft" className="h-auto w-[min(15rem,64vw)]" />

        <div className="mt-10 flex items-center justify-center gap-3 font-accent text-[10px] font-bold uppercase tracking-[0.16em] text-lab-red sm:text-xs">
          <span className={`h-2 w-2 rounded-full ${state === 'ready' ? 'bg-lab-gold' : 'animate-pulse bg-lab-red motion-reduce:animate-none'}`} aria-hidden="true" />
          <span aria-live="polite">{content.phase}</span>
        </div>

        <h1 id="sticker-preheat-title" className="mt-5 max-w-[12ch] font-display text-[clamp(3.1rem,7vw,5.25rem)] font-bold uppercase leading-[0.9] tracking-[-0.035em]">
          Loading your sticker page
        </h1>
        <p id="sticker-preheat-description" className="mt-5 max-w-sm text-sm font-semibold leading-relaxed text-lab-black/58 sm:text-base">
          {content.detail}
        </p>

        <div className="mt-10 w-full text-left sm:mt-11">
          <div className="flex items-end justify-between gap-5">
            <span className="font-accent text-[10px] font-bold uppercase tracking-[0.14em] text-lab-black/50 sm:text-xs">Loading</span>
            <span className="font-accent text-[11px] font-bold text-lab-black/72 sm:text-xs">{progressMetric}</span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-lab-black/10"
            role="progressbar"
            aria-label="Sticker page loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={isCacheComplete || isOpening ? 100 : cachePercent ?? undefined}
            aria-valuetext={progressText}
          >
            <div
              className={`h-full rounded-full bg-lab-gold transition-[width] duration-500 ease-out motion-reduce:transition-none ${isIndeterminate ? 'animate-pulse motion-reduce:animate-none' : ''}`}
              style={{ width: progressWidth }}
            />
          </div>
          <p id="sticker-preheat-status" className="mt-3 text-center font-accent text-[9px] font-bold uppercase tracking-[0.13em] text-lab-black/45 sm:text-[10px]" role="status" aria-live="polite">
            {progressText}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
