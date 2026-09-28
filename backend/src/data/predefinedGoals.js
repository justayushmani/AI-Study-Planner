export const PREDEFINED_GOALS = [
  {
    id: "dsa-interview",
    title: "DSA / Coding Interview",
    category: "Coding",
    description: "Master essential data structures and algorithmic patterns for tech interviews.",
    defaultDurationWeeks: 8,
    topics: [
      {
        id: "dsa-1",
        title: "Arrays & Strings Manipulation",
        unitName: "Foundations",
        difficultyLevel: 2,
        baseEstimatedMinutes: 90,
        importanceScore: 5,
        prerequisites: [],
        description: "Static arrays, two pointers, prefix sums, and sliding window patterns."
      },
      {
        id: "dsa-2",
        title: "Hash Maps & Sets",
        unitName: "Foundations",
        difficultyLevel: 2,
        baseEstimatedMinutes: 60,
        importanceScore: 5,
        prerequisites: ["dsa-1"],
        description: "Constant-time lookups, frequency counting, and hash collision basics."
      },
      {
        id: "dsa-3",
        title: "Linked Lists & Pointers",
        unitName: "Linear Structures",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 4,
        prerequisites: ["dsa-1"],
        description: "Singly/doubly linked lists, fast & slow pointers, reversing in-place."
      },
      {
        id: "dsa-4",
        title: "Stacks & Queues",
        unitName: "Linear Structures",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 4,
        prerequisites: ["dsa-1"],
        description: "Monotonic stacks, parenthesizing, BFS queue queues."
      },
      {
        id: "dsa-5",
        title: "Binary Trees & BST",
        unitName: "Hierarchical Structures",
        difficultyLevel: 4,
        baseEstimatedMinutes: 120,
        importanceScore: 5,
        prerequisites: ["dsa-3", "dsa-4"],
        description: "Tree traversals (inorder, preorder, postorder), depth calculations, BST validation."
      },
      {
        id: "dsa-6",
        title: "Graphs: BFS & DFS",
        unitName: "Graphs",
        difficultyLevel: 4,
        baseEstimatedMinutes: 120,
        importanceScore: 5,
        prerequisites: ["dsa-4", "dsa-5"],
        description: "Adjacency lists, cycle detection, connected components, topological sort."
      },
      {
        id: "dsa-7",
        title: "Dynamic Programming: 1D & 2D",
        unitName: "Advanced Algorithms",
        difficultyLevel: 5,
        baseEstimatedMinutes: 150,
        importanceScore: 5,
        prerequisites: ["dsa-5"],
        description: "Memoization, tabulation, knapsack patterns, longest common subsequence."
      }
    ]
  },
  {
    id: "web-development",
    title: "Web Development (Full-Stack)",
    category: "Development",
    description: "Learn modern full-stack web engineering from frontend foundations to backend APIs and databases.",
    defaultDurationWeeks: 10,
    topics: [
      {
        id: "web-1",
        title: "HTML5 Semantic Structure & Responsive CSS",
        unitName: "Frontend Core",
        difficultyLevel: 2,
        baseEstimatedMinutes: 60,
        importanceScore: 4,
        prerequisites: [],
        description: "Box model, Flexbox, Grid, semantic layout, and accessibility."
      },
      {
        id: "web-2",
        title: "Modern JavaScript & Async Programming",
        unitName: "Frontend Core",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 5,
        prerequisites: ["web-1"],
        description: "ES6+, Promises, Async/Await, Fetch API, and DOM manipulation."
      },
      {
        id: "web-3",
        title: "React Component Architecture & Hooks",
        unitName: "Frontend Framework",
        difficultyLevel: 3,
        baseEstimatedMinutes: 120,
        importanceScore: 5,
        prerequisites: ["web-2"],
        description: "JSX, props, useState, useEffect, custom hooks, and component lifecycle."
      },
      {
        id: "web-4",
        title: "Node.js & Express REST APIs",
        unitName: "Backend Services",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 5,
        prerequisites: ["web-2"],
        description: "Routing, middleware, request/response cycle, error handling."
      },
      {
        id: "web-5",
        title: "PostgreSQL & Relational Data Modeling",
        unitName: "Database Systems",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 4,
        prerequisites: ["web-4"],
        description: "Schema design, foreign keys, indexing, and Prisma ORM."
      },
      {
        id: "web-6",
        title: "Authentication & Security (JWT & Cookies)",
        unitName: "Security",
        difficultyLevel: 4,
        baseEstimatedMinutes: 90,
        importanceScore: 5,
        prerequisites: ["web-4", "web-5"],
        description: "Password hashing, JWT generation, protected routes, and CORS security."
      }
    ]
  },
  {
    id: "machine-learning",
    title: "Machine Learning Foundations",
    category: "AI & ML",
    description: "Build an understanding of supervised and unsupervised machine learning algorithms.",
    defaultDurationWeeks: 8,
    topics: [
      {
        id: "ml-1",
        title: "Linear Algebra & Calculus for ML",
        unitName: "Mathematics",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 4,
        prerequisites: [],
        description: "Vectors, matrix multiplication, gradients, and partial derivatives."
      },
      {
        id: "ml-2",
        title: "NumPy, Pandas & Data Preprocessing",
        unitName: "Data Engineering",
        difficultyLevel: 2,
        baseEstimatedMinutes: 75,
        importanceScore: 5,
        prerequisites: [],
        description: "Array broadcasting, handling missing data, normalization, and one-hot encoding."
      },
      {
        id: "ml-3",
        title: "Linear & Logistic Regression",
        unitName: "Supervised Learning",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 5,
        prerequisites: ["ml-1", "ml-2"],
        description: "Cost functions, gradient descent, classification metrics (Precision, Recall, ROC-AUC)."
      },
      {
        id: "ml-4",
        title: "Decision Trees & Ensemble Methods",
        unitName: "Supervised Learning",
        difficultyLevel: 4,
        baseEstimatedMinutes: 100,
        importanceScore: 4,
        prerequisites: ["ml-3"],
        description: "Information gain, Gini impurity, Random Forests, and Gradient Boosting."
      },
      {
        id: "ml-5",
        title: "Introduction to Deep Learning & Neural Nets",
        unitName: "Deep Learning",
        difficultyLevel: 4,
        baseEstimatedMinutes: 120,
        importanceScore: 5,
        prerequisites: ["ml-3"],
        description: "Perceptrons, activation functions, backpropagation, and PyTorch basics."
      }
    ]
  },
  {
    id: "data-science",
    title: "Data Science & Analytics",
    category: "Data",
    description: "Statistical inference, exploratory data analysis, and predictive modeling.",
    defaultDurationWeeks: 6,
    topics: [
      {
        id: "ds-1",
        title: "Descriptive & Inferential Statistics",
        unitName: "Foundations",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 5,
        prerequisites: [],
        description: "Mean, variance, probability distributions, hypothesis testing (p-values, z-test)."
      },
      {
        id: "ds-2",
        title: "Exploratory Data Analysis & Visualization",
        unitName: "Analysis",
        difficultyLevel: 2,
        baseEstimatedMinutes: 75,
        importanceScore: 4,
        prerequisites: ["ds-1"],
        description: "Seaborn, Matplotlib, identifying outliers, and correlation heatmaps."
      },
      {
        id: "ds-3",
        title: "SQL for Advanced Data Querying",
        unitName: "Data Extraction",
        difficultyLevel: 3,
        baseEstimatedMinutes: 80,
        importanceScore: 5,
        prerequisites: [],
        description: "Complex joins, window functions (ROW_NUMBER, RANK), aggregation, subqueries."
      }
    ]
  },
  {
    id: "gate-exam",
    title: "GATE Computer Science Preparation",
    category: "Academic",
    description: "Comprehensive coverage of core Computer Science subjects for the GATE exam.",
    defaultDurationWeeks: 12,
    topics: [
      {
        id: "gate-1",
        title: "Discrete Mathematics & Graph Theory",
        unitName: "Engineering Math",
        difficultyLevel: 4,
        baseEstimatedMinutes: 120,
        importanceScore: 5,
        prerequisites: [],
        description: "Set theory, combinatorics, recurrence relations, graph connectivity."
      },
      {
        id: "gate-2",
        title: "Theory of Computation (Automata & Grammars)",
        unitName: "Theoretical CS",
        difficultyLevel: 4,
        baseEstimatedMinutes: 120,
        importanceScore: 5,
        prerequisites: ["gate-1"],
        description: "DFA, NFA, Regular Expressions, Context-Free Grammars, Turing Machines."
      },
      {
        id: "gate-3",
        title: "Operating Systems Core Concepts",
        unitName: "Systems",
        difficultyLevel: 3,
        baseEstimatedMinutes: 100,
        importanceScore: 5,
        prerequisites: [],
        description: "Process management, CPU scheduling algorithms, Deadlocks, Virtual Memory."
      },
      {
        id: "gate-4",
        title: "Computer Networks & Protocols",
        unitName: "Systems",
        difficultyLevel: 3,
        baseEstimatedMinutes: 100,
        importanceScore: 4,
        prerequisites: [],
        description: "OSI/TCP-IP models, Subnetting, Routing algorithms, TCP/UDP transport."
      }
    ]
  },
  {
    id: "semester-exam",
    title: "Semester Examination Preparation",
    category: "Academic",
    description: "Structured fast-track study plan for university semester exams.",
    defaultDurationWeeks: 4,
    topics: [
      {
        id: "sem-1",
        title: "Unit 1: Fundamentals & Theory",
        unitName: "Unit 1",
        difficultyLevel: 2,
        baseEstimatedMinutes: 60,
        importanceScore: 4,
        prerequisites: [],
        description: "Core definitions, terminology, and foundational proofs."
      },
      {
        id: "sem-2",
        title: "Unit 2: Analytical & Numerical Problems",
        unitName: "Unit 2",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 5,
        prerequisites: ["sem-1"],
        description: "Step-by-step problem solving, derivations, and formulas."
      },
      {
        id: "sem-3",
        title: "Unit 3: Applications & Case Studies",
        unitName: "Unit 3",
        difficultyLevel: 3,
        baseEstimatedMinutes: 90,
        importanceScore: 4,
        prerequisites: ["sem-2"],
        description: "Practical implementations, architectural diagrams, and exam past papers."
      }
    ]
  }
];
