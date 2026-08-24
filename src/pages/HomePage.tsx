import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  FlaskConical,
  Zap,
  Shirt,
  X
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const ProjectCard = ({ src, title, category, delay = 0 }: { src: string; title: string; category: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8 }}
    className="group relative cursor-pointer"
  >
    <div className="aspect-[4/5] overflow-hidden bg-white relative mb-6">
      <img
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
    </div>
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-accent text-xl font-semibold leading-tight tracking-[-0.01em] mb-1">{title}</h4>
        <p className="font-sans font-bold text-[14px] uppercase tracking-widest text-lab-black/40">{category}</p>
      </div>
      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
    </div>
  </motion.div>
);


const HexagonStep = ({ step, title, text, color, delay = 0 }: { step: string; title: string; text: string; color: string; delay?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDark = color === 'var(--color-lab-red)' || color === 'var(--color-lab-black)';

  return (
    <motion.button
      type="button"
      aria-expanded={isExpanded}
      aria-label={`${step} ${title}: ${isExpanded ? 'hide' : 'show'} details`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative appearance-none border-0 bg-transparent p-0 text-inherit"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="relative flex h-[19rem] w-[min(82vw,17rem)] items-center justify-center sm:h-80 sm:w-72 lg:h-72 lg:w-64">
        <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full drop-shadow-2xl transition-all duration-500 group-hover:scale-110">
          <path
            d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"
            fill={color}
            className="transition-all duration-500"
          />
          <path
            d="M50 2 L91.3 26 L91.3 74 L50 98 L8.7 74 L8.7 26 Z"
            fill="none"
            stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
            strokeWidth="0.5"
          />
        </svg>
        <div className={`relative z-10 flex max-w-[13.5rem] flex-col items-center justify-center px-8 pb-14 pt-5 text-center transition-colors duration-500 sm:px-10 ${isDark ? 'text-white' : 'text-lab-black'}`}>
          <span className="mb-2 font-impact text-xl uppercase tracking-[-0.01em] sm:text-2xl">{step}</span>
          <h4 className="mb-3 max-w-[17ch] font-accent text-[10px] font-bold uppercase leading-[1.3] tracking-[0.11em] sm:text-[11px]">{title}</h4>
          <div className="max-w-[17rem]">
            <motion.p
              animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="overflow-hidden text-center font-sans text-[11px] font-semibold leading-[1.5] tracking-[0.025em] sm:text-xs"
            >
              {text}
            </motion.p>
          </div>
          {!isExpanded && (
            <span className="mt-2 font-sans text-[9px] font-bold uppercase tracking-[0.14em] opacity-45 transition-opacity group-hover:opacity-100">View details</span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

type LabHotspot = {
  id: number;
  x: number;
  y: number;
  mobileX?: number;
  mobileY?: number;
  mobileVisible?: boolean;
  title: string;
  description: string;
};

type LabGeometry = {
  left: number;
  top: number;
  width: number;
  height: number;
  size: number;
  zoom: number;
};

// Keep the showroom artwork swappable without touching the interaction code.
const LAB_SHOWROOM_IMAGE = "/assets/images/lab-showroom-v3.webp";

const LAB_HOTSPOTS: LabHotspot[] = [
  {
    id: 1,
    x: 23,
    y: 61,
    mobileVisible: false,
    title: "Blank Library",
    description: "Garment weights, washes, and silhouettes are compared in person before the right foundation moves into production."
  },
  {
    id: 2,
    x: 38,
    y: 32,
    mobileX: 18,
    mobileY: 32,
    title: "Reference Wall",
    description: "Garment references, print studies, and past builds help the team align on a clear visual direction."
  },
  {
    id: 3,
    x: 56,
    y: 64,
    mobileX: 58,
    mobileY: 64,
    title: "Thread and Trim",
    description: "Thread colors, labels, and finishing details are reviewed together so every element feels intentional."
  },
  {
    id: 4,
    x: 50,
    y: 72,
    mobileX: 45,
    mobileY: 72,
    title: "Development Table",
    description: "Print samples, trims, labels, and color chips are reviewed together before a collection moves forward."
  },
  {
    id: 5,
    x: 69,
    y: 49,
    mobileX: 87,
    mobileY: 49,
    title: "Finishing Review",
    description: "Placement, hand feel, and final construction are checked closely before a finished garment leaves the lab."
  },
  {
    id: 6,
    x: 82,
    y: 25,
    mobileVisible: false,
    title: "Stock Shelves",
    description: "Organized blanks and finished garments keep projects moving smoothly from production into packing."
  }
];

const InteractiveLab = ({ imageSrc = LAB_SHOWROOM_IMAGE }: { imageSrc?: string }) => {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [mobileInspection, setMobileInspection] = useState(false);
  const [hasFinePointer, setHasFinePointer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const lensImageRef = useRef<HTMLImageElement>(null);
  const geometryRef = useRef<LabGeometry>({ left: 0, top: 0, width: 0, height: 0, size: 196, zoom: 1.9 });
  const targetPointRef = useRef({ x: 0, y: 0 });
  const renderedPointRef = useRef({ x: 0, y: 0 });
  const lensFrameRef = useRef<number | null>(null);
  const positionFrameRef = useRef<number | null>(null);
  const touchPointerRef = useRef<number | null>(null);
  const lensVisibleRef = useRef(false);
  const supportsHoverRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const mobileInspectionRef = useRef(false);
  const activeHotspotRef = useRef<number | null>(null);

  const activeSpot = LAB_HOTSPOTS.find((spot) => spot.id === activeHotspot) ?? null;
  const detailOpensOnRight = (activeSpot?.x ?? 100) < 50;

  const setLensVisible = useCallback((isVisible: boolean) => {
    lensVisibleRef.current = isVisible;
    if (!isVisible && lensFrameRef.current !== null) {
      cancelAnimationFrame(lensFrameRef.current);
      lensFrameRef.current = null;
    }
    if (lensRef.current) lensRef.current.style.opacity = isVisible ? '1' : '0';
  }, []);

  const dismissHotspot = useCallback((hideLens = false) => {
    activeHotspotRef.current = null;
    setActiveHotspot(null);
    if (hideLens || !supportsHoverRef.current) setLensVisible(false);
  }, [setLensVisible]);

  const measureLab = useCallback(() => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const geometry: LabGeometry = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      size: rect.width < 720
        ? Math.min(164, Math.max(136, rect.width * 0.4))
        : Math.min(204, Math.max(164, rect.width * 0.165)),
      zoom: rect.width < 720 ? 1.72 : 1.9
    };
    geometryRef.current = geometry;

    if (lensRef.current) {
      lensRef.current.style.width = `${geometry.size}px`;
      lensRef.current.style.height = `${geometry.size}px`;
    }
    if (lensImageRef.current) {
      lensImageRef.current.style.width = `${geometry.width}px`;
      lensImageRef.current.style.height = `${geometry.height}px`;
    }
    return geometry;
  }, []);

  const drawLens = useCallback((x: number, y: number) => {
    const lens = lensRef.current;
    const image = lensImageRef.current;
    const geometry = geometryRef.current;
    if (!lens || !image || !geometry.width || !geometry.height) return;

    const inset = geometry.size / 2 + 12;
    const lensX = Math.max(inset, Math.min(geometry.width - inset, x));
    const lensY = Math.max(inset, Math.min(geometry.height - inset, y));
    lens.style.transform = `translate3d(${lensX - geometry.size / 2}px, ${lensY - geometry.size / 2}px, 0)`;
    image.style.transform = `translate3d(${geometry.size / 2 - x * geometry.zoom}px, ${geometry.size / 2 - y * geometry.zoom}px, 0) scale(${geometry.zoom})`;
  }, []);

  const queueLensDraw = useCallback((x: number, y: number, immediate = false) => {
    targetPointRef.current = { x, y };

    if (immediate || prefersReducedMotionRef.current) {
      renderedPointRef.current = { x, y };
      drawLens(x, y);
      return;
    }

    if (lensFrameRef.current !== null) return;
    const renderFrame = () => {
      const current = renderedPointRef.current;
      const target = targetPointRef.current;
      const nextX = current.x + (target.x - current.x) * 0.38;
      const nextY = current.y + (target.y - current.y) * 0.38;
      renderedPointRef.current = { x: nextX, y: nextY };
      drawLens(nextX, nextY);

      if (Math.abs(target.x - nextX) > 0.18 || Math.abs(target.y - nextY) > 0.18) {
        lensFrameRef.current = requestAnimationFrame(renderFrame);
      } else {
        renderedPointRef.current = { ...target };
        drawLens(target.x, target.y);
        lensFrameRef.current = null;
      }
    };
    lensFrameRef.current = requestAnimationFrame(renderFrame);
  }, [drawLens]);

  const revealLensAt = useCallback((x: number, y: number) => {
    const shouldPlaceImmediately = !lensVisibleRef.current;
    queueLensDraw(x, y, shouldPlaceImmediately);
    setLensVisible(true);
  }, [queueLensDraw, setLensVisible]);

  const syncLabPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    geometryRef.current.left = rect.left;
    geometryRef.current.top = rect.top;
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncHoverSupport = () => {
      supportsHoverRef.current = mediaQuery.matches;
      setHasFinePointer(mediaQuery.matches);
      if (!mediaQuery.matches && activeHotspotRef.current === null) setLensVisible(false);
    };
    const syncMotionPreference = () => {
      prefersReducedMotionRef.current = reducedMotionQuery.matches;
    };
    syncHoverSupport();
    syncMotionPreference();
    mediaQuery.addEventListener('change', syncHoverSupport);
    reducedMotionQuery.addEventListener('change', syncMotionPreference);
    const handlePageScroll = () => {
      if (activeHotspotRef.current !== null) dismissHotspot(true);
      if (mobileInspectionRef.current) setMobileInspection(false);
      setLensVisible(false);
      if (positionFrameRef.current !== null) return;
      positionFrameRef.current = requestAnimationFrame(() => {
        positionFrameRef.current = null;
        syncLabPosition();
      });
    };
    window.addEventListener('scroll', handlePageScroll, { passive: true });
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          const geometry = measureLab();
          const spot = LAB_HOTSPOTS.find((item) => item.id === activeHotspotRef.current);
          if (geometry && spot) {
            const usesMobileCrop = geometry.width < 640;
            const x = usesMobileCrop ? (spot.mobileX ?? spot.x) : spot.x;
            const y = usesMobileCrop ? (spot.mobileY ?? spot.y) : spot.y;
            drawLens((x / 100) * geometry.width, (y / 100) * geometry.height);
          }
        });
    if (containerRef.current) resizeObserver?.observe(containerRef.current);
    measureLab();

    return () => {
      mediaQuery.removeEventListener('change', syncHoverSupport);
      reducedMotionQuery.removeEventListener('change', syncMotionPreference);
      window.removeEventListener('scroll', handlePageScroll);
      resizeObserver?.disconnect();
      if (lensFrameRef.current !== null) cancelAnimationFrame(lensFrameRef.current);
      if (positionFrameRef.current !== null) cancelAnimationFrame(positionFrameRef.current);
    };
  }, [dismissHotspot, drawLens, measureLab, setLensVisible, syncLabPosition]);

  useEffect(() => {
    mobileInspectionRef.current = mobileInspection;
    if (!mobileInspection) {
      if (activeHotspotRef.current === null && !supportsHoverRef.current) setLensVisible(false);
      return;
    }

    dismissHotspot(false);
    const geometry = measureLab();
    if (geometry) revealLensAt(geometry.width * 0.56, geometry.height * 0.55);
  }, [dismissHotspot, measureLab, mobileInspection, revealLensAt, setLensVisible]);

  const focusHotspot = (spot: LabHotspot) => {
    const geometry = measureLab();
    if (!geometry) return;
    const usesMobileCrop = geometry.width < 640;
    const x = usesMobileCrop ? (spot.mobileX ?? spot.x) : spot.x;
    const y = usesMobileCrop ? (spot.mobileY ?? spot.y) : spot.y;
    revealLensAt((x / 100) * geometry.width, (y / 100) * geometry.height);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const isTouchInspection = touchPointerRef.current === event.pointerId;
    if ((!supportsHoverRef.current && !isTouchInspection) || activeHotspotRef.current !== null) return;
    const geometry = geometryRef.current;
    revealLensAt(event.clientX - geometry.left, event.clientY - geometry.top);
  };

  const beginTouchInspection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (supportsHoverRef.current || event.pointerType === 'mouse' || !mobileInspectionRef.current) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, [data-lab-hotspot-detail]')) return;

    dismissHotspot(false);
    const geometry = measureLab();
    if (!geometry) return;
    touchPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    revealLensAt(event.clientX - geometry.left, event.clientY - geometry.top);
  };

  const endTouchInspection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchPointerRef.current !== event.pointerId) return;
    touchPointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`group relative isolate aspect-[4/5] w-full overflow-hidden bg-lab-black sm:aspect-[16/10] lg:aspect-video ${mobileInspection ? 'touch-none cursor-grab active:cursor-grabbing' : 'touch-pan-y'} ${hasFinePointer ? 'cursor-none' : ''}`}
      ref={containerRef}
      onPointerDown={beginTouchInspection}
      onPointerMove={handlePointerMove}
      onPointerUp={endTouchInspection}
      onPointerCancel={endTouchInspection}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse' || !supportsHoverRef.current) return;
        const geometry = measureLab();
        if (!geometry || activeHotspotRef.current !== null) return;
        revealLensAt(event.clientX - geometry.left, event.clientY - geometry.top);
      }}
      onPointerLeave={() => {
        if (supportsHoverRef.current && activeHotspotRef.current === null) setLensVisible(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null) && activeHotspotRef.current === null) {
          setLensVisible(false);
        }
      }}
    >

      <img
        src={imageSrc}
        alt="Merchcraft Apparel Lab Showroom"
        className="relative z-0 h-full w-full select-none object-cover object-[54%_center] sm:object-center"
        referrerPolicy="no-referrer"
        draggable={false}
        decoding="async"
        loading="lazy"
        onClick={() => {
          if (supportsHoverRef.current) dismissHotspot(false);
        }}
      />

      {LAB_HOTSPOTS.map((spot) => (
        <div
          key={spot.id}
          className={`absolute z-40 left-[var(--lab-hotspot-mobile-x)] top-[var(--lab-hotspot-mobile-y)] sm:left-[var(--lab-hotspot-x)] sm:top-[var(--lab-hotspot-y)] ${spot.mobileVisible === false ? 'hidden sm:block' : ''}`}
          style={{
            '--lab-hotspot-x': `${spot.x}%`,
            '--lab-hotspot-y': `${spot.y}%`,
            '--lab-hotspot-mobile-x': `${spot.mobileX ?? spot.x}%`,
            '--lab-hotspot-mobile-y': `${spot.mobileY ?? spot.y}%`
          } as React.CSSProperties}
        >
          <button
            type="button"
            aria-label={`Explore ${spot.title}`}
            aria-expanded={activeHotspot === spot.id}
            aria-controls="lab-hotspot-detail"
            onClick={() => {
              const nextHotspot = activeHotspot === spot.id ? null : spot.id;
              activeHotspotRef.current = nextHotspot;
              setActiveHotspot(nextHotspot);
              if (nextHotspot === null) {
                if (!supportsHoverRef.current) setLensVisible(false);
              } else {
                focusHotspot(spot);
              }
            }}
            onFocus={() => focusHotspot(spot)}
            onPointerEnter={() => focusHotspot(spot)}
            className="group/spot relative flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:outline-offset-2"
          >
            <span className={`absolute h-9 w-9 rounded-full border-2 bg-white/95 shadow-[0_5px_18px_rgba(0,0,0,0.4)] transition motion-reduce:transition-none ${activeHotspot === spot.id ? 'scale-100 border-lab-gold ring-2 ring-white/80' : 'scale-75 border-white group-hover/spot:scale-100 group-focus-visible/spot:scale-100'}`} />
            <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-lab-red shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />

            {hasFinePointer && (
              <span className={`pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1.5 font-accent text-[11px] font-semibold text-lab-black shadow-lg transition motion-reduce:transition-none ${activeHotspot === spot.id ? 'opacity-100' : 'opacity-0 group-hover/spot:opacity-100 group-focus-visible/spot:opacity-100'}`}>
                {spot.title}
              </span>
            )}
          </button>
        </div>
      ))}

      <div
        ref={lensRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-30 block opacity-0 transition-opacity duration-150 will-change-[transform,opacity] motion-reduce:transition-none"
        style={{ width: 196, height: 196 }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full border-[3px] border-white bg-lab-black shadow-[0_18px_44px_rgba(0,0,0,0.38)] ring-1 ring-lab-gold/80" style={{ contain: 'layout paint style' }}>
          <img
            ref={lensImageRef}
            src={imageSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            decoding="async"
            className="absolute left-0 top-0 max-w-none origin-top-left select-none object-cover object-[54%_center] will-change-transform sm:object-center"
          />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.2),transparent_36%)]" />
        </div>
        <div className="absolute -bottom-10 -right-4 h-14 w-5 -rotate-45 rounded-b-full border border-white/45 bg-lab-black shadow-[0_10px_18px_rgba(0,0,0,0.3)]" />
      </div>

      {!hasFinePointer && (
        <button
          type="button"
          aria-pressed={mobileInspection}
          onClick={() => setMobileInspection((isActive) => !isActive)}
          className={`absolute bottom-4 left-4 z-50 inline-flex min-h-11 items-center rounded-full border px-4 font-accent text-xs font-semibold shadow-lg transition motion-reduce:transition-none ${mobileInspection ? 'border-white bg-white text-lab-black' : 'border-white/35 bg-lab-black/80 text-white'}`}
        >
          {mobileInspection ? 'Done looking' : 'Closer look'}
        </button>
      )}

      {activeSpot && (
        <aside
          id="lab-hotspot-detail"
          data-lab-hotspot-detail
          role="region"
          aria-live="polite"
          aria-labelledby="lab-hotspot-detail-title"
          className={`fixed bottom-24 left-4 right-4 z-[100] max-h-[calc(100dvh-7rem)] overflow-y-auto border border-lab-line bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.32)] sm:w-[min(24rem,calc(100%-3rem))] md:p-6 ${detailOpensOnRight ? 'sm:left-auto sm:right-6' : 'sm:left-6 sm:right-auto'}`}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="font-accent text-[11px] font-bold uppercase tracking-[0.14em] text-lab-red">Inside the lab</span>
            <button
              type="button"
              aria-label="Close selected showroom area"
              onClick={() => dismissHotspot(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lab-black/15 bg-lab-white text-lab-black transition hover:border-lab-red hover:bg-lab-red hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-red"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <h4 id="lab-hotspot-detail-title" className="font-accent text-xl font-semibold leading-tight text-lab-black">{activeSpot.title}</h4>
          <p className="mt-3 text-sm font-medium leading-relaxed text-lab-black/65 sm:text-base">{activeSpot.description}</p>
        </aside>
      )}
      <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_70px_rgba(0,0,0,0.38)]" />
    </div>
  );
};


