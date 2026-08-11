import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  FlaskConical,
  Zap,
  Shirt
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
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
    </div>
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-display font-bold uppercase text-xl tracking-tight mb-1">{title}</h4>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative group cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="relative w-64 h-72 flex items-center justify-center">
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
        <div className={`relative z-10 text-center p-10 flex flex-col items-center justify-center transition-colors duration-500 ${isDark ? 'text-white' : 'text-lab-black'}`}>
          <span className="font-impact text-2xl uppercase tracking-tighter mb-2">{step}</span>
          <h4 className="font-display font-bold text-[11px] uppercase tracking-[0.2em] mb-4 leading-tight">{title}</h4>
          <div className="max-w-[180px]">
            <motion.p
              animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
              className="font-sans font-bold text-[12px] uppercase tracking-widest leading-relaxed overflow-hidden text-center"
            >
              {text}
            </motion.p>
          </div>
          {!isExpanded && (
            <span className="font-sans font-bold text-[9px] uppercase tracking-widest opacity-40 mt-2 group-hover:opacity-100 transition-opacity">Click to Expand</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MagnifyingGlass = ({ src, mousePos, isVisible, hotspots }: {
  src: string;
  mousePos: { x: number, y: number, x_percent: number, y_percent: number, width: number, height: number };
  isVisible: boolean;
  hotspots: any[];
}) => {
  const zoom = 3.5;
  const size = 240;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
        x: mousePos.x - size / 2,
        y: mousePos.y - size / 2
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300, opacity: { duration: 0.2 } }}
      className="absolute pointer-events-none z-50 border-2 border-white/30 rounded-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-[2px]"
      style={{
        width: size,
        height: size,
        left: 0,
        top: 0
      }}
    >
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${mousePos.width * zoom}px ${mousePos.height * zoom}px`,
          backgroundPosition: `${-mousePos.x * zoom + size / 2}px ${-mousePos.y * zoom + size / 2}px`,
        }}
      />

      {/* Magnified Hotspots */}
      <div className="absolute inset-0 pointer-events-none">
        {hotspots.map((spot) => {
          const spotX = (spot.x / 100) * mousePos.width;
          const spotY = (spot.y / 100) * mousePos.height;
          const magX = (spotX - mousePos.x) * zoom + size / 2;
          const magY = (spotY - mousePos.y) * zoom + size / 2;

          // Only render if within the lens bounds (with some padding)
          if (magX < -20 || magX > size + 20 || magY < -20 || magY > size + 20) return null;

          return (
            <div
              key={`mag-${spot.id}`}
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2"
              style={{ left: magX, top: magY }}
            >
              <div className="w-full h-full bg-lab-red rounded-full opacity-40 animate-pulse" />
              <div className="absolute inset-0 border border-white rounded-full animate-ping opacity-20" />
            </div>
          );
        })}
      </div>

      {/* Lens Flare/Reflection Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />

      {/* Technical HUD inside glass */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-full h-px bg-lab-red/20 absolute top-1/2" />
        <div className="h-full w-px bg-lab-red/20 absolute left-1/2" />
        <div className="w-12 h-12 border border-lab-red/40 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-lab-red rounded-full animate-ping" />
        </div>

        {/* Dynamic Coordinates */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
          <span className="font-mono font-bold text-[10px] text-white tracking-widest uppercase">
            X:{Math.round(mousePos.x_percent)} Y:{Math.round(mousePos.y_percent)} // ZOOM_3.5X
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const InteractiveLab = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, x_percent: 0, y_percent: 0, width: 0, height: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hotspots = [
    {
      id: 1,
      x: 25,
      y: 35,
      title: "Curated Archive",
      description: "A collection of our most technical builds, showcasing various printing and washing techniques from the past decade.",
      label: "Specimen_Wall"
    },
    {
      id: 2,
      x: 45,
      y: 75,
      title: "Production Table",
      description: "Where every garment is hand-inspected for quality and precision before leaving the lab. Our standards are non-negotiable.",
      label: "Quality_Control"
    },
    {
      id: 3,
      x: 52,
      y: 65,
      title: "Industrial Thread",
      description: "We use high-tenacity polyester threads that provide superior strength and color fastness for all embroidery applications.",
      label: "Thread_Spec"
    },
    {
      id: 4,
      x: 65,
      y: 45,
      title: "Inventory Racks",
      description: "Our facility maintains a deep stock of premium heavyweight blanks, ready for immediate custom engineering.",
      label: "Stock_Archive"
    },
    {
      id: 5,
      x: 85,
      y: 35,
      title: "Facility No. 42",
      description: "Our headquarters in Santa Ana, CA. A purpose-built space designed for apparel engineering and brand development.",
      label: "Lab_HQ"
    }
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const x_percent = (x / rect.width) * 100;
    const y_percent = (y / rect.height) * 100;
    setMousePos({ x, y, x_percent, y_percent, width: rect.width, height: rect.height });
  };

  return (
    <div className="relative w-full aspect-video bg-lab-black group cursor-none"
         ref={containerRef}
         onMouseMove={handleMouseMove}
         onMouseEnter={() => setIsHovering(true)}
         onMouseLeave={() => {
           setIsHovering(false);
           setActiveHotspot(null);
         }}>

      {/* Main Image */}
      <img
        src="/assets/images/lab-showroom.jpg"
        alt="Merchcraft Apparel Lab Showroom"
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-1000"
        referrerPolicy="no-referrer"
      />

      {/* Hotspots */}
      {hotspots.map((spot) => (
        <div
          key={spot.id}
          className="absolute z-30"
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
        >
          <button
            onClick={() => setActiveHotspot(activeHotspot === spot.id ? null : spot.id)}
            className="relative group/spot"
          >
            <div className="w-4 h-4 bg-lab-red rounded-full animate-pulse shadow-[0_0_20px_rgba(163,42,41,0.8)]" />
            <div className="absolute inset-0 w-4 h-4 border border-white rounded-full animate-ping opacity-40" />

            {/* Label */}
            <div className="absolute top-1/2 left-6 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover/spot:opacity-100 transition-opacity pointer-events-none">
              <span className="bg-black/80 backdrop-blur-md text-white font-mono text-[8px] uppercase tracking-widest px-2 py-1 border border-white/10">
                {spot.label}
              </span>
            </div>
          </button>

          {/* Info Card */}
          <AnimatePresence>
            {activeHotspot === spot.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className={`absolute top-8 w-64 bg-white p-6 shadow-2xl z-50 border border-lab-line ${spot.x > 75 ? 'right-0' : 'left-0'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-px bg-lab-red" />
                  <span className="font-mono text-[9px] text-lab-red uppercase tracking-widest">Analysis_Active</span>
                </div>
                <h4 className="font-display font-bold uppercase text-lg mb-3 tracking-tight">{spot.title}</h4>
                <p className="text-lab-black/60 text-[14px] leading-relaxed font-bold mb-4">
                  {spot.description}
                </p>
                <div className="pt-4 border-t border-lab-line flex justify-between items-center">
                  <span className="font-mono text-[8px] text-lab-black/30 uppercase tracking-widest">Ref_ID: {spot.id}00X</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHotspot(null);
                    }}
                    className="font-mono text-[9px] text-lab-red uppercase tracking-widest hover:underline"
                  >
                    [ Close ]
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Magnifying Glass Lens */}
      <MagnifyingGlass
        src="/assets/images/lab-showroom.jpg"
        mousePos={mousePos}
        isVisible={isHovering && activeHotspot === null}
        hotspots={hotspots}
      />

      {/* Technical HUD Overlays */}
      <div className="absolute top-10 left-10 pointer-events-none z-20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-lab-red rounded-full animate-pulse" />
            <span className="font-mono font-bold text-[12px] text-white uppercase tracking-[0.3em]">Live_Feed: Facility_42</span>
          </div>
          <div className="font-mono font-bold text-[11px] text-white/40 uppercase tracking-widest">Resolution: 4K_RAW // ISO: 400</div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 pointer-events-none z-20 text-right">
        <div className="font-mono font-bold text-[12px] text-white uppercase tracking-[0.3em] mb-2">Interactive_Mode: Active</div>
        <div className="font-mono font-bold text-[11px] text-white/40 uppercase tracking-widest">Click_Hotspots_For_Data</div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />
    </div>
  );
};


