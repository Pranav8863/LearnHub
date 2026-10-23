const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const env = require('../config/env');
const connectDB = require('../config/db');

// Models
const Course = require('../models/Course');
const Section = require('../models/Section');
const Lesson = require('../models/Lesson');

const sectionDataEnrichment = [
  // MERN Stack Course
  {
    courseSlug: 'mastering-full-stack-mern-architecture',
    sections: [
      {
        order: 1,
        notes: `### MERN Architecture & Backend Security Cheat-Sheet
1. **Client-Server Contract**:
   - Keep client (Vite/React) and server (Express/Node) decoupled in separate workspaces.
   - Always return consistent JSON payloads with \`{ success: boolean, message: string, data?: any }\`.

2. **Security Headers & Middleware**:
   - Use \`helmet()\` with \`crossOriginResourcePolicy: { policy: 'cross-origin' }\` for embedded media.
   - Enable CORS with \`credentials: true\` and restrict \`allowedOrigins\` to trusted domains.
   - Set rate limiters on sensitive auth endpoints (\`/api/auth/login\`, \`/api/auth/register\`).

3. **Authentication Strategy**:
   - Issue JWTs signed with HMAC-SHA256 (\`HS256\`) using secure, high-entropy secrets.
   - Set tokens in HTTP-only, SameSite cookies to mitigate Cross-Site Scripting (XSS) token exfiltration.`,
        practiceQuestions: [
          {
            question: 'Why should sensitive authentication tokens be stored in HTTP-only cookies instead of localStorage?',
            options: [
              'HTTP-only cookies cannot be accessed by client-side JavaScript, protecting against XSS attacks',
              'HTTP-only cookies make HTTP requests 10x faster',
              'localStorage is deprecated in modern web browsers',
              'Cookies have unlimited storage capacity compared to localStorage',
            ],
            correctOption: 0,
            explanation: 'HTTP-only cookies prevent malicious injected JavaScript (XSS) from accessing session tokens.',
            hint: 'Think about client-side script execution and XSS vulnerability vectors.',
          },
          {
            question: 'What is the purpose of Mongoose schema compound indexes?',
            options: [
              'To format JSON API responses automatically',
              'To optimize queries that filter or sort by multiple fields simultaneously, avoiding collection scans',
              'To encrypt document passwords automatically',
              'To enforce client-side Tailwind CSS styling',
            ],
            correctOption: 1,
            explanation: 'Compound indexes index multiple fields together in B-trees for sub-millisecond multi-attribute lookups.',
            hint: 'Think about query execution plans and index prefixes.',
          },
        ],
      },
      {
        order: 2,
        notes: `### React 18 & Frontend Engineering Notes
1. **Component Design Tokens**:
   - Establish consistent surfaces: \`bg-white\`, \`bg-slate-50\`, \`border-slate-200/80\`.
   - Brand palette: Indigo / Violet primary accents (\`brand-600\`, \`brand-700\`).

2. **Vite Build Optimization**:
   - Leverage dynamic imports (\`React.lazy\`) for heavy routes to split bundles into chunks under 500 kB.
   - Analyze bundle dependencies with \`rollupOptions.output.manualChunks\`.

3. **Global State Architecture**:
   - Use React Context for authentication hydration and toast notifications.
   - Keep page-level and form state local to avoid unnecessary re-renders.`,
        practiceQuestions: [
          {
            question: 'What is the primary performance benefit of Vite over legacy Webpack in development?',
            options: [
              'Vite uses native ES modules (ESM) over HTTP to serve source code without full initial bundling',
              'Vite converts all JavaScript to WebAssembly during development',
              'Vite eliminates all CSS stylesheets from the DOM',
              'Vite connects directly to MongoDB without a Node backend',
            ],
            correctOption: 0,
            explanation: 'Vite leverages browser-native ESM, only transpiling requested files on-demand during dev.',
            hint: 'Consider how Vite avoids bundling the entire application on server start.',
          },
        ],
      },
    ],
  },
  // Next.js 14 Course
  {
    courseSlug: 'fullstack-nextjs-14-supabase-mastery',
    sections: [
      {
        order: 1,
        notes: `### Next.js 14 App Router & Server Components Study Guide
1. **Server vs. Client Components**:
   - All components in the \`app/\` directory are React Server Components (RSC) by default.
   - Use the \`'use client'\` directive only when components require browser APIs, \`useState\`, \`useEffect\`, or DOM events.

2. **Streaming SSR**:
   - Wrap slow asynchronous data fetches in \`<Suspense fallback={<Skeleton />}>\`.
   - Streaming sends partial HTML to the browser immediately, preventing TTFB bottlenecks.`,
        practiceQuestions: [
          {
            question: 'Where do React Server Components (RSC) execute in Next.js 14?',
            options: [
              'Exclusively on the server during build time or request time, shipping zero client-side bundle weight',
              'In the browser main thread after page hydration',
              'Inside client Web Workers',
              'Only inside offline service workers',
            ],
            correctOption: 0,
            explanation: 'Server Components run on the server and stream serialized UI instructions, reducing bundle size.',
            hint: 'Think about server execution and zero-bundle-size impact.',
          },
        ],
      },
      {
        order: 2,
        notes: `### Supabase & PostgreSQL Security Architecture
1. **Row Level Security (RLS)**:
   - Always run \`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;\`.
   - Define policies matching \`auth.uid() = user_id\` so users can only read/write their own records.

2. **Server Actions**:
   - Define async functions with \`'use server'\`.
   - Validate input payloads with Zod schemas before executing database mutations.`,
        practiceQuestions: [
          {
            question: 'What is the primary role of Supabase Row Level Security (RLS)?',
            options: [
              'To enforce authorization rules on each individual row at the PostgreSQL database engine level',
              'To automate SSL certificate renewals on the load balancer',
              'To generate frontend React components automatically',
              'To compress JSON responses before sending to the client',
            ],
            correctOption: 0,
            explanation: 'RLS policies evaluate user JWT claims directly inside Postgres for every query.',
            hint: 'It checks access per row inside the database engine.',
          },
        ],
      },
    ],
  },
  // Python FastAPI Course
  {
    courseSlug: 'python-fastapi-async-microservices',
    sections: [
      {
        order: 1,
        notes: `### Async Python & FastAPI Architecture Notes
1. **AsyncIO Event Loop**:
   - Use \`async def\` for non-blocking I/O operations (database queries, HTTP calls, file reads).
   - Use synchronous \`def\` for CPU-bound tasks so Uvicorn runs them in external thread pools.

2. **Pydantic v2 Models**:
   - Define strict input/output DTOs with type annotations and validation constraints.
   - Automatic conversion between snake_case database records and camelCase JSON APIs.`,
        practiceQuestions: [
          {
            question: 'How does FastAPI achieve high concurrency on I/O-bound operations?',
            options: [
              'By running non-blocking coroutines on Python\'s single-threaded AsyncIO event loop',
              'By compiling Python code into Java bytecode',
              'By spinning up 1,000 separate operating system processes',
              'By disabling all database connection timeouts',
            ],
            correctOption: 0,
            explanation: 'FastAPI uses non-blocking asynchronous event loops to handle thousands of concurrent requests.',
            hint: 'Think about asyncio and coroutines.',
          },
        ],
      },
    ],
  },
  // Generative AI Course
  {
    courseSlug: 'generative-ai-autonomous-agents-langchain',
    sections: [
      {
        order: 1,
        notes: `### Vector Retrieval & RAG Pipeline Architecture
1. **Vector Embeddings**:
   - Embeddings convert unstructured text into dense numerical vectors in multi-dimensional space (e.g. 1536-D).
   - Semantic similarity is computed using cosine similarity (\`cos(theta) = A . B / (|A||B|)\`).

2. **Retrieval-Augmented Generation (RAG)**:
   - Ingest documents -> Chunk text into 500-1000 token segments with overlap.
   - Query vector index for top-k similar chunks -> Inject into LLM prompt context as trusted ground truth.`,
        practiceQuestions: [
          {
            question: 'What is the primary goal of Retrieval-Augmented Generation (RAG)?',
            options: [
              'To augment LLM prompts with relevant retrieved knowledge chunks, minimizing hallucinations',
              'To increase the physical GPU clock speed of the AI cluster',
              'To convert natural language into binary assembly code',
              'To eliminate the need for training tokenizers',
            ],
            correctOption: 0,
            explanation: 'RAG grounds language model generation in factual external documents to reduce hallucinations.',
            hint: 'It retrieves specific factual context before generation.',
          },
        ],
      },
    ],
  },
  // UI/UX Design System Course
  {
    courseSlug: 'modern-uiux-design-system-tailwind-figma',
    sections: [
      {
        order: 1,
        notes: `### Design Tokens & Tailwind CSS Architecture
1. **Design Tokens**:
   - Establish consistent typography scales: \`text-xs\`, \`text-sm\`, \`text-base\`, \`text-xl\`, \`text-3xl\`.
   - Spacing grid: 4px base units (\`gap-2 = 8px\`, \`gap-4 = 16px\`, \`gap-6 = 24px\`).

2. **Component Contrast & Accessibility (a11y)**:
   - Ensure WCAG AA contrast ratio (at least 4.5:1 for normal text).
   - Always pair icons with descriptive labels or \`aria-label\` attributes.`,
        practiceQuestions: [
          {
            question: 'What is the minimum WCAG AA contrast ratio requirement for normal body text against its background?',
            options: [
              '4.5:1',
              '1.5:1',
              '10:1',
              '2:1',
            ],
            correctOption: 0,
            explanation: 'WCAG AA requires a 4.5:1 contrast ratio for standard text to ensure readability for visually impaired users.',
            hint: 'Think about standard web accessibility guidelines.',
          },
        ],
      },
    ],
  },
  // Cloud DevOps Course
  {
    courseSlug: 'cloud-devops-docker-kubernetes-aws',
    sections: [
      {
        order: 1,
        notes: `### Docker & Kubernetes Production Cheat-Sheet
1. **Multi-Stage Dockerfile Optimization**:
   - \`FROM node:20-alpine AS builder\` for dependency installation and Vite compilation.
   - \`FROM node:20-alpine AS runner\` copying only \`dist/\` and production \`node_modules/\`.
   - Run containers as non-root user (\`USER node\`) to prevent container breakout exploits.

2. **Kubernetes Core Primitives**:
   - **Pod**: Smallest deployable unit containing one or more tightly coupled containers.
   - **Service**: Stable virtual IP and DNS name that load-balances traffic across matching Pods.
   - **Ingress**: Reverse proxy handling TLS termination, SSL certificates, and path routing.`,
        practiceQuestions: [
          {
            question: 'What is the primary security advantage of running a Docker container as a non-root user?',
            options: [
              'It restricts access to the host kernel and filesystem in the event of an application vulnerability or breakout',
              'It makes the container run twice as fast',
              'It bypasses Linux network firewall rules',
              'It reduces Docker image download size by 90%',
            ],
            correctOption: 0,
            explanation: 'Non-root users prevent attackers who compromise the application from gaining root privileges on the host system.',
            hint: 'Consider principle of least privilege.',
          },
        ],
      },
    ],
  },
];