const COLOR_LIBRARY_SWATCHES = [
  { hex: '#CC112C', name: 'Merchcraft Red', code: '186 C', darkInk: false },
  { hex: '#CB9933', name: 'Brand Gold', code: '7407 C', darkInk: true },
  { hex: '#101820', name: 'Brand Black', code: 'Black 6 C', darkInk: false },
  { hex: '#FFFFFF', name: 'Pure White', code: 'White', darkInk: true },
  { hex: '#5A5A40', name: 'Olive Drab', code: '5743 C', darkInk: false },
  { hex: '#2A3B4C', name: 'Deep Navy', code: '296 C', darkInk: false },
  { hex: '#E27D60', name: 'Terracotta', code: '7522 C', darkInk: true },
  { hex: '#85DCB0', name: 'Mint Lab', code: '337 C', darkInk: true },
  { hex: '#41B3A3', name: 'Teal Craft', code: '3262 C', darkInk: true },
] as const;

const PantoneFan = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const colors = COLOR_LIBRARY_SWATCHES;
  const selectedColor = colors[selectedIndex];
  const usesDarkInk = selectedColor.darkInk;

  return (
    <div className="relative w-full">
      <div className="lg:hidden">
        <div className="mx-auto max-w-sm">
          <motion.div
            key={selectedColor.hex}
            initial={{ opacity: 0, y: 12, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`relative h-[20rem] overflow-hidden rounded-[1.75rem] border shadow-[0_24px_55px_rgba(16,24,32,0.18)] ${selectedColor.hex === '#FFFFFF' ? 'border-lab-black/15' : 'border-black/5'}`}
            style={{ backgroundColor: selectedColor.hex }}
          >
            <div className={`flex items-center justify-between px-6 pt-6 font-accent text-[10px] font-bold uppercase tracking-[0.14em] ${usesDarkInk ? 'text-lab-black/65' : 'text-white/75'}`}>
              <span>Selected swatch</span>
              <span>{String(selectedIndex + 1).padStart(2, '0')} / {String(colors.length).padStart(2, '0')}</span>
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-[1.25rem] bg-white p-5 text-lab-black shadow-[0_14px_34px_rgba(16,24,32,0.2)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-accent text-lg font-semibold leading-tight">{selectedColor.name}</p>
                  <p className="mt-1 font-sans text-xs font-bold uppercase tracking-[0.12em] text-lab-black/45">Pantone {selectedColor.code}</p>
                </div>
                <span className="font-accent text-xs font-semibold uppercase tracking-[0.08em] text-lab-black/45">{selectedColor.hex}</span>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 grid grid-cols-3 gap-3" role="group" aria-label="Choose a color swatch">
            {colors.map((color, i) => {
              const isSelected = selectedIndex === i;
              return (
                <button
                  key={color.hex}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Select ${color.name}, Pantone ${color.code}`}
                  onClick={() => setSelectedIndex(i)}
                  className={`relative flex min-h-16 items-end overflow-hidden rounded-xl border-2 p-2.5 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-red motion-reduce:transition-none ${isSelected ? 'scale-[1.03] border-lab-black shadow-md' : color.hex === '#FFFFFF' ? 'border-lab-black/15' : 'border-transparent'}`}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className={`font-accent text-[10px] font-semibold uppercase tracking-[0.06em] ${color.darkInk ? 'text-lab-black/65' : 'text-white/85'}`}>{color.code}</span>
                  {isSelected ? <span className={`absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border ${color.darkInk ? 'border-lab-black/30 bg-lab-black' : 'border-white/60 bg-white'}`} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative hidden h-[600px] w-full items-center justify-center lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-5 lab-grid" />
        <div className="absolute h-[400px] w-[400px] rounded-full border border-lab-black/5 motion-safe:animate-[spin_20s_linear_infinite]" />
        <div className="absolute h-[500px] w-[500px] rounded-full border border-lab-black/[0.03] motion-safe:animate-[spin_30s_linear_infinite_reverse]" />

        <div className="relative h-[320px] w-28">
          {colors.map((color, i) => {
            const isSelected = selectedIndex === i;
            const rotation = (i - (colors.length - 1) / 2) * 10;

            return (
              <motion.button
                key={color.hex}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Select ${color.name}, Pantone ${color.code}`}
                initial={{ rotate: 0, y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                animate={{
                  rotate: rotation,
                  y: isSelected ? -48 : 0,
                  scale: isSelected ? 1.08 : 1,
                  zIndex: isSelected ? 100 : colors.length - i
                }}
                transition={{
                  delay: i * 0.05,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                onClick={() => setSelectedIndex(i)}
                className="absolute inset-0 flex origin-[50%_110%] cursor-pointer flex-col rounded-xl border border-black/5 p-4 text-left shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lab-red"
                style={{ backgroundColor: color.hex }}
              >
                <div className="mt-auto flex flex-col gap-2 rounded bg-white p-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] font-bold uppercase leading-none tracking-tighter text-black">{color.name}</span>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color.hex }} />
                  </div>
                  <div className="h-px w-full bg-black/5" />
                  <span className="font-sans text-[9px] font-bold tracking-[0.2em] text-black/40">{color.code}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const InkTankSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const fillLevel = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section ref={containerRef} className="py-32 px-8 bg-lab-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        {/* Left: Ink Tank */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Lab Flask Icon */}
          <div className="mb-12 relative flex flex-col items-center w-full">
            <div className="absolute inset-0 bg-lab-gold/30 blur-[100px] rounded-full" />
            <motion.div
              animate={{
                filter: ["drop-shadow(0 0 10px rgba(197,160,89,0.4))", "drop-shadow(0 0 20px rgba(197,160,89,0.8))", "drop-shadow(0 0 10px rgba(197,160,89,0.4))"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative z-10"
            >
              <FlaskConical className="w-16 h-16 text-lab-gold" />
            </motion.div>
            <div className="mt-6 text-center relative z-10 w-full">
              <span className="font-mono font-bold text-[11px] text-lab-gold uppercase tracking-[0.6em] block">Pigment Division</span>
            </div>
          </div>

          {/* The Tank */}
          <div className="relative w-80 h-[600px] border-4 border-white/10 rounded-b-[100px] overflow-hidden bg-black/60 backdrop-blur-2xl shadow-[0_0_120px_rgba(197,160,89,0.1)]">
            {/* Refactored Particle System: Background Particles (Depth Layer 1) */}
            {Array.from({ length: 40 }).map((_, i) => {
              const left = Math.random() * 100;
              const size = Math.random() * 1.5 + 0.5;
              const duration = 8 + Math.random() * 12;
              const delay = Math.random() * 10;
              return (
                <motion.div
                  key={`bg-p1-${i}`}
                  initial={{ y: 620, opacity: 0 }}
                  animate={{
                    y: -40,
                    opacity: [0, 0.4, 0],
                    x: [0, Math.random() * 30 - 15, 0]
                  }}
                  transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
                  className="absolute rounded-full bg-white/20 blur-[1.5px] z-0"
                  style={{ width: size, height: size, left: `${left}%` }}
                />
              );
            })}

            {/* Refactored Particle System: Background Particles (Depth Layer 2) */}
            {Array.from({ length: 30 }).map((_, i) => {
              const left = Math.random() * 100;
              const size = Math.random() * 2 + 1;
              const duration = 6 + Math.random() * 8;
              const delay = Math.random() * 10;
              return (
                <motion.div
                  key={`bg-p2-${i}`}
                  initial={{ y: 620, opacity: 0 }}
                  animate={{
                    y: -40,
                    opacity: [0, 0.6, 0],
                    x: [0, Math.random() * 20 - 10, 0]
                  }}
                  transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
                  className="absolute rounded-full bg-white/40 blur-[0.5px] z-0"
                  style={{ width: size, height: size, left: `${left}%` }}
                />
              );
            })}

            {/* Layer 1-3: Unified Liquid Group (Waves + Body) */}
            <motion.div
              style={{ height: fillLevel }}
              className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
            >
              <svg
                className="w-full h-[1000px] absolute top-0 left-0 overflow-visible"
                viewBox="0 0 100 1000"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FEF9C3" /> {/* Cream Highlight Top */}
                    <stop offset="12%" stopColor="#FACC15" /> {/* Vibrant Gold */}
                    <stop offset="40%" stopColor="#D97706" /> {/* Rich Amber-Gold */}
                    <stop offset="75%" stopColor="#78350F" /> {/* Deep Bronze */}
                    <stop offset="100%" stopColor="#451A03" /> {/* Dark Base */}
                  </linearGradient>

                  <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="45%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="white" stopOpacity="0.4" />
                    <stop offset="55%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>

                  <mask id="liquidMask">
                    <motion.path
                      fill="white"
                      animate={{
                        d: [
                          "M 0 10 Q 25 20 50 10 T 100 10 L 100 1000 L 0 1000 Z",
                          "M 0 10 Q 25 0 50 10 T 100 10 L 100 1000 L 0 1000 Z",
                          "M 0 10 Q 25 20 50 10 T 100 10 L 100 1000 L 0 1000 Z"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </mask>
                </defs>

                {/* The "Grouped" Liquid Shape */}
                <g mask="url(#liquidMask)">
                  {/* Base Gradient */}
                  <rect x="0" y="0" width="100" height="1000" fill="url(#liquidGradient)" />

                  {/* Moving Shimmer Overlay - More intense and focused */}
                  <motion.rect
                    x="-150" y="0" width="300" height="1000"
                    fill="url(#shimmerGradient)"
                    animate={{ x: [-150, 150] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    style={{ mixBlendMode: 'overlay' }}
                  />

                  {/* Internal Glow for extra luster */}
                  <rect x="0" y="0" width="100" height="1000" fill="rgba(251,191,36,0.05)" style={{ mixBlendMode: 'screen' }} />
                </g>

                {/* Secondary Back Wave (Slightly more vibrant) */}
                <motion.path
                  fill="#FDE047"
                  opacity="0.4"
                  animate={{
                    d: [
                      "M 0 10 Q 25 5 50 10 T 100 10 L 100 15 L 0 15 Z",
                      "M 0 10 Q 25 15 50 10 T 100 10 L 100 15 L 0 15 Z",
                      "M 0 10 Q 25 5 50 10 T 100 10 L 100 15 L 0 15 Z"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="-scale-x-100 origin-center"
                />
              </svg>
            </motion.div>

            {/* Layer 4: Foreground Particles (Above everything, spread throughout) */}
            <div className="absolute inset-0 z-40 pointer-events-none">
              {Array.from({ length: 40 }).map((_, i) => {
                const left = Math.random() * 100;
                const size = Math.random() * 2.5 + 1;
                return (
                  <motion.div
                    key={`fg-p-${i}`}
                    initial={{ y: 620, opacity: 0 }}
                    animate={{
                      y: -50,
                      opacity: [0, 0.8, 0],
                      x: [0, Math.random() * 30 - 15, 0]
                    }}
                    transition={{ duration: 5 + Math.random() * 7, repeat: Infinity, delay: Math.random() * 10, ease: "easeInOut" }}
                    className="absolute rounded-full bg-white/40 blur-[0.5px] shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    style={{ width: size, height: size, left: `${left}%` }}
                  />
                );
              })}
            </div>

            {/* Tank Reflections & Glass Depth */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/15 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent" />
              <div className="absolute inset-0 border-x border-white/10" />
              {/* Glass Highlight */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-gradient-to-b from-white/5 to-transparent opacity-50" />
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="text-white">
          <motion.h2
            style={{ opacity }}
            className="font-impact text-6xl font-normal uppercase tracking-[0.01em] leading-[0.94] mb-10 md:text-7xl"
          >
            Engineered<br />For The <span className="text-lab-gold">Print.</span>
          </motion.h2>

          <p className="font-sans font-bold text-xl text-white/60 max-w-md leading-relaxed mb-12">
            Our ink lab is where color meets chemistry. We develop custom pigments that bond with fibers at a molecular level, ensuring your brand stays vibrant for a lifetime.
          </p>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-lab-gold" />
              </div>
              <div>
                <h4 className="font-accent text-xl font-semibold leading-tight tracking-[-0.01em] mb-2">High-Durability Inks</h4>
                <p className="text-white/40 text-lg font-bold leading-relaxed">Engineered to withstand heat, moisture, and the rigors of production.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                <Shirt className="w-5 h-5 text-lab-gold" />
              </div>
              <div>
                <h4 className="font-accent text-xl font-semibold leading-tight tracking-[-0.01em] mb-2">Custom Embroidery</h4>
                <p className="text-white/40 text-lg font-bold leading-relaxed">Tactile, high-thread count details for premium headwear and outerwear.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    localStorage.removeItem('darkMode');
  }, []);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.parallax-section').forEach((section) => {
        gsap.to(section, {
          scrollTrigger: { trigger: section, scrub: true },
          y: -40,
          ease: 'none',
        });
      });
    });

    return () => context.revert();
  }, []);

  return (
    <div className="min-h-screen selection:bg-lab-red selection:text-white overflow-x-hidden bg-lab-white transition-colors duration-300">
      <main>
      {/* Hero Section - Full Width with Integrated Text */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col bg-white pt-24 overflow-hidden">
        {/* Main Hero Image - Full Width */}
        <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <img
              src="/assets/images/home-hero.jpg"
              alt="Studio Background"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>

          <div className="relative z-10 text-center px-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mb-6"
            >
              <span className="font-sans font-bold text-[13px] uppercase tracking-[0.5em] text-white/60">Est. 2014 — Santa Ana</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 text-[clamp(3.75rem,16vw,6rem)] leading-[0.88] tracking-[0.01em] md:text-[6vw] md:leading-[0.92]"
            >
              <span className="font-impact font-normal uppercase text-white block">Your Merch,</span>
              <span className="font-impact font-normal uppercase text-white block opacity-90">Our Craft.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-[11px] md:text-[13px] text-white/80 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-[0.15em] mb-12 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            >
              Where brand ideas are engineered into physical form. Every build is developed with purpose, thoughtful direction, and end-to-end production guidance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <Link to="/quote" className="inline-flex bg-white text-lab-black px-12 py-5 rounded-full font-sans font-bold uppercase tracking-widest text-[13px] hover:bg-lab-red hover:text-white transition-all duration-300 shadow-2xl">
                Enter Production
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Bottom Marquee */}
        <div className="h-12 bg-white border-t border-b border-lab-line flex items-center overflow-hidden relative z-30">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap gap-20 items-center px-10"
          >
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-8">
                <span className="font-sans text-[12px] font-bold uppercase tracking-[0.2em]">Screen Printing • Embroidery • Finishing</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-black rotate-45" />
                  <div className="w-1 h-1 bg-black rotate-45" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Hexagon Steps - Interactive Process */}
      <section className="py-24 px-8 bg-lab-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="font-accent text-[12px] font-bold text-lab-red uppercase tracking-[0.14em] mb-6 block">The Build Process</span>
          <h2 className="font-impact text-5xl font-normal uppercase tracking-[0.01em] leading-[0.95] mb-8 md:text-7xl">Custom Crafted<br />Made Simple.</h2>
          <div className="w-24 h-px bg-lab-red/20 mx-auto" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Connecting Lines */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-lab-line -translate-y-1/2 hidden lg:block" />
          <div className="flex flex-col lg:flex-row justify-between items-center gap-20 relative z-10">
            <HexagonStep
              step="Step 1."
              title="Send Your Artwork"
              text="Share your logo, art files, and project notes."
              color="var(--color-lab-red)"
            />
            <div className="hidden lg:flex gap-4">
              <div className="w-3 h-3 rounded-full border border-lab-line" />
              <div className="w-3 h-3 rounded-full border border-lab-line" />
              <div className="w-3 h-3 rounded-full border border-lab-line" />
            </div>
            <HexagonStep
              step="Step 2."
              title="Build Your Collection"
              text="We shape the right garments, decoration, and finish options."
              color="var(--color-lab-gold)"
              delay={0.2}
            />
            <div className="hidden lg:flex gap-4">
              <div className="w-3 h-3 rounded-full border border-lab-line" />
              <div className="w-3 h-3 rounded-full border border-lab-line" />
              <div className="w-3 h-3 rounded-full border border-lab-line" />
            </div>
            <HexagonStep
              step="Step 3."
              title="Approve & Produce"
              text="Approve the proof, then we schedule and produce your order."
              color="#FFFFFF"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      <InkTankSection />

      {/* Lab Showroom - Interactive Exploration */}
      <section className="relative border-y border-lab-line bg-[#f4f1eb] px-5 py-20 sm:px-8 sm:py-24">
        <div className="relative z-20 mx-auto mb-10 max-w-7xl sm:mb-14">
          <div className="grid items-end gap-7 md:grid-cols-[minmax(0,1fr)_minmax(18rem,25rem)] md:gap-16">
            <div className="max-w-3xl text-left">
              <span className="mb-5 block font-accent text-[12px] font-bold uppercase tracking-[0.14em] text-lab-red">Inside Merchcraft</span>
              <h2 className="font-impact text-[clamp(4rem,15vw,6rem)] font-normal uppercase leading-[0.86] tracking-[0.01em] md:text-7xl lg:text-8xl">Lab<br />Showroom.</h2>
            </div>
            <p className="max-w-sm border-l-2 border-lab-gold pl-5 font-sans text-base font-semibold leading-relaxed text-lab-black/60 sm:text-lg">
              A closer look at the materials, references, and finishing details behind every Merchcraft build.
            </p>
          </div>
        </div>

        <div className="relative mx-auto h-auto max-w-7xl border border-lab-black/10 bg-lab-black p-1 shadow-[0_28px_70px_rgba(16,24,32,0.16)] sm:p-2">
          <InteractiveLab />
        </div>
      </section>

      {/* Our Ink & Thread - Direct Quality Section */}
      <section className="py-24 px-8 bg-white relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none lab-grid" />

        {/* Massive Background Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.span
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 0.03, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-impact text-[40vw] text-lab-black leading-none uppercase select-none"
          >
            QUALITY
          </motion.span>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                title: "Durable Printing",
                text: "We use industrial-grade inks that bond directly to the fabric. Your prints won't fade, crack, or peel, even after heavy use.",
                delay: 0.1
              },
              {
                title: "High-Stitch Embroidery",
                text: "Our embroidery is dense and precise. We use high-quality threads that provide a professional, elevated look for your brand.",
                delay: 0.2
              },
              {
                title: "Premium Fabrics",
                text: "We only use high-GSM cotton and durable blends. Our fabrics are chosen for their feel and how well they hold up to printing.",
                delay: 0.3
              },
              {
                title: "Quality Control",
                text: "Every order is inspected by hand. We ensure that every print is sharp and every stitch is perfect before it leaves our shop.",
                delay: 0.4
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                className="group"
              >
                <div className="w-12 h-1 bg-lab-red mb-8 group-hover:w-full transition-all duration-500" />
                <h4 className="font-accent text-xl font-semibold leading-tight tracking-[-0.01em] mb-6">{item.title}</h4>
                <p className="text-lab-black/50 text-base leading-relaxed font-bold">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Color Lab - Pantone Fan Section */}
      <section className="border-y border-lab-line bg-white px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-12 lg:flex-row lg:items-center lg:gap-20">
          <div className="lg:w-1/2">
            <span className="font-accent text-[12px] font-bold text-lab-red uppercase tracking-[0.14em] mb-6 block">Color library</span>
            <h2 className="font-impact text-6xl font-normal uppercase tracking-[0.01em] leading-[0.95] mb-10 md:text-7xl">The Color<br />Library.</h2>
            <p className="font-sans text-base font-bold text-lab-black/50 max-w-md leading-relaxed">
              Pick a swatch to see the color up close. Our team will match the final ink and garment combination for your build.
            </p>
          </div>
          <div className="lg:w-1/2 w-full">
            <PantoneFan />
          </div>
        </div>
      </section>


      {/* Selected Works - Minimal Grid */}
      <section className="py-24 px-8">
        <div className="mb-16 flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-xl text-left">
            <span className="font-accent text-[12px] font-bold text-lab-red uppercase tracking-[0.14em] mb-6 block">Portfolio</span>
            <h2 className="font-impact text-6xl font-normal uppercase tracking-[0.01em] leading-[0.95] md:text-7xl">Recent<br />Work.</h2>
          </div>
          <p className="font-sans text-base font-bold text-lab-black/50 max-w-xs leading-relaxed">
            A selection of custom apparel we've produced for brands, events, and movements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          <ProjectCard
            src="/assets/images/work-firestone-tee.jpg"
            title="808 Heavyweight Tee"
            category="01 / Firestone Walker"
          />
          <ProjectCard
            src="/assets/images/work-elwood-hat.jpg"
            title="Core Logo Hat"
            category="02 / Elwood"
            delay={0.1}
          />
          <ProjectCard
            src="/assets/images/work-elwood-shirt.jpg"
            title="Essential Boxy Shirt"
            category="03 / Elwood"
            delay={0.2}
          />
        </div>

        <div className="mt-16 flex justify-center">
          <Link to="/services" className="group flex items-center gap-4 border border-lab-black/10 px-12 py-6 rounded-full font-sans font-bold uppercase tracking-widest text-[12px] hover:bg-lab-black hover:text-white transition-all duration-500">
            View All Projects
            <ArrowRight className="w-3 h-3 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
      </main>

      {/* Footer - restored from the original homepage */}
      <footer className="bg-lab-white py-24 px-8 border-t border-lab-line transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-20">
          <div className="md:col-span-6">
            <div className="h-10 mb-12">
              <img
                src="/assets/brand/merchcraft-primary-full.svg"
                alt="Merchcraft Logo"
                className="h-full w-auto"
              />
            </div>
            <h2 className="font-impact text-5xl font-normal uppercase tracking-[0.01em] mb-10 leading-[0.98] md:text-6xl">
              Ready to start<br />your next order?
            </h2>
            <Link to="/quote" className="inline-flex bg-lab-black text-white px-12 py-6 rounded-full font-sans font-bold uppercase tracking-widest text-[12px] hover:opacity-80 transition-opacity">
              Enter Production
            </Link>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-lab-black/30 mb-10">Company</h5>
            <ul className="space-y-4 font-sans text-sm uppercase tracking-widest font-bold">
              <li><Link to="/about" className="hover:opacity-50 transition-opacity">About</Link></li>
              <li><Link to="/services" className="hover:opacity-50 transition-opacity">Services</Link></li>
              <li><Link to="/stickers" className="hover:opacity-50 transition-opacity">Stickers</Link></li>
              <li><a href="#" className="hover:opacity-50 transition-opacity">Fabrics</a></li>
              <li><a href="#" className="hover:opacity-50 transition-opacity">Careers</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-lab-black/30 mb-10">Connect</h5>
            <ul className="space-y-4 font-sans text-sm uppercase tracking-widest font-bold">
              <li><a href="#" className="hover:opacity-50 transition-opacity">Instagram</a></li>
              <li><a href="#" className="hover:opacity-50 transition-opacity">LinkedIn</a></li>
              <li><a href="#" className="hover:opacity-50 transition-opacity">Twitter</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-lab-black/30 mb-10">Legal</h5>
            <ul className="space-y-4 font-sans text-sm uppercase tracking-widest font-bold">
              <li><a href="#" className="hover:opacity-50 transition-opacity">Privacy</a></li>
              <li><a href="#" className="hover:opacity-50 transition-opacity">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-lab-line flex flex-col md:flex-row justify-between items-center gap-8 font-sans text-[11px] font-bold uppercase tracking-[0.3em] text-lab-black/30">
          <p>© 2026 Merchcraft Apparel Lab. All Rights Reserved.</p>
          <div className="flex gap-10">
            <span>Santa Ana, CA</span>
            <span>Facility No. 42</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
