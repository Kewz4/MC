import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { Application, SPEObject } from '@splinetool/runtime';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Spline = lazy(() => import('@splinetool/react-spline'));

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
const INTRO_REPLAY_ARM_DELAY = 900;
const DIRECTION_DEADBAND = 64;

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
    let armTimer: number | undefined;
    let media: gsap.MatchMedia | undefined;
    let pinTrigger: ScrollTrigger | undefined;

    const cleanup = () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
      if (armTimer !== undefined) window.clearTimeout(armTimer);
      media?.revert();
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
    });

    const initializeWhenReady = () => {
      if (cancelled || splineRef.current !== app) return;

      const allObjects = app.getAllObjects();
      const events = getSplineEventsSafely(app);
      const startObjects = getStartEventObjects(app, events);
      const backdrop = app.findObjectByName('Backdrop');

      if (backdrop?.visible) {
        backdrop.hide();
      }
      // Spline's runtime ignores alpha in background colors. Matching the
      // canvas clear color to this section removes the exported rectangle.
      app.setBackgroundColor('#cb9933');
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
        }
        return;
      }

      setIsLoaded(true);

      // Let Spline's exported Start animation own the objects. The page-level
      // scrub only moves the canvas, so it cannot overwrite native states.
      armTimer = window.setTimeout(() => {
        if (cancelled || splineRef.current !== app) return;

        media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
          const canvas = stage.querySelector('canvas');
          const visual = canvas?.parentElement ?? canvas;
          const visualTween = visual
            ? gsap.fromTo(
                visual,
                { scale: 0.985, yPercent: 1.5 },
                {
                  scale: 1.045,
                  yPercent: -1.5,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.65,
                  },
                },
              )
            : undefined;

          let lastScrollY = window.scrollY;
          let pendingDirection: -1 | 0 | 1 = 0;
          let stableDirection: -1 | 0 | 1 = 0;
          let accumulatedDelta = 0;
          let initialForwardIsNative = true;

          const replayIntro = (direction: -1 | 1) => {
            // The export auto-plays Start once. Suppressing the first committed
            // downward direction prevents a duplicate animation on entry.
            if (direction === 1 && initialForwardIsNative) {
              initialForwardIsNative = false;
              stableDirection = 1;
              return true;
            }

            initialForwardIsNative = false;
            startObjects.forEach((object) => {
              try {
                if (direction === 1) app.emitEvent('start', object.uuid);
                else app.emitEventReverse('start', object.uuid);
              } catch {
                // A disposed or reloading scene can briefly invalidate an id.
              }
            });
            stableDirection = direction;
            app.requestRender();
            return true;
          };

          const directionTrigger = ScrollTrigger.create({
            trigger: section,
            start: 'top 85%',
            end: 'bottom 15%',
            onUpdate: () => {
              const scrollY = window.scrollY;
              const delta = scrollY - lastScrollY;
              lastScrollY = scrollY;
              if (Math.abs(delta) < 0.5) return;

              const direction: -1 | 1 = delta > 0 ? 1 : -1;
              if (direction !== pendingDirection) {
                pendingDirection = direction;
                accumulatedDelta = delta;
              } else {
                accumulatedDelta += delta;
              }

              if (Math.abs(accumulatedDelta) < DIRECTION_DEADBAND || direction === stableDirection) return;
              if (replayIntro(direction)) accumulatedDelta = 0;
            },
          });

          return () => {
            directionTrigger.kill();
            visualTween?.scrollTrigger?.kill();
            visualTween?.kill();
            if (visual) gsap.set(visual, { clearProps: 'transform' });
          };
        });

        ScrollTrigger.refresh();
      }, INTRO_REPLAY_ARM_DELAY);
    };

    initializeWhenReady();
  }, []);

  const handleLoad = useCallback((app: Application) => {
    splineRef.current = app;
    app.setGlobalEvents(false);
    setIsLoaded(false);
    setupScroll(app);
  }, [setupScroll]);

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <section ref={sectionRef} className="relative h-[175vh] bg-lab-gold text-lab-black lg:h-[220vh]">
      <div ref={stageRef} className="relative h-screen overflow-hidden bg-lab-gold">
        <div className="absolute inset-0">
          {!isLoaded && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-lab-gold" role="status">
              <span className="font-accent text-xs font-bold uppercase tracking-[0.16em] text-lab-black/55">Loading sticker scene…</span>
            </div>
          )}
          <Suspense fallback={null}>
            <Spline
              scene="/assets/3d/stickers-scene-brand-v3.splinecode"
              onLoad={handleLoad}
              renderOnDemand
              className="h-full w-full [&_canvas]:!bg-transparent"
              style={{ background: 'transparent' }}
            />
          </Suspense>
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