const runPopulate = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB Atlas. Enriching sections and lessons with notes & practice questions...');

    // 1. Enrich specific curated courses
    for (const data of sectionDataEnrichment) {
      const course = await Course.findOne({ slug: data.courseSlug });
      if (!course) continue;

      for (const secData of data.sections) {
        const section = await Section.findOne({ course: course._id, order: secData.order });
        if (section) {
          section.notes = secData.notes;
          section.practiceQuestions = secData.practiceQuestions;
          await section.save();
          console.log(`✓ Updated chapter notes & ${secData.practiceQuestions.length} practice Q's for "${course.title}" (Section ${secData.order})`);
        }
      }
    }

    // 2. Add realistic default notes & practice questions for ALL other sections in the DB
    const allSections = await Section.find();
    for (const section of allSections) {
      if (!section.notes || section.notes.trim() === '') {
        section.notes = `### ${section.title} - Chapter Notes
- **Core Principles**: Review the architectural concepts and implementation patterns demonstrated in the video walkthrough.
- **Key Takeaway**: Follow along with the code samples, run the provided terminal commands, and complete the chapter practice self-check below.
- **Best Practice**: Validate all inputs, handle error edge cases gracefully, and write testable code units.`;
      }

      if (!section.practiceQuestions || section.practiceQuestions.length === 0) {
        section.practiceQuestions = [
          {
            question: `In "${section.title}", what is the primary architectural recommendation for production stability?`,
            options: [
              'Write decoupled modular components, validate input parameters, and implement robust error boundaries',
              'Store all credentials and private keys in public client-side JavaScript',
              'Disable all automated tests and error logging in production',
              'Execute all database operations directly in the browser DOM',
            ],
            correctOption: 0,
            explanation: 'Decoupling, rigorous input validation, and centralized error handling are fundamental to production engineering.',
            hint: 'Think about enterprise software reliability and security practices.',
          },
          {
            question: 'Why is automated integration testing essential before releasing new course features?',
            options: [
              'It verifies that end-to-end user workflows function correctly across database and API boundaries',
              'It replaces the need for any backend server or database',
              'It automatically generates product marketing videos',
              'It makes JavaScript execute without a Node runtime',
            ],
            correctOption: 0,
            explanation: 'Integration tests catch regressions across interconnected services and database operations.',
            hint: 'Consider regressions and end-to-end user journeys.',
          },
        ];
      }

      await section.save();
    }
    console.log(`✓ Verified and enriched all ${allSections.length} sections in the database.`);

    // 3. Add downloadable resources to lessons
    const allLessons = await Lesson.find();
    for (const lesson of allLessons) {
      if (!lesson.resources || lesson.resources.length === 0) {
        lesson.resources = [
          {
            title: `${lesson.title} - Starter Project & Code Samples`,
            url: 'https://github.com/learnhub-lms/course-materials',
          },
          {
            title: 'Official Documentation & API Specification Cheat-Sheet',
            url: 'https://developer.mozilla.org/en-US/docs/Web',
          },
        ];
        lesson.notes = `### ${lesson.title} Study Guide
1. Follow along with the video timestamp markers.
2. Clone the starter repository linked in the resources tab.
3. Test each command locally in your terminal before moving forward.`;
        await lesson.save();
      }
    }
    console.log(`✓ Verified and enriched downloadable resources on all ${allLessons.length} lessons.`);

    console.log('🎉 All courses, sections, notes, and practice questions populated successfully in Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('Error populating notes and questions:', err);
    process.exit(1);
  }
};

runPopulate();
