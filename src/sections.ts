// Resume content, shared by the space field and its detail panel.

export interface DetailBlock {
  heading?: string;
  lines: string[];
  link?: { label: string; href: string };
}

export interface Section {
  id: string;
  title: string;
  subtitle: string;
  lines: string[]; // short teaser shown under the body
  detail: DetailBlock[]; // full resume content shown in the detail panel
}

// ARYAN KUMAR — resume content
export const SECTIONS: Section[] = [
  {
    id: '01',
    title: 'ABOUT',
    subtitle: 'ARYAN KUMAR',
    lines: ['B.Tech AI & DS · CGPA 8.3', 'Agentic AI · RAG · geospatial', 'JECRC Foundation, Jaipur'],
    detail: [
      {
        heading: 'ARYAN KUMAR',
        lines: [
          'B.Tech student in Artificial Intelligence & Data Science at JECRC Foundation, Jaipur.',
          'Builds agentic AI systems: retrieval-augmented generation, LLM-driven structured extraction, and computer vision over satellite imagery.',
          'Works across Python and TypeScript, from PyTorch models to Next.js front ends.',
        ],
      },
      {
        heading: 'SPOKEN LANGUAGES',
        lines: ['English — Professional', 'Hindi — Native'],
      },
    ],
  },
  {
    id: '02',
    title: 'EDUCATION',
    subtitle: 'WHERE I STUDIED',
    lines: ['B.Tech — AI & Data Science', 'CGPA 8.3/10 · 2025–2029', "ISC — St. Xavier's · 2024"],
    detail: [
      {
        heading: 'B.TECH — ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
        lines: [
          'Jaipur Engineering College and Research Centre Foundation, Jaipur, India',
          'CGPA: 8.3/10',
          '2025 – 2029 (expected)',
        ],
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
    lines: ['Python · Java · PyTorch', 'LangGraph · LangChain · CrewAI', 'Rasterio/GDAL · React · Next.js'],
    detail: [
      { heading: 'LANGUAGES', lines: ['Python, Java'] },
      { heading: 'ML / DL', lines: ['PyTorch, scikit-learn'] },
      {
        heading: 'LLMS & AGENTS',
        lines: ['LangGraph, LangChain, CrewAI, RAG, vector databases'],
      },
      {
        heading: 'GEOSPATIAL',
        lines: ['Rasterio/GDAL, GeoPandas, Sentinel-1/2 data, STAC'],
      },
      { heading: 'WEB', lines: ['React, Node.js, Next.js, TypeScript'] },
      { heading: 'TOOLS', lines: ['Git, Supabase, Vercel, Render, n8n'] },
    ],
  },
  {
    id: '04',
    title: 'PROJECTS',
    subtitle: 'WHAT I BUILT',
    lines: ['Remote Sensing Analysis Platform', 'AI Voice Agent for Health Workers', 'Agentic AI · RAG · VQA'],
    detail: [
      {
        heading: 'AI-POWERED REMOTE SENSING ANALYSIS PLATFORM',
        lines: [
          'Built an agentic system for Earth-observation tasks on multi-modal satellite imagery (SAR and multispectral), including visual question answering (VQA).',
          'Combined RAG, LLMs, PyTorch computer-vision models and geospatial processing (Rasterio/GDAL, GeoPandas).',
          'Tech stack: Python, PyTorch, LangChain, Rasterio/GDAL',
        ],
      },
      {
        heading: 'AI VOICE AGENT FOR COMMUNITY HEALTH WORKERS',
        lines: [
          'Built a multilingual voice agent that lets frontline health workers log home visits by speaking in Hindi or English, turning free-form speech into structured medical records in real time.',
          'Used AssemblyAI streaming speech-to-text and LLM-based structured extraction, with a conversational follow-up loop that asks for missing fields; records stored in Supabase (PostgreSQL).',
          'Tech stack: Next.js, TypeScript, AssemblyAI, Supabase',
        ],
      },
    ],
  },
  {
    id: '05',
    title: 'CERTIFICATIONS',
    subtitle: 'WHAT I EARNED',
    lines: ['IBM RAG and Agentic AI', 'Professional Certificate', 'Coursera'],
    detail: [
      {
        heading: 'IBM RAG AND AGENTIC AI PROFESSIONAL CERTIFICATE',
        lines: ['Coursera'],
      },
    ],
  },
  {
    id: '06',
    title: 'EXPERIENCE',
    subtitle: 'WHERE I WORKED',
    lines: ['AI Engineer — Qualfocus', 'Apr 2026 – Jun 2026', 'Aashayien — social media team'],
    detail: [
      {
        heading: 'QUALFOCUS — AI ENGINEER',
        lines: [
          'Apr 2026 – Jun 2026',
          'Worked on an interior-design visualization app that brings real-world spaces into a virtual environment.',
        ],
      },
      {
        heading: 'AASHAYIEN (JECRC CLUB) — SOCIAL MEDIA TEAM',
        lines: ['Oct 2025 – Aug 2026', 'Content writing and planning.'],
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
