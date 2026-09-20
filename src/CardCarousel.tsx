import { useState, useEffect, useRef } from 'react';

const CARD_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_030111_a9e15665-d379-4a7f-8116-695bbe452ad1.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_171347_f640c30d-ec21-426a-98bc-77e07c2c60cb.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4',
];

interface DetailBlock {
  heading?: string;
  lines: string[];
  link?: { label: string; href: string };
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  lines: string[]; // short teaser on the card back
  detail: DetailBlock[]; // full resume content shown in the detail panel
}

// ARYAN KUMAR — resume content
const SECTIONS: Section[] = [
  {
    id: '01',
    title: 'ABOUT',
    subtitle: 'ARYAN KUMAR',
    lines: ['Aspiring AI & Data Science dev', 'B.Tech AI & DS (JECRC, Jaipur)', 'ML apps · RAG · agentic AI'],
    detail: [
      {
        heading: 'ARYAN KUMAR',
        lines: [
          'Aspiring AI and Data Science developer currently pursuing a B.Tech in Artificial Intelligence & Data Science.',
          'Passionate about building machine learning applications, AI-powered tools, and agentic AI systems.',
          'Experienced in developing web applications, machine learning models, RAG-based solutions, and interactive dashboards using modern technologies.',
          'Currently focused on building real-world AI applications and intelligent agentic systems.',
        ],
      },
      {
        heading: 'LANGUAGES',
        lines: ['English — Professional Proficiency', 'Hindi — Native Proficiency'],
      },
    ],
  },
  {
    id: '02',
    title: 'EDUCATION',
    subtitle: 'WHERE I STUDIED',
    lines: ['B.Tech — AI & Data Science', 'JECRC Foundation · 2025–2029', "ISC — St. Xavier's · 2024"],
    detail: [
      {
        heading: 'B.TECH — ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
        lines: ['Jaipur Engineering College and Research Centre Foundation, Jaipur', '2025 – 2029'],
      },
      {
        heading: 'ISC (CLASS XII)',
        lines: ["St. Xavier's School", '2024'],
      },
    ],
  },
  {
    id: '03',
    title: 'SKILLS',
    subtitle: 'WHAT I USE',
    lines: ['Python · Java · React.js · Node.js', 'RAG · LangChain · LangGraph', 'Agentic AI · Vector Databases'],
    detail: [
      { heading: 'PROGRAMMING', lines: ['Python, Java'] },
      { heading: 'WEB DEVELOPMENT (VIBE CODING)', lines: ['HTML, CSS, React.js, Node.js'] },
      { heading: 'AI / MACHINE LEARNING', lines: ['Machine Learning, Prompt Engineering'] },
      {
        heading: 'LLM & GENERATIVE AI',
        lines: ['LLM Application, Generative AI Development, Multimodal Prompting'],
      },
      {
        heading: 'RAG & RETRIEVAL',
        lines: ['Retrieval-Augmented Generation (RAG), Advanced RAG, Vector Databases'],
      },
      {
        heading: 'AGENTIC AI',
        lines: ['Agentic Systems, Generative AI Agents, LangGraph, LangChain, CrewAI'],
      },
      { heading: 'TOOLS & PLATFORMS', lines: ['Git, GitHub, Vercel, Render, N8N'] },
    ],
  },
  {
    id: '04',
    title: 'PROJECTS',
    subtitle: 'WHAT I BUILT',
    lines: ['AI Chatbot for Ocean Data', 'AI Voice Agent for Health Workers', 'Remote Sensing Analysis Platform'],
    detail: [
      {
        heading: 'AI CHATBOT FOR OCEAN DATA',
        lines: [
          'Built an AI-powered chatbot that retrieves Argo float oceanographic data using vector search and semantic retrieval.',
          'Tech stack: Node.js, Pinecone, Gemini AI, PostgreSQL, RAG, LangChain',
        ],
      },
      {
        heading: 'AI VOICE AGENT FOR COMMUNITY HEALTH WORKERS',
        lines: [
          'Built a multilingual voice agent that lets frontline health workers log home visits by speaking naturally in Hindi or English, converting free-form speech into structured medical records in real time and prompting for missing fields through a conversational follow-up loop.',
          'Tech stack: Next.js, TypeScript, AssemblyAI Streaming Speech-to-Text, LLM-based structured extraction, Supabase, PostgreSQL',
        ],
      },
      {
        heading: 'AI-POWERED REMOTE SENSING ANALYSIS PLATFORM',
        lines: [
          'Built an agentic AI system for analyzing multi-modal satellite imagery using RAG, computer vision, geospatial processing, and VQA to support intelligent Earth-observation tasks.',
          'Tech stack: Python, PyTorch, LangChain, RAG, Rasterio/GDAL, GeoPandas, SAR & multispectral imagery, LLMs, Computer Vision',
        ],
      },
    ],
  },
  {
    id: '05',
    title: 'CERTIFICATIONS',
    subtitle: 'WHAT I EARNED',
    lines: ['IBM RAG and Agentic AI', 'Professional Certificate', 'Retrieval · Agents · LLM apps'],
    detail: [
      {
        heading: 'IBM RAG AND AGENTIC AI PROFESSIONAL CERTIFICATE',
        lines: [
          'Professional certificate covering retrieval-augmented generation, vector search, and the design of generative AI agents.',
        ],
      },
    ],
  },
  {
    id: '06',
    title: 'EXPERIENCE',
    subtitle: 'WHERE I WORKED',
    lines: ['AI Engineer — AI service company', 'Social media — Aashayien (JECRC)', 'Content writing & strategy'],
    detail: [
      {
        heading: 'AI ENGINEER — AI SERVICE COMPANY',
        lines: [
          'Worked in an AI service delivering company as an AI engineer; worked on an application to make interior designing a new perspective — from the real world to the virtual world.',
        ],
      },
      {
        heading: 'SOCIAL MEDIA — AASHAYIEN CLUB (JECRC FOUNDATION)',
        lines: [
          'Have been a prominent member of the social media team in the role of content writer, with content strategy and planning.',
        ],
      },
    ],
  },
  {
    id: '07',
    title: 'CONTACT',
    subtitle: 'SAY HELLO',
    lines: ['aryanraj0828@gmail.com', '8340477494', 'github.com/alpha730'],
    detail: [
      {
        heading: 'REACH ME',
        lines: ['Phone: 8340477494', 'Email: aryanraj0828@gmail.com'],
      },
      {
        heading: 'LINKEDIN',
        lines: [],
        link: { label: 'Linkedin', href: 'https://www.linkedin.com/in/aryan-kumar-jecrc/' },
      },
      {
        heading: 'GITHUB',
        lines: [],
        link: { label: 'Github', href: 'https://github.com/alpha730' },
      },
    ],
  },
];