const PantoneFan = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const colors = [
    { hex: '#A32A29', name: 'Merchcraft Red', code: '187 C' },
    { hex: '#C5A059', name: 'Apparel Gold', code: '4515 C' },
    { hex: '#141414', name: 'Carbon Black', code: 'Black 6 C' },
    { hex: '#F5F5F5', name: 'Lab White', code: 'Cool Gray 1 C' },
    { hex: '#5A5A40', name: 'Olive Drab', code: '5743 C' },
    { hex: '#2A3B4C', name: 'Deep Navy', code: '296 C' },
    { hex: '#E27D60', name: 'Terracotta', code: '7522 C' },
    { hex: '#85DCB0', name: 'Mint Lab', code: '337 C' },
    { hex: '#41B3A3', name: 'Teal Craft', code: '3262 C' },
  ];

  return (
    <div className="relative h-[600px] w-full flex items-center justify-center">
      <div className="absolute inset-0 opacity-5 lab-grid pointer-events-none" />

      {/* Decorative Circles */}
      <div className="absolute w-[400px] h-[400px] border border-lab-black/5 rounded-full animate-[spin_20s_linear_infinite]" />
      <div className="absolute w-[500px] h-[500px] border border-lab-black/[0.03] rounded-full animate-[spin_30s_linear_infinite_reverse]" />

      <div className="relative w-28 h-[320px]">
        {colors.map((color, i) => {
          const isSelected = selectedIndex === i;
          const rotation = (i - (colors.length - 1) / 2) * (selectedIndex !== null ? 22 : 10);

          return (
            <motion.div
              key={i}
              initial={{ rotate: 0, y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              animate={{
                rotate: rotation,
                y: isSelected ? -60 : 0,
                scale: isSelected ? 1.1 : 1,
                zIndex: isSelected ? 100 : colors.length - i
              }}
              transition={{
                delay: i * 0.05,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              onClick={() => setSelectedIndex(isSelected ? null : i)}
              className="absolute inset-0 origin-[50%_110%] rounded-xl shadow-2xl cursor-pointer border border-black/5 transition-shadow duration-500 flex flex-col p-4"
              style={{ backgroundColor: color.hex }}
            >
              {/* Swatch Tag */}
              <div className="mt-auto bg-white p-2.5 rounded shadow-lg flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[10px] font-bold uppercase text-black tracking-tighter leading-none">{color.name}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex }} />
                </div>
                <div className="h-px bg-black/5 w-full" />
                <span className="font-sans text-[9px] text-black/40 font-bold tracking-[0.2em]">{color.code}</span>
              </div>

              {/* Tooltip on hover/select */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow-2xl whitespace-nowrap z-[110]"
                  >
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black" />
                    <span className="font-sans text-[11px] font-bold uppercase tracking-widest">Active: {color.name}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
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
            className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.85] mb-10"
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
                <h4 className="font-display font-bold uppercase text-lg tracking-tight mb-2">High-Durability Inks</h4>
                <p className="text-white/40 text-lg font-bold leading-relaxed">Engineered to withstand heat, moisture, and the rigors of production.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                <Shirt className="w-5 h-5 text-lab-gold" />
              </div>
              <div>
                <h4 className="font-display font-bold uppercase text-lg tracking-tight mb-2">Custom Embroidery</h4>
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
              className="text-[8vw] md:text-[6vw] leading-[0.9] tracking-tighter mb-8"
            >
              <span className="font-display font-bold uppercase text-white block">Your Merch,</span>
              <span className="font-serif italic text-white block opacity-90">Our Craft.</span>
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
                <span className="font-sans text-[12px] font-bold uppercase tracking-[0.2em]">Sign up for 10% off your first order</span>
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
          <span className="font-sans text-[12px] font-bold text-lab-red uppercase tracking-[0.4em] mb-6 block">The Build Process</span>
          <h2 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-8">Custom Crafted<br />Made Simple.</h2>
          <div className="w-24 h-px bg-lab-red/20 mx-auto" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Connecting Lines */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-lab-line -translate-y-1/2 hidden lg:block" />
          <div className="flex flex-col lg:flex-row justify-between items-center gap-20 relative z-10">
            <HexagonStep
              step="Step 1."
              title="Submit Your Brand Logos & Assets"
              text="Upload your vector files and design guidelines to our secure portal for initial review."
              color="var(--color-lab-red)"
            />
            <div className="hidden lg:flex gap-4">
              <div className="w-3 h-3 rounded-full border border-lab-line" />
              <div className="w-3 h-3 rounded-full border border-lab-line" />
              <div className="w-3 h-3 rounded-full border border-lab-line" />
            </div>
            <HexagonStep
              step="Step 2."
              title="We'll Create A Catalogue Tailored For You"
              text="Our design team engineers a custom collection based on your brand identity and goals."
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
              title="Place Your Order & Enter Production"
              text="Approve your digital proofs and we move into physical manufacturing immediately."
              color="#FFFFFF"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      <InkTankSection />

      {/* Lab Showroom - Interactive Exploration */}
      <section className="py-24 px-8 bg-white border-y border-lab-line relative">
        {/* Lab Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Scanning Line Animation */}
        <motion.div
          animate={{ y: ['0%', '1000%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-px bg-lab-red/20 z-10 pointer-events-none"
        />

        <div className="max-w-7xl mx-auto mb-16 relative z-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="max-w-xl">
              <span className="font-sans text-[12px] font-bold text-lab-red uppercase tracking-[0.4em] mb-6 block">The Showroom</span>
              <h2 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.85]">Lab<br />Showroom.</h2>
            </div>
            <p className="font-sans text-base font-bold text-lab-black/50 max-w-xs leading-relaxed">
              Step into the lab. Explore materials and techniques in a 3D environment. Click to zoom into the details.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative h-auto">
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
                <h4 className="font-display font-bold uppercase text-xl mb-6 tracking-tight">{item.title}</h4>
                <p className="text-lab-black/50 text-base leading-relaxed font-bold">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Color Lab - Pantone Fan Section */}
      <section className="py-24 bg-white border-y border-lab-line px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <span className="font-sans text-[12px] font-bold text-lab-red uppercase tracking-[0.4em] mb-6 block">Color_Spec</span>
            <h2 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-none mb-10">The Color<br />Library.</h2>
            <p className="font-sans text-base font-bold text-lab-black/50 max-w-md leading-relaxed">
              Our curated palette of premium inks and fabric dyes. Select a swatch to view technical specifications and availability.
            </p>
          </div>
          <div className="lg:w-1/2 w-full">
            <PantoneFan />
          </div>
        </div>
      </section>


      {/* Selected Works - Minimal Grid */}
      <section className="py-24 px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-10">
          <div className="max-w-xl">
            <span className="font-sans text-[12px] font-bold text-lab-red uppercase tracking-[0.4em] mb-6 block">Portfolio</span>
            <h2 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.85]">Recent<br />Work.</h2>
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
            <h2 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tighter mb-10 leading-tight">
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
