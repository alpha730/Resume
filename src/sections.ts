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
  lines: string[]; // short teaser on the card back
  detail: DetailBlock[]; // full resume content shown in the detail panel
}

// ARYAN KUMAR — resume content
export const SECTIONS: Section[] = [
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