const FOCUS_Z = 620; // translateZ of the selected card (zoomed, moved aside)

interface CardCarouselProps {
  onExit: () => void;
}

export default function CardCarousel({ onExit }: CardCarouselProps) {
  const cardCount = SECTIONS.length;
  const cardsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameId = useRef<number>(0);

  // Continuous scroll progress (auto-drifts, plus user wheel input)
  const progress = useRef<number>(0);
  const scrollVelocity = useRef<number>(0);

  // Focus (select + zoom aside) state: ref drives the render loop,
  // state drives the detail panel visibility
  const focusAnim = useRef({ target: 0, t: 0, idx: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const focusedRef = useRef<number | null>(null);
  // Keeps the last section rendered in the panel during the exit slide
  const lastFocused = useRef<number>(0);

  // Track mouse coordinates for interactive 3D parallax tilt with inertia damping
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Responsive state containing card dimensions
  const [metrics, setMetrics] = useState({
    cardW: 336,
    cardH: 211, // 1.59 standard credit card ratio
  });

  const setFocus = (idx: number | null) => {
    focusedRef.current = idx;
    setFocusedIndex(idx);
    if (idx === null) {
      focusAnim.current.target = 0;
    } else {
      lastFocused.current = idx;
      focusAnim.current.idx = idx;
      focusAnim.current.target = 1;
    }
  };

  const toggleFocus = () => {
    if (focusedRef.current !== null) {
      setFocus(null);
    } else {
      // Select whichever card is currently at the front center
      const idx = ((Math.round(progress.current) % cardCount) + cardCount) % cardCount;
      setFocus(idx);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const ry = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      mouse.current.targetX = Math.max(-1, Math.min(1, rx));
      mouse.current.targetY = Math.max(-1, Math.min(1, ry));
    };

    const handleMouseLeave = () => {
      mouse.current.targetX = 0;
      mouse.current.targetY = 0;
    };

    // Wheel scrubs through the deck with momentum (ignored while focused,
    // so the wheel scrolls the detail panel instead)
    const handleWheel = (e: WheelEvent) => {
      if (focusedRef.current !== null) return;
      scrollVelocity.current += e.deltaY * 0.00012;
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (focusedRef.current !== null) {
          setFocus(null);
        } else {
          onExit();
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onExit]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      let cardW = Math.round(w * 0.16 + 130);

      const heightFactor = Math.min(1.0, Math.max(0.65, h / 850));
      cardW = Math.round(cardW * heightFactor);

      cardW = Math.min(336, Math.max(150, cardW));
      const cardH = Math.round(cardW / 1.5925); // Standard credit card ratio

      setMetrics({ cardW, cardH });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute positions, rotations, and visual rules at 60fps
  const renderLoop = () => {
    // Ease the focus blend toward its target
    const F = focusAnim.current;
    F.t += (F.target - F.t) * 0.09;
    if (F.t < 0.0005) F.t = 0;
    const ft = F.t;

    // Carousel only flows while no card is focused
    if (F.target === 0 && ft < 0.02) {
      progress.current += 0.0016 + scrollVelocity.current;
      scrollVelocity.current *= 0.92;
    }

    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

    const cards = cardsRefs.current;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const { cardH } = metrics;

    const continuousProgress = progress.current;
    const roundedIndex = Math.round(continuousProgress);
    const diffFromRound = continuousProgress - roundedIndex; // ranges between [-0.5, 0.5]

    // Custom non-linear magnetic step logic: brief dwell at front center
    const easedDiff = Math.sign(diffFromRound) * Math.pow(Math.abs(diffFromRound) * 2, 4.2) / 2;
    const virtualActiveIndex = roundedIndex + easedDiff;

    for (let i = 0; i < cardCount; i++) {
      const card = cards[i];
      if (!card) continue;

      // Solve circular wrapping to get closest representation in [-cardCount/2, cardCount/2]
      let offset = i - virtualActiveIndex;
      const halfCount = cardCount / 2;
      while (offset > halfCount) offset -= cardCount;
      while (offset < -halfCount) offset += cardCount;

      const absOffset = Math.abs(offset);
      const sign = Math.sign(offset);

      if (absOffset > 3.0 && !(ft > 0 && i === F.idx)) {
        card.style.visibility = 'hidden';
        continue;
      } else {
        card.style.visibility = 'visible';
      }

      const gap = 36;
      const peekAmount = -55;
      const D = 1350; // Perspective distance

      let x = 0;
      let y = 0;
      let z = 0;
      let rot = 0;

      if (absOffset <= 1) {
        const t = absOffset;
        const easedT = t * t * (3 - 2 * t);

        const targetY = cardH + gap;
        y = -sign * (easedT * targetY);

        z = 400 + easedT * (220 - 400);
        rot = easedT * 132;
      } else if (absOffset <= 2) {
        const t = absOffset - 1;
        const easedT = t * t * (3 - 2 * t);

        const yStart = cardH + gap;
        const zStart = 220;
        const rotStart = 132;

        const zEnd = -60;
        const rotEnd = 175;

        const sEnd = D / (D - zEnd);
        const yEnd = (h / 2 - peekAmount) / sEnd - cardH / 2;

        const currentY = yStart + easedT * (yEnd - yStart);
        y = -sign * currentY;

        z = zStart + easedT * (zEnd - zStart);
        rot = rotStart + easedT * (rotEnd - rotStart);
      } else {
        const t = Math.min(absOffset - 2, 1);
        const easedT = t * t * (3 - 2 * t);

        const zStart = -60;
        const rotStart = 175;

        const zEnd3 = -250;
        const rotEnd3 = 195;

        const sEnd2 = D / (D - zStart);
        const yEnd2 = (h / 2 - peekAmount) / sEnd2 - cardH / 2;

        const sEnd3 = D / (D - zEnd3);
        const yEnd3 = (h / 2 + 100) / sEnd3 + cardH / 2;

        const currentY = yEnd2 + easedT * (yEnd3 - yEnd2);
        y = -sign * currentY;

        z = zStart + easedT * (zEnd3 - zStart);
        rot = rotStart + easedT * (rotEnd3 - rotStart);
      }

      const localCardRotation = -sign * rot;

      const centerFactor = Math.max(0, 1 - absOffset);

      const maxTiltY = 15;
      const maxTiltX = 12;

      const activeTiltX = -mouse.current.y * maxTiltX * centerFactor;
      const activeTiltY = mouse.current.x * maxTiltY * centerFactor;

      let totalRotX = localCardRotation + activeTiltX;
      let totalRotY = activeTiltY;
      let rotZ = -3;
      let opacity = 1;

      // ---- focus blend: the selected card zooms in and glides to the
      //      side (top on mobile), staying face-up exactly as it looks in
      //      the deck; everything else dims behind the detail panel ----
      if (ft > 0) {
        if (i === F.idx) {
          const isDesktop = w >= 1024;
          const sF = D / (D - FOCUS_Z); // perspective scale at focus depth
          const xTarget = isDesktop ? (-w * 0.235) / sF : 0;
          const yTarget = isDesktop ? 0 : -(h * 0.26) / sF;

          x = xTarget * ft;
          y = y * (1 - ft) + yTarget * ft;
          z = z + (FOCUS_Z - z) * ft;
          totalRotX = totalRotX * (1 - ft);
          totalRotY = totalRotY * (1 - ft);
          rotZ = -3 * (1 - ft);
        } else {
          opacity = 1 - ft * 0.8;
        }
      }

      card.style.zIndex = Math.round(z).toString();
      card.style.opacity = opacity.toFixed(3);

      card.style.transform = `translateX(${x.toFixed(2)}px) translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateX(${totalRotX.toFixed(2)}deg) rotateY(${totalRotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
    }
  };

  useEffect(() => {
    const tick = () => {
      renderLoop();
      frameId.current = requestAnimationFrame(tick);
    };

    frameId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

  // Slices for 3D volumetric depth
  const thicknessLayers = [-1.47, -0.73, 0, 0.73, 1.47];

  const open = focusedIndex !== null;
  const panelSection = SECTIONS[focusedIndex ?? lastFocused.current];

  return (
    <div
      className="absolute inset-0 bg-[#000000] text-white flex items-center justify-center overflow-hidden select-none animate-fade-in cursor-pointer"
      onClick={toggleFocus}
    >
      {/* 3D perspective camera space */}
      <div
        className="relative w-full h-full flex items-center justify-center pointer-events-none"
        style={{
          perspective: '1350px',
        }}
      >
        {/* Dynamic 3D coordinate viewport */}
        <div
          className="absolute"
          style={{
            width: `${metrics.cardW}px`,
            height: `${metrics.cardH}px`,
            transformStyle: 'preserve-3d',
          }}
        >
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              ref={(el) => {
                cardsRefs.current[i] = el;
              }}
              className="absolute inset-0"
              style={{
                width: `${metrics.cardW}px`,
                height: `${metrics.cardH}px`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'visible',
              }}
            >
              {/* Build physical 3D volumetric thickness by dense parallel layering */}
              {thicknessLayers.map((zOffset, layerIdx) => {
                const isFrontFace = layerIdx === thicknessLayers.length - 1;
                const isBackFace = layerIdx === 0;

                const videoSrc = CARD_VIDEOS[i % CARD_VIDEOS.length];
                const baseBgColor = '#0f0f0f';

                // Middle structural slice
                if (!isFrontFace && !isBackFace) {
                  return (
                    <div
                      key={layerIdx}
                      className="absolute inset-0 rounded-[16px] border border-[#808080] pointer-events-none overflow-hidden"
                      style={{
                        backgroundColor: '#808080',
                        transform: `translateZ(${zOffset}px)`,
                      }}
                    />
                  );
                }

                // Front face slice
                if (isFrontFace) {
                  return (
                    <div
                      key={layerIdx}
                      className="absolute inset-0 rounded-[16px] border border-white/15 pointer-events-none overflow-hidden"
                      style={{
                        backgroundColor: baseBgColor,
                        transform: `translateZ(${zOffset}px)`,
                        backfaceVisibility: 'hidden',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
                      }}
                    >
                      <video
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover rounded-[16px]"
                      />

                      <div className="absolute inset-0 p-5 sm:p-6 text-white h-full w-full font-sans z-10 bg-black/15">
                        {/* Silver metallic contact chip - mid-left */}
                        <div className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2">
                          <svg
                            className="w-6 h-6 sm:w-[29px] sm:h-[29px]"
                            viewBox="0 0 60 60"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M20 8H40V14C40.0016 14.5299 40.2128 15.0377 40.5875 15.4125C40.9623 15.7872 41.4701 15.9984 42 16H59V24H42C41.4701 24.0016 40.9623 24.2128 40.5875 24.5875C40.2128 24.9623 40.0016 25.4701 40 26V52H20V8ZM18 8H8.00039C4.47435 8 1.56576 10.6083 1.08 14H18V8ZM1 16V24V26V34V36V44H18V36H1V34H18V26H1V24H18V16H1ZM1.08 46C1.56576 49.3917 4.47435 52 8.00039 52H18V46H1.08ZM42 14V8H52.0004C55.5264 8 58.4342 10.6084 58.92 14H42ZM59 26H42V34H59V26ZM59 36H42V44H59V36ZM52.0004 52H42V46H58.92C58.4342 49.3916 55.5264 52 52.0004 52Z"
                              fill={`url(#chip_gradient_${i})`}
                            />
                            <defs>
                              <linearGradient
                                id={`chip_gradient_${i}`}
                                x1="30"
                                y1="8"
                                x2="30"
                                y2="52"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop stopColor="white" />
                                <stop offset="1" stopColor="#999999" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {/* Section title - top-right */}
                        <div className="absolute right-5 sm:right-6 top-5 sm:top-6 text-right opacity-95">
                          <div className="font-mono-jb text-[14px] sm:text-[18px] font-bold tracking-[0.18em]">
                            {section.title}
                          </div>
                          <div className="font-mono-jb text-[8px] sm:text-[10px] text-white/60 tracking-[0.14em]">
                            {section.subtitle}
                          </div>
                        </div>

                        {/* Section index - bottom-left */}
                        <div className="absolute left-5 sm:left-6 bottom-5 sm:bottom-6 font-mono-jb text-[10px] sm:text-[12px] tracking-[0.22em] text-white/70">
                          {section.id} / 0{SECTIONS.length}
                        </div>

                        {/* Double intersecting circles - bottom right corner */}
                        <div className="absolute right-5 sm:right-6 bottom-5 sm:bottom-6 flex -space-x-3 items-center opacity-90">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 backdrop-blur-[1px] border border-white/10" />
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/35 backdrop-blur-[1px] border border-white/10" />
                        </div>
                      </div>
                    </div>
                  );
                }

                // Back face slice
                if (isBackFace) {
                  return (
                    <div
                      key={layerIdx}
                      className="absolute inset-0 rounded-[16px] border border-white/15 pointer-events-none overflow-hidden"
                      style={{
                        backgroundColor: baseBgColor,
                        transform: `translateZ(${zOffset}px) rotateX(180deg)`,
                        backfaceVisibility: 'hidden',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
                      }}
                    >
                      {/* Blurred video on the back face of the card */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ filter: 'blur(16px)', transform: 'scale(1.15)' }}
                      >
                        <video
                          src={videoSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>

                      {/* Magnetic stripe */}
                      <div className="absolute left-0 right-0 top-4 sm:top-5 h-7 sm:h-9 bg-black/85 backdrop-blur-md z-10" />

                      {/* Section teaser - bottom-left, JetBrains Mono */}
                      <div className="absolute left-4 sm:left-6 bottom-4 sm:bottom-5 z-20 flex flex-col gap-0.5 sm:gap-1 text-left font-mono-jb">
                        <div className="text-[10px] sm:text-[12px] font-medium tracking-[0.14em] text-white select-none">
                          {section.title} // ARYAN KUMAR
                        </div>
                        {section.lines.map((line, lineIdx) => (
                          <div
                            key={lineIdx}
                            className="text-[7px] sm:text-[9px] font-medium text-white/70 tracking-wide select-none"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ============ DETAIL PANEL: slides in like a page ============
          Desktop: from the right, beside the card. Mobile: from the bottom,
          under the card. Scrollable when content overflows. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border-white/10 cursor-default
          bottom-0 left-0 right-0 h-[58%] border-t rounded-t-2xl
          lg:top-0 lg:bottom-0 lg:left-auto lg:right-0 lg:h-full lg:w-[46%] lg:border-t-0 lg:border-l lg:rounded-none
          transition-transform duration-700
          ${open ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div key={focusedIndex ?? 'closed'} className="h-full overflow-y-auto px-7 sm:px-10 py-8 lg:py-14">
          {/* Panel header */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="font-mono-jb text-[10px] tracking-[0.3em] text-amber-300/80 uppercase">
              {panelSection.id} / 0{SECTIONS.length}
            </div>
            <div className="font-helv text-[26px] sm:text-[34px] font-bold tracking-tight text-white uppercase mt-1">
              {panelSection.title}
            </div>
            <div className="font-mono-jb text-[11px] text-white/50 tracking-[0.18em] mt-1">
              {panelSection.subtitle}
            </div>
            <div className="h-px bg-white/10 mt-5" />
          </div>

          {/* Detail blocks, staggered fade-up like a page loading */}
          <div className="mt-6 flex flex-col gap-6">
            {panelSection.detail.map((block, bi) => (
              <div key={bi} className="animate-fade-up" style={{ animationDelay: `${0.3 + bi * 0.12}s` }}>
                {block.heading && (
                  <div className="font-mono-jb text-[11px] sm:text-[12px] font-bold tracking-[0.16em] text-amber-200/90">
                    {block.heading}
                  </div>
                )}
                {block.lines.map((line, li) => (
                  <p key={li} className="font-mono-jb text-[12px] sm:text-[13px] leading-relaxed text-white/75 mt-2">
                    {line}
                  </p>
                ))}
                {block.link && (
                  <a
                    href={block.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-mono-jb text-[12px] sm:text-[13px] mt-2 text-amber-300 underline underline-offset-2 hover:text-amber-200"
                  >
                    {block.link.label} ↗
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={() => setFocus(null)}
            className="mt-10 font-mono-jb text-[10px] tracking-[0.24em] text-white/50 hover:text-white transition-colors uppercase border border-white/15 hover:border-white/40 rounded-md px-3 py-1.5 cursor-pointer"
          >
            ← close
          </button>
        </div>
      </div>

      {/* Exit back to the hero */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExit();
        }}
        className="absolute top-5 left-5 z-50 font-mono-jb text-[10px] tracking-[0.24em] text-white/50 hover:text-white transition-colors uppercase border border-white/15 hover:border-white/40 rounded-md px-3 py-1.5 bg-black/40 backdrop-blur-sm cursor-pointer"
      >
        ← esc / back to network
      </button>

      {/* Hint */}
      <div className="absolute bottom-6 inset-x-0 text-center font-mono-jb text-[10px] tracking-[0.3em] text-white/25 uppercase pointer-events-none z-30">
        {open ? '' : 'scroll to browse · click to open a card'}
      </div>
    </div>
  );
}
