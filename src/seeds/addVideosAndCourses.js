const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Quiz = require('../models/Quiz');

const runEnhancement = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Starting enhancement...');

    // 1. Clean up leftover dummy test courses with no lessons
    const dummyCourses = await Course.find({
      title: { $regex: /Testing Instructor Course/i },
    });
    console.log(`Found ${dummyCourses.length} dummy test courses to remove.`);
    for (const d of dummyCourses) {
      await Lesson.deleteMany({ course: d._id });
      await Section.deleteMany({ course: d._id });
      await Enrollment.deleteMany({ course: d._id });
      await LessonProgress.deleteMany({ course: d._id });
      await Quiz.deleteMany({ course: d._id });
      await Course.findByIdAndDelete(d._id);
    }
    console.log('Cleaned up dummy courses.');

    // 2. Instructors & Categories
    const instructorSarah = await User.findOne({ email: 'sarah@learnhub.com' });
    const instructorAlex = await User.findOne({ email: 'alex@learnhub.com' });
    const categories = await Category.find();
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.slug] = c._id;
    });

    // 3. Update existing courses with missing/extra lessons & working videos
    const existingEnhancements = [
      {
        slug: 'cloud-devops-docker-kubernetes-aws',
        extraLessons: [
          {
            title: 'Docker Compose for Multi-Container Services',
            duration: 16,
            videoUrl: 'https://www.youtube.com/watch?v=HG6yLv3ZVuA',
            description: 'Define service networks, persistent volumes, and environment variables across multiple connected containers.',
          },
          {
            title: 'Kubernetes Cluster Architecture & Pod Orchestration',
            duration: 22,
            videoUrl: 'https://www.youtube.com/watch?v=X48VuDVv0do',
            description: 'Understand worker nodes, control planes, deployments, replicasets, and service discovery in Kubernetes.',
          },
        ],
      },
      {
        slug: 'cyber-security-essentials-ethical-hacking',
        extraLessons: [
          {
            title: 'Cross-Site Scripting (XSS) & CSRF Mitigation',
            duration: 18,
            videoUrl: 'https://www.youtube.com/watch?v=EoaDgZ22BC4',
            description: 'Deep dive into stored, reflected, and DOM-based XSS attacks and modern token-based CSRF defenses.',
          },
          {
            title: 'Network Reconnaissance with Nmap & Wireshark',
            duration: 25,
            videoUrl: 'https://www.youtube.com/watch?v=4bvd0A_r6gI',
            description: 'Scan open ports, analyze network traffic packets, and identify security misconfigurations safely.',
          },
        ],
      },
      {
        slug: 'react-native-mobile-app-engineering',
        extraLessons: [
          {
            title: 'React Navigation v6 Stacks and Tabs',
            duration: 18,
            videoUrl: 'https://www.youtube.com/watch?v=gTZZL6zF3fU',
            description: 'Structure native mobile screens with nested navigation stacks, bottom tabs, and modal transitions.',
          },
          {
            title: 'AsyncStorage & Offline State Persistence',
            duration: 15,
            videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
            description: 'Store authentication credentials and user cache locally on device storage.',
          },
        ],
      },
      {
        slug: 'data-science-machine-learning-python',
        extraLessons: [
          {
            title: 'Data Visualization with Matplotlib & Seaborn',
            duration: 19,
            videoUrl: 'https://www.youtube.com/watch?v=GPVsHOlRBBI',
            description: 'Create interactive correlation heatmaps, distribution plots, and multi-dimensional visual analyses.',
          },
          {
            title: 'Supervised Learning with Scikit-Learn Classifiers',
            duration: 24,
            videoUrl: 'https://www.youtube.com/watch?v=0Lt9w-BxKFQ',
            description: 'Train decision trees, logistic regression models, and evaluate precision, recall, and ROC-AUC curves.',
          },
        ],
      },
      {
        slug: 'typescript-in-practice-for-web-developers',
        extraLessons: [
          {
            title: 'Generics, Utility Types and Conditional Types',
            duration: 20,
            videoUrl: 'https://www.youtube.com/watch?v=V9XvyomFF2A',
            description: 'Leverage Record, Partial, Pick, Omit, and conditional infer types for complex enterprise libraries.',
          },
          {
            title: 'Strictly Typing React Components, Hooks & Context',
            duration: 17,
            videoUrl: 'https://www.youtube.com/watch?v=ydkQlJhodYw',
            description: 'Type polymorphism in components, generic hook return signatures, and synthetic event handlers.',
          },
        ],
      },
      {
        slug: 'database-architecture-sql-nosql',
        extraLessons: [
          {
            title: 'Compound Indexes & Query Execution Optimization',
            duration: 19,
            videoUrl: 'https://www.youtube.com/watch?v=W-LzH6q6Y0A',
            description: 'Utilize index prefixing, sort ordering, and collation to achieve sub-millisecond query execution.',
          },
          {
            title: 'Transactions & ACID Guarantees in Distributed Databases',
            duration: 21,
            videoUrl: 'https://www.youtube.com/watch?v=3qZ0A2iG-8A',
            description: 'Execute multi-document ACID transactions with session aborting and rollback mechanisms.',
          },
        ],
      },
      {
        slug: 'microservices-with-nodejs-rabbitmq',
        extraLessons: [
          {
            title: 'Event-Driven Asynchronous Messaging Workflows',
            duration: 22,
            videoUrl: 'https://www.youtube.com/watch?v=wh41P_V7T6Q',
            description: 'Handle dead-letter queues, message acknowledgments, and retry mechanisms for fault-tolerant workers.',
          },
          {
            title: 'API Gateway & Distributed Request Tracing',
            duration: 18,
            videoUrl: 'https://www.youtube.com/watch?v=vJNT9OQxK54',
            description: 'Aggregate backend microservices behind a unified gateway with correlation IDs and JWT verification.',
          },
        ],
      },
      {
        slug: 'quantum-computing-fundamentals',
        isPublished: true,
        updateFirstLesson: {
          videoUrl: 'https://www.youtube.com/watch?v=JhHMJCUmq28',
        },
        extraLessons: [
          {
            title: 'Quantum Gates & Circuit Simulation with Qiskit',
            duration: 20,
            videoUrl: 'https://www.youtube.com/watch?v=a1AcNP4p-Z0',
            description: 'Apply Hadamard, Pauli-X, and CNOT entanglement gates to simulate quantum superposition circuits.',
          },
        ],
      },
      {
        slug: 'rust-for-high-performance-systems',
        isPublished: true,
        updateFirstLesson: {
          videoUrl: 'https://www.youtube.com/watch?v=BpPEoQ4jzcI',
        },
        extraLessons: [
          {
            title: 'Memory Safety, Borrow Checker & Lifetimes',
            duration: 23,
            videoUrl: 'https://www.youtube.com/watch?v=usJDUSrcwqI',
            description: 'Master Rust ownership rules, immutable vs mutable borrowing, and explicit lifetime annotations.',
          },
        ],
      },
    ];

    for (const enh of existingEnhancements) {
      const course = await Course.findOne({ slug: enh.slug });
      if (!course) continue;

      if (enh.isPublished !== undefined) {
        course.isPublished = enh.isPublished;
        await course.save();
      }

      // Find first section
      let section = await Section.findOne({ course: course._id }).sort({ order: 1 });
      if (!section) {
        section = await Section.create({
          course: course._id,
          title: 'Module 1: Core Curriculum',
          order: 1,
        });
      }

      if (enh.updateFirstLesson) {
        const firstLesson = await Lesson.findOne({ course: course._id }).sort({ order: 1 });
        if (firstLesson) {
          firstLesson.videoUrl = enh.updateFirstLesson.videoUrl;
          await firstLesson.save();
        }
      }

      const currentLessonCount = await Lesson.countDocuments({ course: course._id });
      let nextOrder = currentLessonCount + 1;

      for (const extra of enh.extraLessons || []) {
        const exists = await Lesson.findOne({ course: course._id, title: extra.title });
        if (!exists) {
          await Lesson.create({
            course: course._id,
            section: section._id,
            title: extra.title,
            duration: extra.duration,
            videoUrl: extra.videoUrl,
            description: extra.description,
            order: nextOrder++,
            isFreePreview: false,
          });
          console.log(`Added lesson "${extra.title}" to ${course.title}`);
        }
      }

      // Recalculate duration & lesson count
      const allLessons = await Lesson.find({ course: course._id });
      course.totalLessons = allLessons.length;
      course.totalDuration = allLessons.reduce((acc, l) => acc + (l.duration || 5), 0);
      await course.save();
    }

    // 4. Add brand new, high-demand courses with rich curriculum & videos
    const newCoursesDef = [
      {
        title: 'Full-Stack Next.js 14 & Supabase Mastery',
        slug: 'fullstack-nextjs-14-supabase-mastery',
        subtitle: 'Build production web apps with Next.js 14 App Router, Server Actions & Supabase Postgres.',
        description: 'Master modern full-stack development with React Server Components, Streaming SSR, Supabase Row-Level Security (RLS), real-time database subscriptions, and automated deployments with Vercel.',
        categorySlug: 'web-development',
        instructorId: instructorSarah._id,
        difficulty: 'intermediate',
        price: 0,
        featured: true,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1618788372246-79faff0c3742?w=800&auto=format&fit=crop&q=60',
        prerequisites: ['Proficiency in React', 'Basic SQL and JavaScript ES6+'],
        learningOutcomes: [
          'Build scalable applications using Next.js 14 App Router and Server Actions',
          'Implement secure user authentication with Supabase and HTTP cookies',
          'Architect PostgreSQL relational schemas with Row Level Security (RLS)',
          'Deploy optimized edge-ready applications with zero configuration',
        ],
        sections: [
          {
            title: 'Module 1: Next.js 14 App Router Architecture',
            lessons: [
              {
                title: 'Next.js 14 App Router, Layouts & Route Groups',
                duration: 15,
                videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
                description: 'Understand root layouts, nested routes, template rendering, and route organization patterns.',
                isFreePreview: true,
              },
              {
                title: 'React Server Components & Streaming SSR with Suspense',
                duration: 18,
                videoUrl: 'https://www.youtube.com/watch?v=dPx1228_EYA',
                description: 'Leverage server components for data colocation and instant initial page loads with streaming suspense boundaries.',
                isFreePreview: true,
              },
            ],
          },
          {
            title: 'Module 2: Supabase Backend & Database Mutations',
            lessons: [
              {
                title: 'Supabase Auth & Row Level Security (RLS) Policies',
                duration: 22,
                videoUrl: 'https://www.youtube.com/watch?v=7uKQBl9uZW0',
                description: 'Secure PostgreSQL tables directly with fine-grained role and user authentication policies.',
                isFreePreview: false,
              },
              {
                title: 'Server Actions, Zod Form Validation & Optimistic UI',
                duration: 20,
                videoUrl: 'https://www.youtube.com/watch?v=2HBIzEx6IZA',
                description: 'Execute server mutations without API boilerplate and update UI optimistically for seamless UX.',
                isFreePreview: false,
              },
            ],
          },
        ],
        quiz: {
          title: 'Next.js 14 & Supabase Certification Quiz',
          passingScore: 70,
          questions: [
            {
              questionText: 'What is the primary benefit of React Server Components (RSC) in Next.js 14?',
              options: [
                'They keep large dependency bundles on the server, drastically reducing client JavaScript payload',
                'They run only inside Web Workers',
                'They eliminate the need for any CSS styling',
                'They convert JavaScript into WebAssembly automatically',
              ],
              correctOptionIndex: 0,
              explanation: 'Server Components execute on the server and send serialized HTML/UI to the client with zero bundle overhead for dependencies.',
            },
            {
              questionText: 'What does Supabase Row Level Security (RLS) protect against?',
              options: [
                'Direct unauthorized SQL queries by checking permissions on every single database row accessed',
                'DDoS attacks at the network firewall layer',
                'CSS layout shift bugs',
                'Memory leaks in the Node runtime',
              ],
              correctOptionIndex: 0,
              explanation: 'RLS policies evaluate each database query against user session tokens at the database engine level.',
            },
          ],
        },
      },
      {
        title: 'Modern UI/UX Design System with Tailwind CSS & Figma',
        slug: 'modern-uiux-design-system-tailwind-figma',
        subtitle: 'From Figma design tokens to scalable, accessible React component libraries.',
        description: 'Bridge the gap between design and engineering. Learn color scales, typography hierarchies, micro-interactions with Framer Motion, and building fully accessible design systems with Tailwind CSS.',
        categorySlug: 'web-development',
        instructorId: instructorSarah._id,
        difficulty: 'beginner',
        price: 0,
        featured: true,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
        prerequisites: ['Basic HTML, CSS, and React knowledge'],
        learningOutcomes: [
          'Extract design tokens from Figma and translate them into Tailwind CSS configs',
          'Build accessible dialogs, popovers, and navigation menus with ARIA attributes',
          'Create high-performance fluid animations with Framer Motion',
        ],
        sections: [
          {
            title: 'Module 1: Design Tokens & Component Architecture',
            lessons: [
              {
                title: 'Color Palettes, Typography Scales & Spacing Systems',
                duration: 14,
                videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
                description: 'Establish a cohesive visual language with modular scale factors and Tailwind custom properties.',
                isFreePreview: true,
              },
              {
                title: 'Translating Figma Auto Layout into Tailwind Flexbox & Grid',
                duration: 16,
                videoUrl: 'https://www.youtube.com/watch?v=lC4Z_H_Z74w',
                description: 'Map Figma constraints and auto layout hierarchies into bulletproof responsive CSS classes.',
                isFreePreview: true,
              },
            ],
          },
          {
            title: 'Module 2: Motion & Accessibility',
            lessons: [
              {
                title: 'Micro-Interactions & Fluid Gestures with Framer Motion',
                duration: 18,
                videoUrl: 'https://www.youtube.com/watch?v=znbCa4RrQQg',
                description: 'Animate page transitions, collapsible accordions, and interactive feedback states smoothly.',
                isFreePreview: false,
              },
            ],
          },
        ],
      },
      {
        title: 'Python FastAPI & Async Microservices Architecture',
        slug: 'python-fastapi-async-microservices',
        subtitle: 'Build blazing-fast asynchronous APIs with Python 3.12, Pydantic v2 & SQLAlchemy 2.0.',
        description: 'Step into enterprise Python engineering. Master Python AsyncIO, high-throughput REST APIs with FastAPI, automatic OpenAPI schema generation, PostgreSQL connection pooling, and Docker container deployment.',
        categorySlug: 'data-science',
        instructorId: instructorAlex._id,
        difficulty: 'intermediate',
        price: 0,
        featured: true,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
        prerequisites: ['Basic Python programming experience'],
        learningOutcomes: [
          'Develop high-concurrency asynchronous endpoints with FastAPI and Uvicorn',
          'Validate complex data schemas with Pydantic v2',
          'Interact with PostgreSQL using SQLAlchemy 2.0 async sessions and Alembic',
          'Package microservices into production Docker containers',
        ],
        sections: [
          {
            title: 'Module 1: Async Python & FastAPI API Design',
            lessons: [
              {
                title: 'AsyncIO Event Loop & FastAPI Routing Patterns',
                duration: 15,
                videoUrl: 'https://www.youtube.com/watch?v=gQTRsZpqzAw',
                description: 'Understand non-blocking coroutines, async/await syntax, and high-concurrency request handling.',
                isFreePreview: true,
              },
              {
                title: 'Pydantic v2 Schemas, Dependency Injection & OpenAPI',
                duration: 17,
                videoUrl: 'https://www.youtube.com/watch?v=0sOvCWFmrtA',
                description: 'Utilize automatic type coercion, input sanitization, and reusable dependency injection pipelines.',
                isFreePreview: true,
              },
            ],
          },
          {
            title: 'Module 2: Database Persistence & Docker',
            lessons: [
              {
                title: 'PostgreSQL with SQLAlchemy 2.0 Async ORM',
                duration: 20,
                videoUrl: 'https://www.youtube.com/watch?v=ba34pxreZ_k',
                description: 'Manage database connection pools, async transactions, and schema migrations with Alembic.',
                isFreePreview: false,
              },
              {
                title: 'Dockerizing FastAPI for High-Throughput Production',
                duration: 16,
                videoUrl: 'https://www.youtube.com/watch?v=kCgGjBgge7M',
                description: 'Configure multi-worker Uvicorn processes and build lightweight Alpine Docker containers.',
                isFreePreview: false,
              },
            ],
          },
        ],
      },
      {
        title: 'Generative AI & Autonomous Agents with LangChain',
        slug: 'generative-ai-autonomous-agents-langchain',
        subtitle: 'Build production-ready AI agents, function calling, and vector retrieval systems.',
        description: 'Comprehensive course on building enterprise LLM applications. Learn prompt engineering, tool calling, ReAct autonomous agent loops, retrieval-augmented generation (RAG), and evaluation frameworks.',
        categorySlug: 'artificial-intelligence',
        instructorId: instructorAlex._id,
        difficulty: 'advanced',
        price: 0,
        featured: true,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60',
        prerequisites: ['Python basics and REST API fundamentals'],
        learningOutcomes: [
          'Design autonomous AI agents with ReAct planning and tool execution',
          'Implement semantic retrieval pipelines with ChromaDB and vector embeddings',
          'Deploy resilient AI agents with guardrails and response validation',
        ],
        sections: [
          {
            title: 'Module 1: LLM Orchestration & Prompt Chains',
            lessons: [
              {
                title: 'Prompt Engineering & Structured Outputs with LangChain',
                duration: 18,
                videoUrl: 'https://www.youtube.com/watch?v=aywZrzNaKjs',
                description: 'Guide large language models to return strictly typed JSON schema responses reliably.',
                isFreePreview: true,
              },
              {
                title: 'Vector Embeddings & Hybrid Search Retrieval',
                duration: 21,
                videoUrl: 'https://www.youtube.com/watch?v=2TJxpyO3ei4',
                description: 'Combine BM25 keyword matching with dense vector semantic search for optimal RAG precision.',
                isFreePreview: true,
              },
            ],
          },
          {
            title: 'Module 2: Autonomous Agents & Tool Calling',
            lessons: [
              {
                title: 'Tool-Calling Autonomous Agents with Memory & Planning',
                duration: 24,
                videoUrl: 'https://www.youtube.com/watch?v=nAmC7SoVLd8',
                description: 'Equip agents with real-time web search, database querying, and multi-step reasoning abilities.',
                isFreePreview: false,
              },
            ],
          },
        ],
      },
      {
        title: 'Enterprise DevOps: CI/CD, Kubernetes & Terraform',
        slug: 'enterprise-devops-cicd-kubernetes-terraform',
        subtitle: 'Automate cloud infrastructure and zero-downtime deployment pipelines.',
        description: 'Master enterprise cloud operations. Write Infrastructure as Code with Terraform, configure GitHub Actions CI/CD pipelines, package Helm charts, and manage production Kubernetes clusters.',
        categorySlug: 'cloud-computing',
        instructorId: instructorAlex._id,
        difficulty: 'advanced',
        price: 0,
        featured: false,
        isPublished: true,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        prerequisites: ['Basic Linux command line knowledge'],
        learningOutcomes: [
          'Provision cloud servers and networks declaratively with Terraform',
          'Build end-to-end GitHub Actions automated pipelines with testing and linting',
          'Package and deploy Kubernetes workloads using Helm charts',
        ],
        sections: [
          {
            title: 'Module 1: Infrastructure as Code & Pipelines',
            lessons: [
              {
                title: 'GitHub Actions Automated CI/CD Testing & Deployments',
                duration: 19,
                videoUrl: 'https://www.youtube.com/watch?v=R8_veQiYBjI',
                description: 'Set up multi-stage matrix workflows that build, test, and release Docker containers automatically.',
                isFreePreview: true,
              },
              {
                title: 'Kubernetes Pods, Ingress & Helm Chart Deployment',
                duration: 22,
                videoUrl: 'https://www.youtube.com/watch?v=fy8SHvNZGeE',
                description: 'Configure Ingress controllers, TLS cert-manager, and modular Helm charts for production environments.',
                isFreePreview: true,
              },
            ],
          },
        ],
      },
    ];

    for (const cDef of newCoursesDef) {
      let course = await Course.findOne({ slug: cDef.slug });
      const catId = catMap[cDef.categorySlug] || categories[0]._id;

      if (!course) {
        course = await Course.create({
          title: cDef.title,
          slug: cDef.slug,
          subtitle: cDef.subtitle,
          description: cDef.description,
          category: catId,
          instructor: cDef.instructorId,
          difficulty: cDef.difficulty,
          price: cDef.price,
          featured: cDef.featured,
          isPublished: cDef.isPublished,
          thumbnail: cDef.thumbnail,
          prerequisites: cDef.prerequisites,
          learningOutcomes: cDef.learningOutcomes,
          totalDuration: 0,
          totalLessons: 0,
          averageRating: 4.9,
          reviewCount: 12,
          enrollmentCount: 45,
        });
        console.log(`Created new course: "${cDef.title}"`);
      }

      let totalLessons = 0;
      let totalDuration = 0;

      for (let sIdx = 0; sIdx < cDef.sections.length; sIdx++) {
        const sData = cDef.sections[sIdx];
        let section = await Section.findOne({ course: course._id, title: sData.title });
        if (!section) {
          section = await Section.create({
            course: course._id,
            title: sData.title,
            order: sIdx + 1,
          });
        }

        for (let lIdx = 0; lIdx < sData.lessons.length; lIdx++) {
          const lData = sData.lessons[lIdx];
          let lesson = await Lesson.findOne({ course: course._id, title: lData.title });
          if (!lesson) {
            lesson = await Lesson.create({
              course: course._id,
              section: section._id,
              title: lData.title,
              duration: lData.duration,
              videoUrl: lData.videoUrl,
              description: lData.description,
              order: lIdx + 1,
              isFreePreview: lData.isFreePreview,
            });
            console.log(`  Added lesson: "${lData.title}"`);
          }
          totalLessons++;
          totalDuration += lData.duration || 10;
        }
      }

      // Quiz if defined
      if (cDef.quiz) {
        const existingQuiz = await Quiz.findOne({ course: course._id });
        if (!existingQuiz) {
          await Quiz.create({
            course: course._id,
            title: cDef.quiz.title,
            passingScore: cDef.quiz.passingScore,
            questions: cDef.quiz.questions,
          });
          console.log(`  Created quiz for "${course.title}"`);
        }
      }

      course.totalLessons = totalLessons;
      course.totalDuration = totalDuration;
      await course.save();
    }

    console.log('✅ Course enhancements and new courses added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Enhancement error:', err);
    process.exit(1);
  }
};

runEnhancement();
