import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SCENE_URL = '/assets/3d/stickers-scene-brand-v3.splinecode';
const READY_HOLD_TIME = 520;
const FALLBACK_HOLD_TIME = 650;
const EXIT_DURATION = 420;
const HARD_RELEASE_TIMEOUT = 25_000;
const CHECK_ROTATION_INTERVAL = 1_650;

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

const stateContent: Record<PreheatState, { eyebrow: string; title: string; detail: string }> = {
  preheating: {
    eyebrow: 'Caching the scene',
    title: 'Preheating the press.',
    detail: 'Preparing the interactive sticker scene.',
  },
  initializing: {
    eyebrow: 'Starting the scene',
    title: 'Almost ready to stick.',
    detail: 'Loading the stickers and their motion.',
  },
  ready: {
    eyebrow: 'Scene ready',
    title: 'Fresh off the press.',
    detail: 'The interactive sticker scene is ready.',
  },
  fallback: {
    eyebrow: 'Preview ready',
    title: 'Still looking sharp.',
    detail: 'Opening the lightweight sticker experience.',
  },
  background: {
    eyebrow: 'Taking longer than usual',
    title: 'Let’s keep moving.',
    detail: 'The sticker scene will finish in the background.',
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

  useEffect(() => subscribeToCacheProgress(setCacheProgress), []);

  useEffect(() => {
    if (!isMounted) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const body = document.body;
    const scrollY = window.scrollY;
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

    // Bring the covered canvas into the viewport so Spline can initialize
    // while the takeover is visible. The original position is restored before
    // the page becomes interactive, so visitors still begin at the hero.
    const sceneSection = document.querySelector<HTMLElement>('[data-sticker-scene-section]');
    if (sceneSection) window.scrollTo({ top: sceneSection.offsetTop, left: 0, behavior: 'instant' });
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
      window.scrollTo({ top: scrollY, left: window.scrollX, behavior: 'instant' });
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
  const isSettling = state === 'fallback' || state === 'background';
  const progressWidth = isCacheComplete || isSettling ? '100%' : cachePercent === null ? '12%' : `${Math.max(2, cachePercent)}%`;
  const progressText = state === 'ready'
    ? 'Ready'
    : state === 'initializing'
      ? cacheStatus === 'complete' ? 'Scene cached · starting motion' : 'Starting scene directly'
      : state === 'fallback' || state === 'background'
        ? 'Opening page'
        : cachePercent === null
          ? formatBytes(cacheProgress.loaded)
          : `${cachePercent}% cached`;

  return createPortal(
    <div
      ref={dialogRef}
      data-sticker-scene-preheat-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="sticker-preheat-title"
      aria-describedby="sticker-preheat-description"
      tabIndex={-1}
      className={`fixed inset-0 z-[200] overflow-x-hidden overflow-y-auto overscroll-contain bg-lab-white text-lab-black outline-none transition-opacity duration-[420ms] ease-out motion-reduce:transition-none ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="pointer-events-none absolute -right-[18vw] -top-[18vw] h-[52vw] w-[52vw] min-h-80 min-w-80 rounded-full border-[clamp(2rem,8vw,8rem)] border-lab-gold/18" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-lab-red/8 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex h-full min-h-[32rem] max-w-7xl flex-col px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div className="flex items-center justify-between border-b border-lab-black/12 pb-6">
          <img src="/assets/brand/merchcraft-primary-full.svg" alt="Merchcraft" className="h-8 w-auto sm:h-10" />
          <span className="flex items-center gap-3 font-accent text-[10px] font-bold uppercase tracking-[0.16em] text-lab-black/55 sm:text-xs">
            <span className={`h-2 w-2 rounded-full ${state === 'ready' ? 'bg-lab-gold' : 'animate-pulse bg-lab-red motion-reduce:animate-none'}`} aria-hidden="true" />
            Sticker scene
          </span>
        </div>

        <div className="grid flex-1 content-center gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-20">
          <div>
            <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-lab-red sm:text-sm" aria-live="polite">{content.eyebrow}</p>
            <h1 id="sticker-preheat-title" className="mt-5 max-w-[8ch] font-display text-[clamp(4.25rem,9vw,9.5rem)] font-bold uppercase leading-[0.8] tracking-[-0.045em]">
              {content.title}
            </h1>
            <p id="sticker-preheat-description" className="mt-7 max-w-xl text-sm font-semibold leading-relaxed text-lab-black/58 sm:text-base">
              {content.detail}
            </p>
          </div>

          <div className="relative overflow-hidden bg-lab-black px-6 py-7 text-white shadow-[0_30px_80px_rgba(16,24,32,0.2)] sm:px-9 sm:py-10">
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-lab-gold" aria-hidden="true" />
            <p className="font-accent text-[10px] font-bold uppercase tracking-[0.18em] text-lab-gold sm:text-xs">Production check</p>
            <p className="mt-12 min-h-[2.2em] max-w-[13ch] font-display text-[clamp(2.4rem,4vw,4.75rem)] font-bold uppercase leading-[0.88] tracking-tight" aria-live="off">
              {productionChecks[activeCheck]}
            </p>
            <div className="mt-14 flex items-center gap-2" aria-hidden="true">
              {productionChecks.map((check, index) => (
                <span key={check} className={`h-1 flex-1 transition-colors duration-300 motion-reduce:transition-none ${index === activeCheck ? 'bg-lab-gold' : 'bg-white/16'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-lab-black/12 pt-5">
          <div className="flex items-center justify-between gap-5 font-accent text-[10px] font-bold uppercase tracking-[0.13em] text-lab-black/55 sm:text-xs">
            <span>{content.eyebrow}</span>
            <span>{progressText}</span>
          </div>
          <div
            className="mt-3 h-1 overflow-hidden bg-lab-black/10"
            role="progressbar"
            aria-label="Sticker scene cache progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state === 'preheating' && cachePercent !== null ? cachePercent : isCacheComplete || isSettling ? 100 : undefined}
            aria-valuetext={progressText}
          >
            <div
              className={`h-full bg-lab-gold transition-[width] duration-200 ease-out motion-reduce:transition-none ${!isCacheComplete && !isSettling && cachePercent === null ? 'animate-pulse motion-reduce:animate-none' : ''}`}
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
