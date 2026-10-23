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
const QuizAttempt = require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

const { seedUsers, seedCategories } = require('./seedData');

const sampleCoursesDef = [
  {
    title: 'Mastering Full-Stack MERN Architecture',
    slug: 'mastering-full-stack-mern-architecture',
    subtitle: 'Build production-ready web applications with MongoDB, Express, React, and Node.',
    description: 'A deep-dive masterclass covering modern React 18 patterns, state management, REST API engineering with Express, MongoDB indexing, JWT cookie security, and performance optimizations. You will build a real SaaS platform from initial schema planning to production deployment.',
    categorySlug: 'web-development',
    difficulty: 'intermediate',
    price: 0,
    featured: true,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Basic JavaScript ES6+', 'HTML5 & CSS fundamentals', 'Basic terminal familiarity'],
    learningOutcomes: [
      'Architect robust RESTful APIs with Node.js and Express',
      'Design normalized MongoDB schemas and compound indexes',
      'Build responsive, accessible user interfaces with React and Tailwind CSS',
      'Implement secure JWT authentication with HTTP-only cookies',
    ],
    sections: [
      {
        title: 'Module 1: Architecture & Backend Foundations',
        lessons: [
          {
            title: 'Welcome & System Architecture Overview',
            duration: 8,
            videoUrl: 'https://www.youtube.com/watch?v=k3Vfj-e1Ma4',
            description: 'Understand the client-server separation, RESTful contract, and project structure.',
            isFreePreview: true,
          },
          {
            title: 'Express Server Setup and Security Headers',
            duration: 15,
            videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
            description: 'Configure Helmet, CORS with credentials, and centralized error middleware.',
            isFreePreview: true,
          },
          {
            title: 'MongoDB Connection & Mongoose Models',
            duration: 20,
            videoUrl: 'https://www.youtube.com/watch?v=ofme2o29ngU',
            description: 'Establish robust database connectivity and write schemas with validation.',
            isFreePreview: false,
          },
        ],
      },
      {
        title: 'Module 2: Frontend Engineering with React & Vite',
        lessons: [
          {
            title: 'Vite Setup and Tailwind CSS Design Tokens',
            duration: 12,
            videoUrl: 'https://www.youtube.com/watch?v=dFgzHOX84xQ',
            description: 'Configure typography, color systems, and reusable UI component primitives.',
            isFreePreview: false,
          },
          {
            title: 'Context API for Authentication State',
            duration: 18,
            videoUrl: 'https://www.youtube.com/watch?v=5LrDIWkK_Bc',
            description: 'Manage session hydration, protected routes, and role-based guards.',
            isFreePreview: false,
          },
          {
            title: 'Production Build & Deployment Optimization',
            duration: 14,
            videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            description: 'Bundle size analysis, chunking strategies, and environment configurations.',
            isFreePreview: false,
          },
        ],
      },
    ],
    quiz: {
      title: 'MERN Stack Architecture Assessment',
      passingScore: 70,
      questions: [
        {
          questionText: 'Why should sensitive authentication tokens be stored in HTTP-only cookies instead of localStorage?',
          options: [
            'HTTP-only cookies cannot be accessed by client-side JavaScript, mitigating XSS attacks',
            'HTTP-only cookies make requests 10x faster',
            'localStorage is not supported in modern browsers',
            'Cookies have unlimited storage capacity compared to localStorage',
          ],
          correctOptionIndex: 0,
          explanation: 'HTTP-only cookies prevent malicious scripts injected via Cross-Site Scripting (XSS) from reading your session tokens.',
        },
        {
          questionText: 'What is the purpose of Mongoose schema indexes?',
          options: [
            'To format JSON output for clients',
            'To drastically speed up document lookups on frequently queried fields',
            'To prevent any edits to documents',
            'To automatically encrypt fields',
          ],
          correctOptionIndex: 1,
          explanation: 'Indexes create efficient data structures (B-trees) allowing the database engine to find documents without scanning entire collections.',
        },
      ],
    },
  },
  {
    title: 'Modern React 18 & Design Systems',
    slug: 'modern-react-18-design-systems',
    subtitle: 'Build modular, accessible, and scalable UI component libraries with Tailwind CSS.',
    description: 'Learn how modern product teams build enterprise React applications. Master custom hooks, concurrent features, component composition, accessible keyboard navigation, and responsive design systems.',
    categorySlug: 'web-development',
    difficulty: 'beginner',
    price: 0,
    featured: true,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['HTML, CSS, and basic JavaScript'],
    learningOutcomes: [
      'Master React 18 hooks including useId, useTransition, and useDeferredValue',
      'Create reusable component design tokens with Tailwind CSS',
      'Build fully accessible modal dialogs and dropdown menus',
    ],
    sections: [
      {
        title: 'Module 1: Modern Hooks & State Patterns',
        lessons: [
          {
            title: 'Component Decomposition & Pure Functions',
            duration: 10,
            videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            description: 'Deconstruct complex UIs into clean, single-responsibility components.',
            isFreePreview: true,
          },
          {
            title: 'Custom Hooks for Data Fetching & UI State',
            duration: 15,
            videoUrl: 'https://www.youtube.com/watch?v=6ThXsUwLWvc',
            description: 'Encapsulate asynchronous logic and side effects with custom hooks.',
            isFreePreview: false,
          },
        ],
      },
    ],
  },
  {
    title: 'Practical Artificial Intelligence & LLM Engineering',
    slug: 'practical-ai-llm-engineering',
    subtitle: 'Integrate generative AI, vector embeddings, and LangChain into modern apps.',
    description: 'Comprehensive guide to building production AI-powered software. Covers semantic search, vector databases, prompt engineering patterns, retrieval-augmented generation (RAG), and fine-tuning fundamentals.',
    categorySlug: 'artificial-intelligence',
    difficulty: 'advanced',
    price: 0,
    featured: true,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Python basics or Node.js proficiency', 'REST API fundamentals'],
    learningOutcomes: [
      'Implement Retrieval-Augmented Generation (RAG) pipelines',
      'Store and query semantic vectors in MongoDB vector search',
      'Design reliable prompt templates and structured JSON responses',
    ],
    sections: [
      {
        title: 'Module 1: Vector Embeddings & Similarity Search',
        lessons: [
          {
            title: 'Introduction to High-Dimensional Embeddings',
            duration: 16,
            videoUrl: 'https://www.youtube.com/watch?v=ySus5ZS0b94',
            description: 'How text is transformed into dense vector representations for semantic search.',
            isFreePreview: true,
          },
          {
            title: 'Building a Vector RAG Pipeline',
            duration: 22,
            videoUrl: 'https://www.youtube.com/watch?v=L_G06_z7yA8',
            description: 'Chunking strategies, document retrieval, and augmenting context.',
            isFreePreview: false,
          },
        ],
      },
    ],
  },
  {
    title: 'Cloud DevOps: Docker, Kubernetes & AWS',
    slug: 'cloud-devops-docker-kubernetes-aws',
    subtitle: 'Containerize, orchestrate, and deploy scalable microservices with zero downtime.',
    description: 'Go from local development to production cloud deployment. Master multi-stage Dockerfiles, Docker Compose, Kubernetes pods, services, ingress controllers, CI/CD automation, and AWS infrastructure.',
    categorySlug: 'cloud-computing',
    difficulty: 'intermediate',
    price: 0,
    featured: false,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Basic Linux command line knowledge'],
    learningOutcomes: [
      'Write optimized multi-stage Dockerfiles for Node & React',
      'Deploy and scale applications on Kubernetes clusters',
      'Set up automated GitHub Actions CI/CD pipelines',
    ],
    sections: [
      {
        title: 'Module 1: Production Containerization',
        lessons: [
          {
            title: 'Multi-stage Docker Builds for Frontend & Backend',
            duration: 18,
            videoUrl: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
            description: 'Minimize image sizes, leverage build cache, and secure non-root containers.',
            isFreePreview: true,
          },
        ],
      },
    ],
  },
  {
    title: 'Cyber Security Essentials & Ethical Hacking',
    slug: 'cyber-security-essentials-ethical-hacking',
    subtitle: 'Protect web applications against OWASP Top 10 vulnerabilities and modern threats.',
    description: 'Learn offensive and defensive web security. Master SQL injection, Cross-Site Scripting (XSS), CSRF, broken access controls, cryptography, and network defense strategies.',
    categorySlug: 'cyber-security',
    difficulty: 'beginner',
    price: 0,
    featured: false,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Basic web development familiarity'],
    learningOutcomes: [
      'Identify and remediate OWASP Top 10 vulnerabilities',
      'Configure CSP, CORS, and HTTP security headers correctly',
      'Perform security audits on web APIs',
    ],
    sections: [
      {
        title: 'Module 1: Web Application Defense',
        lessons: [
          {
            title: 'Preventing Injection & Broken Authentication',
            duration: 20,
            videoUrl: 'https://www.youtube.com/watch?v=2_lswM1S264',
            description: 'Practical defense against unauthorized access and SQL/NoSQL injection attacks.',
            isFreePreview: true,
          },
        ],
      },
    ],
  },
  {
    title: 'React Native & Mobile App Engineering',
    slug: 'react-native-mobile-app-engineering',
    subtitle: 'Build native iOS and Android mobile apps from a single TypeScript codebase.',
    description: 'Craft cross-platform mobile experiences with React Native and Expo. Covers navigation, gesture handling, animations, device camera access, offline caching, and store deployment.',
    categorySlug: 'mobile-development',
    difficulty: 'intermediate',
    price: 0,
    featured: true,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Proficiency with React and JavaScript'],
    learningOutcomes: [
      'Build performant mobile screens with Expo and React Native',
      'Implement offline persistent storage with AsyncStorage',
      'Handle smooth gestures and native device permissions',
    ],
    sections: [
      {
        title: 'Module 1: Cross-Platform Fundamentals',
        lessons: [
          {
            title: 'Native Components & Layout with Flexbox',
            duration: 15,
            videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
            description: 'Understand how React Native maps JavaScript components to native platform views.',
            isFreePreview: true,
          },
        ],
      },
    ],
  },
  {
    title: 'Data Science & Machine Learning with Python',
    slug: 'data-science-machine-learning-python',
    subtitle: 'Transform raw data into predictive models with Pandas, NumPy, and Scikit-Learn.',
    description: 'Master exploratory data analysis, data wrangling with pandas, feature engineering, statistical modeling, and machine learning classification algorithms.',
    categorySlug: 'data-science',
    difficulty: 'beginner',
    price: 0,
    featured: false,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Basic Python programming syntax'],
    learningOutcomes: [
      'Perform data cleansing and transformation with Pandas',
      'Train supervised learning models with Scikit-Learn',
      'Build visual analytics charts with Matplotlib and Seaborn',
    ],
    sections: [
      {
        title: 'Module 1: Exploratory Data Analysis',
        lessons: [
          {
            title: 'Dataframes, Indexing, and Grouping',
            duration: 18,
            videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
            description: 'Learn efficient aggregation, filtering, and statistical summaries.',
            isFreePreview: true,
          },
        ],
      },
    ],
  },
  {
    title: 'TypeScript in Practice for Web Developers',
    slug: 'typescript-in-practice-for-web-developers',
    subtitle: 'Write robust, bug-free web code with advanced types, generics, and strict mode.',
    description: 'Learn how to leverage TypeScript in enterprise applications. Understand union types, intersections, generics, utility types, and typing complex React components.',
    categorySlug: 'web-development',
    difficulty: 'beginner',
    price: 0,
    featured: false,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Basic JavaScript'],
    learningOutcomes: [
      'Master generics, conditional types, and utility types',
      'Strictly type React props, state, and event handlers',
      'Configure tsconfig for production builds',
    ],
    sections: [
      {
        title: 'Module 1: Core Type System',
        lessons: [
          {
            title: 'Type Inference, Unions, and Type Narrowing',
            duration: 14,
            videoUrl: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
            description: 'Understand static type checking and how TypeScript guards runtime code.',
            isFreePreview: true,
          },
        ],
      },
    ],
  },
  {
    title: 'Database Architecture & High Performance SQL/NoSQL',
    slug: 'database-architecture-sql-nosql',
    subtitle: 'Design high-throughput database schemas, query optimizations, and indexes.',
    description: 'Compare relational (PostgreSQL) and document (MongoDB) databases. Master query execution plans, indexing strategies, transactions, replication, and sharding.',
    categorySlug: 'data-science',
    difficulty: 'advanced',
    price: 0,
    featured: false,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Database basics'],
    learningOutcomes: [
      'Analyze query execution plans and optimize slow queries',
      'Design compound indexes to avoid full collection scans',
      'Implement multi-document ACID transactions',
    ],
    sections: [
      {
        title: 'Module 1: Indexing & Query Execution',
        lessons: [
          {
            title: 'B-Trees, Hash Indexes, and Explain Plans',
            duration: 17,
            videoUrl: 'https://www.youtube.com/watch?v=ofme2o29ngU',
            description: 'Learn how storage engines locate data efficiently.',
            isFreePreview: true,
          },
        ],
      },
    ],
  },
  {
    title: 'Microservices with Node.js & RabbitMQ',
    slug: 'microservices-with-nodejs-rabbitmq',
    subtitle: 'Architect event-driven distributed systems with asynchronous message brokers.',
    description: 'Break monolithic architectures into decoupled microservices. Learn asynchronous messaging with RabbitMQ, service discovery, saga distributed transactions, and API gateways.',
    categorySlug: 'cloud-computing',
    difficulty: 'advanced',
    price: 0,
    featured: false,
    isPublished: true,
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Solid Node.js & Docker understanding'],
    learningOutcomes: [
      'Design message queues with RabbitMQ exchanges and consumers',
      'Implement eventual consistency across microservice boundaries',
      'Build resilient API gateways with rate limiting and logging',
    ],
    sections: [
      {
        title: 'Module 1: Message Broker Architectures',
        lessons: [
          {
            title: 'Publish/Subscribe & Direct Queues with RabbitMQ',
            duration: 21,
            videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
            description: 'Decouple high-traffic API requests with reliable asynchronous message workers.',
            isFreePreview: true,
          },
        ],
      },
    ],
  },
  // Draft courses (to verify draft vs. published business logic)
  {
    title: 'Quantum Computing Fundamentals for Developers',
    slug: 'quantum-computing-fundamentals',
    subtitle: 'Introduction to qubits, quantum gates, and Qiskit quantum algorithms.',
    description: 'An upcoming exploration into quantum computation for traditional software engineers. Understanding superposition, entanglement, and quantum logic circuits.',
    categorySlug: 'artificial-intelligence',
    difficulty: 'advanced',
    price: 0,
    featured: false,
    isPublished: false, // DRAFT
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['Linear algebra basics'],
    learningOutcomes: ['Understand quantum gates and circuits', 'Simulate quantum algorithms in Python'],
    sections: [
      {
        title: 'Module 1: Qubits & Superposition',
        lessons: [
          {
            title: 'Classical vs Quantum Information',
            duration: 10,
            videoUrl: '',
            description: 'Draft notes on quantum information theory.',
            isFreePreview: false,
          },
        ],
      },
    ],
  },
  {
    title: 'Rust for High-Performance Systems Programming',
    slug: 'rust-for-high-performance-systems',
    subtitle: 'Memory safety without garbage collection, concurrency, and WebAssembly.',
    description: 'An upcoming course on Rust systems programming, ownership models, borrowing, lifetimes, and compiling to WebAssembly for web applications.',
    categorySlug: 'web-development',
    difficulty: 'intermediate',
    price: 0,
    featured: false,
    isPublished: false, // DRAFT
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
    prerequisites: ['C, C++, or JavaScript proficiency'],
    learningOutcomes: ['Master ownership and borrowing', 'Build memory-safe multi-threaded utilities'],
    sections: [
      {
        title: 'Module 1: Rust Ownership Model',
        lessons: [
          {
            title: 'Stack vs Heap and Ownership Rules',
            duration: 12,
            videoUrl: '',
            description: 'Draft lesson outlining Rust safety guarantees.',
            isFreePreview: false,
          },
        ],
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting LearnHub database seed script...');

    if (env.NODE_ENV === 'production' && process.env.CONFIRM_PRODUCTION_SEED !== 'true') {
      console.error('⛔ Safety Guard: Cannot run seed script in production without CONFIRM_PRODUCTION_SEED=true');
      process.exit(1);
    }

    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Course.deleteMany({}),
      Section.deleteMany({}),
      Lesson.deleteMany({}),
      Enrollment.deleteMany({}),
      LessonProgress.deleteMany({}),
      Quiz.deleteMany({}),
      QuizAttempt.deleteMany({}),
      Certificate.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('✓ Collections cleared.');

    // 1. Create Users
    console.log('👤 Seeding Users (Admin, 2 Instructors, 10 Students)...');
    const createdUsers = [];
    for (const u of seedUsers) {
      const userDoc = await User.create(u);
      createdUsers.push(userDoc);
    }
    console.log(`✓ Created ${createdUsers.length} users.`);

    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const instructors = createdUsers.filter((u) => u.role === 'instructor');
    const students = createdUsers.filter((u) => u.role === 'student');

    // 2. Create Categories
    console.log('📁 Seeding Categories...');
    const categoryMap = {};
    for (const cat of seedCategories) {
      const createdCat = await Category.create(cat);
      categoryMap[createdCat.slug] = createdCat;
    }
    console.log(`✓ Created ${Object.keys(categoryMap).length} categories.`);

    // 3. Create Courses, Sections, Lessons, Quizzes
    console.log('📚 Seeding 12 Courses, Curriculum, and Quizzes...');
    const createdCourses = [];

    for (let i = 0; i < sampleCoursesDef.length; i++) {
      const def = sampleCoursesDef[i];
      const categoryDoc = categoryMap[def.categorySlug];
      // Alternate between the two instructors
      const instructorDoc = instructors[i % instructors.length];

      const course = await Course.create({
        title: def.title,
        slug: def.slug,
        subtitle: def.subtitle,
        description: def.description,
        instructor: instructorDoc._id,
        category: categoryDoc._id,
        difficulty: def.difficulty,
        price: def.price,
        featured: def.featured,
        isPublished: def.isPublished,
        thumbnail: def.thumbnail,
        prerequisites: def.prerequisites,
        learningOutcomes: def.learningOutcomes,
      });

      // Update category count
      await Category.findByIdAndUpdate(categoryDoc._id, { $inc: { courseCount: 1 } });

      let courseDuration = 0;
      let totalLessons = 0;

      // Create sections and lessons
      for (let sIdx = 0; sIdx < def.sections.length; sIdx++) {
        const secDef = def.sections[sIdx];
        const section = await Section.create({
          course: course._id,
          title: secDef.title,
          order: sIdx + 1,
        });

        for (let lIdx = 0; lIdx < secDef.lessons.length; lIdx++) {
          const lDef = secDef.lessons[lIdx];
          await Lesson.create({
            course: course._id,
            section: section._id,
            title: lDef.title,
            duration: lDef.duration,
            videoUrl: lDef.videoUrl,
            description: lDef.description,
            isFreePreview: lDef.isFreePreview,
            order: lIdx + 1,
            resources: [
              { title: 'Project Starter Code (GitHub)', url: 'https://github.com' },
              { title: 'Documentation & Architecture PDF', url: 'https://example.com/docs.pdf' },
            ],
          });
          courseDuration += lDef.duration;
          totalLessons++;
        }
      }

      await Course.findByIdAndUpdate(course._id, {
        totalDuration: courseDuration,
        totalLessons,
      });

      // Create Quiz if defined
      if (def.quiz) {
        await Quiz.create({
          course: course._id,
          title: def.quiz.title,
          passingScore: def.quiz.passingScore,
          questions: def.quiz.questions,
        });
      }

      createdCourses.push(await Course.findById(course._id));
    }
    console.log(`✓ Created ${createdCourses.length} courses with curriculum.`);

    // 4. Enroll Students & Add Sample Progress, Certificates, and Reviews
    console.log('🎓 Seeding Student Enrollments, Progress & Verified Certificates...');
    const mernCourse = createdCourses[0];
    const reactCourse = createdCourses[1];
    const aiCourse = createdCourses[2];

    const mernLessons = await Lesson.find({ course: mernCourse._id });

    // Enroll students 1 through 6 into MERN Course
    for (let i = 0; i < 6; i++) {
      const student = students[i];

      // Student 1 & 2 have completed 100% of the course!
      const isComplete = i < 2;
      const completedCount = isComplete ? mernLessons.length : 2;
      const progressPercentage = Math.round((completedCount / mernLessons.length) * 100);

      const enrollment = await Enrollment.create({
        student: student._id,
        course: mernCourse._id,
        status: isComplete ? 'completed' : 'active',
        progressPercentage,
        completedLessonsCount: completedCount,
        lastAccessedLesson: mernLessons[0]?._id,
        completedAt: isComplete ? new Date() : null,
      });

      await Course.findByIdAndUpdate(mernCourse._id, { $inc: { enrollmentCount: 1 } });

      // Create lesson progress entries
      for (let l = 0; l < completedCount; l++) {
        await LessonProgress.create({
          student: student._id,
          course: mernCourse._id,
          lesson: mernLessons[l]._id,
          isCompleted: true,
          completedAt: new Date(),
        });
      }

      // If complete, generate verified certificate
      if (isComplete) {
        const certId = `LH-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        await Certificate.create({
          certificateId: certId,
          student: student._id,
          course: mernCourse._id,
          studentName: student.name,
          courseTitle: mernCourse.title,
          instructorName: 'Sarah Miller',
          issuedAt: new Date(),
          grade: 98,
        });
        console.log(`   Issued Certificate ${certId} for ${student.name}`);
      }

      // Add Review
      await Review.create({
        student: student._id,
        course: mernCourse._id,
        rating: 5,
        comment: `Excellent curriculum! The architectural breakdown of ${mernCourse.title} was practical and helped me understand real production standards.`,
      });
    }

    // Update MERN course rating statistics
    await Course.findByIdAndUpdate(mernCourse._id, {
      averageRating: 5.0,
      reviewCount: 6,
    });

    // Enroll students in React Course & AI Course
    for (let i = 2; i < 8; i++) {
      const student = students[i];
      await Enrollment.create({
        student: student._id,
        course: reactCourse._id,
        status: 'active',
        progressPercentage: 50,
        completedLessonsCount: 1,
      });
      await Course.findByIdAndUpdate(reactCourse._id, { $inc: { enrollmentCount: 1 } });

      await Review.create({
        student: student._id,
        course: reactCourse._id,
        rating: 4.8,
        comment: 'Very clean component patterns and great explanations of custom hooks!',
      });
    }
    await Course.findByIdAndUpdate(reactCourse._id, {
      averageRating: 4.8,
      reviewCount: 6,
    });

    console.log('✓ Seed completed successfully!');
    console.log('========================================================');
    console.log('🔑 DEMO CREDENTIALS:');
    console.log('   Admin:      admin@learnhub.com      / Admin123!');
    console.log('   Instructor: sarah@learnhub.com      / Instructor123!');
    console.log('   Instructor: alex@learnhub.com       / Instructor123!');
    console.log('   Student:    student1@learnhub.com   / Student123!');
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
