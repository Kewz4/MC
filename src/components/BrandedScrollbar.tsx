import { useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocation } from 'react-router-dom';

type ScrollMetrics = {
  maxScroll: number;
  maxTravel: number;
  thumbTop: number;
  trackTop: number;
};

const MIN_THUMB_HEIGHT = 44;
const DESKTOP_SCROLLBAR_QUERY = '(min-width: 768px) and (hover: hover) and (pointer: fine) and (forced-colors: none)';

export default function BrandedScrollbar() {
  const location = useLocation();
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<ScrollMetrics>({ maxScroll: 0, maxTravel: 0, thumbTop: 0, trackTop: 0 });
  const dragRef = useRef<{ pointerId: number; grabOffset: number; clientY: number } | null>(null);
  const updateFrameRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);

  const update = useCallback(() => {
    updateFrameRef.current = null;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const scroller = document.scrollingElement ?? document.documentElement;
    const viewportHeight = window.innerHeight;
    const documentHeight = scroller.scrollHeight;
    const maxScroll = Math.max(0, documentHeight - viewportHeight);
    const trackRect = track.getBoundingClientRect();
    const thumbHeight = Math.min(trackRect.height, Math.max(MIN_THUMB_HEIGHT, trackRect.height * (viewportHeight / documentHeight)));
    const maxTravel = Math.max(0, trackRect.height - thumbHeight);
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / maxScroll)) : 0;
    const thumbTop = progress * maxTravel;
    const blocked = document.body.style.overflow === 'hidden' || Boolean(document.querySelector('[aria-modal="true"]'));

    const visible = maxScroll > 1 && !blocked;
    metricsRef.current = { maxScroll, maxTravel, thumbTop, trackTop: trackRect.top };
    track.dataset.visible = visible ? 'true' : 'false';
    track.tabIndex = visible ? 0 : -1;
    track.setAttribute('aria-hidden', visible ? 'false' : 'true');
    track.style.pointerEvents = visible ? 'auto' : 'none';
    thumb.style.height = String(thumbHeight) + 'px';
    thumb.style.transform = 'translate3d(0, ' + String(thumbTop) + 'px, 0)';
    track.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    track.setAttribute('aria-valuetext', String(Math.round(progress * 100)) + '% down the page');
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (updateFrameRef.current === null) updateFrameRef.current = requestAnimationFrame(update);
  }, [update]);

  const moveDrag = useCallback(() => {
    dragFrameRef.current = null;
    const drag = dragRef.current;
    if (!drag) return;
    const { maxScroll, maxTravel, trackTop } = metricsRef.current;
    if (!maxScroll || !maxTravel) return;

    const nextTop = Math.min(maxTravel, Math.max(0, drag.clientY - trackTop - drag.grabOffset));
    const requestedScroll = (nextTop / maxTravel) * maxScroll;
    window.scrollTo({ top: requestedScroll, behavior: 'instant' });

    const scroller = document.scrollingElement ?? document.documentElement;
    const actualTop = (scroller.scrollTop / maxScroll) * maxTravel;
    if (Math.abs(actualTop - nextTop) > 8) drag.grabOffset = drag.clientY - trackTop - actualTop;
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const thumb = thumbRef.current;
    if (!thumb || !(event.target instanceof Node) || !thumb.contains(event.target)) return;
    const { thumbTop, trackTop } = metricsRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      grabOffset: event.clientY - trackTop - thumbTop,
      clientY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
    document.documentElement.style.userSelect = 'none';
    event.preventDefault();
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.clientY = event.clientY;
    if (dragFrameRef.current === null) dragFrameRef.current = requestAnimationFrame(moveDrag);
  }, [moveDrag]);

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.dataset.dragging = 'false';
    document.documentElement.style.userSelect = '';
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
  }, []);

  const handleTrackPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (thumbRef.current?.contains(event.target as Node)) return;
    const { thumbTop } = metricsRef.current;
    const localY = event.clientY - event.currentTarget.getBoundingClientRect().top;
    const direction = localY < thumbTop ? -1 : 1;
    window.scrollBy({ top: direction * window.innerHeight * 0.9, behavior: 'instant' });
  }, []);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const viewportStep = Math.max(200, window.innerHeight * 0.9);
    const actions: Record<string, () => void> = {
      ArrowUp: () => window.scrollBy({ top: -48, behavior: 'instant' }),
      ArrowDown: () => window.scrollBy({ top: 48, behavior: 'instant' }),
      PageUp: () => window.scrollBy({ top: -viewportStep, behavior: 'instant' }),
      PageDown: () => window.scrollBy({ top: viewportStep, behavior: 'instant' }),
      ' ': () => window.scrollBy({ top: event.shiftKey ? -viewportStep : viewportStep, behavior: 'instant' }),
      Home: () => window.scrollTo({ top: 0, behavior: 'instant' }),
      End: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const track = trackRef.current;
    const desktopQuery = window.matchMedia(DESKTOP_SCROLLBAR_QUERY);
    const syncMode = () => {
      if (desktopQuery.matches) {
        root.dataset.mcFloatingScrollbar = 'true';
        if (track) track.style.display = 'block';
        scheduleUpdate();
      } else {
        delete root.dataset.mcFloatingScrollbar;
        if (track) {
          track.style.display = 'none';
          track.tabIndex = -1;
          track.setAttribute('aria-hidden', 'true');
        }
      }
    };

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.body);
    const appRoot = document.getElementById('root');
    if (appRoot) resizeObserver.observe(appRoot);
    const bodyStyleObserver = new MutationObserver(scheduleUpdate);
    bodyStyleObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    const pageTreeObserver = new MutationObserver(scheduleUpdate);
    pageTreeObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleUpdate, { passive: true });
    desktopQuery.addEventListener?.('change', syncMode);
    syncMode();
    requestAnimationFrame(() => requestAnimationFrame(scheduleUpdate));

    return () => {
      delete root.dataset.mcFloatingScrollbar;
      document.documentElement.style.userSelect = '';
      resizeObserver.disconnect();
      bodyStyleObserver.disconnect();
      pageTreeObserver.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      desktopQuery.removeEventListener?.('change', syncMode);
      if (updateFrameRef.current !== null) {
        cancelAnimationFrame(updateFrameRef.current);
        updateFrameRef.current = null;
      }
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    };
  }, [location.pathname, scheduleUpdate]);

  return (
    <div
      ref={trackRef}
      role="scrollbar"
      tabIndex={0}
      aria-label="Page position"
      aria-hidden="true"
      aria-controls="root"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      onPointerDown={(event) => {
        handleTrackPointerDown(event);
        handlePointerDown(event);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onKeyDown={handleKeyDown}
      data-floating-scrollbar
      className="group pointer-events-auto fixed bottom-6 right-[max(0.5rem,env(safe-area-inset-right))] top-24 z-[90] hidden w-6 touch-none opacity-0 outline-none transition-opacity duration-300 data-[visible=true]:opacity-100 data-[dragging=true]:cursor-grabbing motion-reduce:transition-none"
    >
      <div
        ref={thumbRef}
        aria-hidden="true"
        className="pointer-events-auto absolute right-0 top-0 w-[10px] cursor-grab rounded-full border border-lab-black/65 bg-[linear-gradient(180deg,#e1b65d_0%,#cb9933_58%,#b97918_100%)] shadow-[0_3px_12px_rgba(16,24,32,0.28)] transition-[width,box-shadow] duration-200 hover:w-[13px] hover:shadow-[0_4px_16px_rgba(16,24,32,0.34)] group-focus-visible:w-[13px] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-lab-red motion-reduce:transition-none"
      />
    </div>
  );
}
