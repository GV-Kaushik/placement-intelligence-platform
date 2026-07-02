-- =========================================================
-- Placementor Database Seed Script
-- =========================================================
-- Note: User accounts have been left empty so you can sign up / log in fresh.
-- Pre-seeded companies, skills, company requirements, and placement experiences are included below.

-- 1. Seed Master Companies
INSERT INTO companies (id, name, description, logo_url) VALUES
(1, 'Amazon', 'Global leader in e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'),
(2, 'Atlassian', 'Australian software company that develops products for software development, project management, and content management (Jira, Confluence, Trello).', 'https://upload.wikimedia.org/wikipedia/commons/g/g2/Atlassian_logo.svg'),
(3, 'Google', 'American multinational technology company focusing on search engine technology, online advertising, cloud computing, and computer software.', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'),
(4, 'Microsoft', 'American multinational technology corporation producing computer software, consumer electronics, personal computers, and services.', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'),
(5, 'Goldman Sachs', 'Leading global financial institution that delivers a broad range of financial services across investment banking, securities, and wealth management.', 'https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg'),
(6, 'Meta', 'Multinational technology conglomerate operating Facebook, Instagram, WhatsApp, and building the metaverse infrastructure.', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'),
(7, 'Apple', 'Multinational technology company that designs, develops, and sells consumer electronics, computer software, and online services.', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'),
(8, 'Netflix', 'World-leading streaming entertainment service with paid memberships in over 190 countries.', 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'),
(9, 'Uber', 'Global mobility technology platform offering ride-hailing, food delivery (Uber Eats), and freight transport.', 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png'),
(10, 'Adobe', 'Multinational computer software company focused on digital media creation, document management, and marketing tools.', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_2017.svg'),
(11, 'Flipkart', 'Leading Indian e-commerce company headquartered in Bengaluru, pioneer of online shopping and logistics in India.', 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg'),
(12, 'Salesforce', 'Global cloud computing software vendor specializing in customer relationship management (CRM) and enterprise apps.', 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url;

-- Reset auto-increment sequence for companies
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));

-- 2. Seed Master Skills List
INSERT INTO skills (id, name, category) VALUES
(1, 'Graphs', 'DSA'),
(2, 'DP (Dynamic Programming)', 'DSA'),
(3, 'Arrays', 'DSA'),
(4, 'Strings', 'DSA'),
(5, 'Heaps & Maps', 'DSA'),
(6, 'Trees', 'DSA'),
(7, 'Operating Systems', 'CS Core'),
(8, 'DBMS & SQL', 'CS Core'),
(9, 'Computer Networks', 'CS Core'),
(10, 'React', 'Development'),
(11, 'Node.js & Express', 'Development'),
(12, 'PostgreSQL', 'Development'),
(13, 'System Design', 'CS Core')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category;

-- Reset auto-increment sequence for skills
SELECT setval('skills_id_seq', (SELECT MAX(id) FROM skills));

-- 3. Seed Company Required Skills (M:N Map)
INSERT INTO company_skills (company_id, skill_id) VALUES
-- Amazon: Graphs, DP, OS, DBMS
(1, 1), (1, 2), (1, 7), (1, 8),
-- Atlassian: System Design, Trees, React
(2, 13), (2, 6), (2, 10),
-- Google: Graphs, Trees, DP
(3, 1), (3, 6), (3, 2),
-- Microsoft: Trees, Arrays, OS, System Design
(4, 6), (4, 3), (4, 7), (4, 13),
-- Goldman Sachs: DP, Arrays, DBMS, Math
(5, 2), (5, 3), (5, 8),
-- Meta: Graphs, Trees, System Design, Arrays
(6, 1), (6, 6), (6, 13), (6, 3),
-- Apple: OS, Computer Networks, System Design, Trees
(7, 7), (7, 9), (7, 13), (7, 6),
-- Netflix: System Design, Node.js, PostgreSQL, Computer Networks
(8, 13), (8, 11), (8, 12), (8, 9),
-- Uber: Graphs, System Design, Heaps & Maps, DBMS
(9, 1), (9, 13), (9, 5), (9, 8),
-- Adobe: Trees, DP, Strings, System Design
(10, 6), (10, 2), (10, 4), (10, 13),
-- Flipkart: DP, Graphs, DBMS, System Design
(11, 2), (11, 1), (11, 8), (11, 13),
-- Salesforce: DBMS, Node.js, React, System Design
(12, 8), (12, 11), (12, 10), (12, 13)
ON CONFLICT (company_id, skill_id) DO NOTHING;

-- 4. Seed Detailed Placement Experiences
INSERT INTO experiences (id, user_id, company_id, role, result, rounds, questions, upvotes) VALUES
-- 1. Amazon SDE Intern
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    NULL,
    1,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "HackerRank OA (70 mins). 1. Subarray sum equals K (HashMap O(N)). 2. Minimize maximum distance between gas stations (Binary search on floating point answer). All test cases passed."},
        {"round_name": "Technical Round 1", "content": "DSA & Amazon Leadership Principles (45 mins). Question: \"Shortest path in binary grid with obstacles\" using BFS. Behavioral question: \"Tell me about a time you handled a conflict in a project team.\""},
        {"round_name": "Technical Round 2", "content": "Deep dive into OS & DBMS (60 mins). Questions on virtual memory, paging vs segmentation, and SQL joins. SQL query for 2nd highest salary. Final DSA: \"Merge K Sorted Lists\" using Min-Heap."}
    ]',
    '[
        {"topic": "Arrays", "question": "Subarray sum equals K", "difficulty": "Medium"},
        {"topic": "Binary Search", "question": "Minimize max distance between gas stations", "difficulty": "Hard"},
        {"topic": "Graphs", "question": "Shortest path in binary grid", "difficulty": "Medium"},
        {"topic": "Heaps", "question": "Merge K Sorted Lists", "difficulty": "Hard"}
    ]',
    18
),
-- 2. Google SDE Intern
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
    NULL,
    3,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Challenge", "content": "Google Online Challenge (GOC). 2 questions. 1. Greedy algorithm with prefix sum optimization. 2. Tree range query using Euler Tour + Segment Tree. Solved 1.5 questions."},
        {"round_name": "Technical Round 1", "content": "Coding on Google Docs: \"Binary Tree Maximum Path Sum\" (Hard). Interviewer pushed for edge case analysis with negative node values and asked to reconstruct the path array."},
        {"round_name": "Technical Round 2", "content": "Coding: \"Sliding Window Maximum\" using Monotonic Deque in O(N) time. Followed by follow-up on memory bounds when dealing with streaming integer data."}
    ]',
    '[
        {"topic": "Trees", "question": "Binary Tree Maximum Path Sum", "difficulty": "Hard"},
        {"topic": "Sliding Window", "question": "Sliding Window Maximum", "difficulty": "Hard"}
    ]',
    24
),
-- 3. Meta (Facebook) SDE Full Time
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
    NULL,
    6,
    'Software Engineer',
    'Selected',
    '[
        {"round_name": "Screening Round", "content": "Screening (45 mins): 2 Top Meta LeetCode questions. 1. \"Kth Largest Element in an Array\" (Quickselect approach). 2. \"Valid Palindrome II\" (Two Pointers). Speed and clean syntax are key."},
        {"round_name": "Loop Round 1 (Coding)", "content": "Coding 1: \"Lowest Common Ancestor of a Binary Tree\" and \"Subarray Sum Equals K\". Focus on bug-free code on the first attempt without compilation assistance."},
        {"round_name": "Loop Round 2 (System Design)", "content": "System Design: Design Instagram News Feed. Discussed fan-out on write vs fan-out on read, Redis caching strategies, PostgreSQL sharding, and CDN static asset caching."}
    ]',
    '[
        {"topic": "Arrays", "question": "Kth Largest Element in an Array", "difficulty": "Medium"},
        {"topic": "Trees", "question": "Lowest Common Ancestor of Binary Tree", "difficulty": "Medium"},
        {"topic": "System Design", "question": "Design Instagram News Feed", "difficulty": "Hard"}
    ]',
    16
),
-- 4. Atlassian SDE Full Time
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    NULL,
    2,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "HackerEarth OA with 3 questions: Array manipulation, Tree path queries, and Edit Distance DP variation."},
        {"round_name": "Code Design Round", "content": "Object Oriented Design (90 mins): Build an in-memory Rate Limiter library in Java/JS. Used Token Bucket algorithm with Thread-safe locks and TTL cleanup."},
        {"round_name": "Values Fit Round", "content": "Behavioral & Values alignment: \"Play as a team\", \"Open company, no bullshit\". Be prepared with real project anecdotes."}
    ]',
    '[
        {"topic": "DP", "question": "Edit Distance Variation", "difficulty": "Hard"},
        {"topic": "System Design", "question": "Design Thread-Safe Rate Limiter", "difficulty": "Hard"}
    ]',
    14
),
-- 5. Microsoft SDE Intern
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
    NULL,
    4,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "Codility 3 questions in 90 mins: String manipulation, Array windowing, and Subsequence DP. All test cases passed."},
        {"round_name": "Technical Round 1", "content": "Teams Coding: \"Reverse Nodes in k-Group\" in O(1) space. Questions on OS process scheduling and C++ memory management."},
        {"round_name": "Technical Round 2", "content": "High-level System Design: Design collaborative document editing (Google Docs sync). DSA: \"LRU Cache\" implementation."}
    ]',
    '[
        {"topic": "Linked List", "question": "Reverse Nodes in k-Group", "difficulty": "Hard"},
        {"topic": "Design", "question": "Design LRU Cache", "difficulty": "Medium"}
    ]',
    11
),
-- 6. Uber SDE Full Time
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
    NULL,
    9,
    'Software Engineer (L4)',
    'Selected',
    '[
        {"round_name": "Online Challenge", "content": "CodeSignal 4 questions (70 mins). Matrix transformation, Graph traversal, and Heap scheduling problem."},
        {"round_name": "Technical Round 1", "content": "Graph Algorithms: Uber Surge Pricing dispatch. Problem reduced to \"Min Cost Max Flow\" / Dijkstra with dynamic edge weights."},
        {"round_name": "System Design Round", "content": "Design Uber Driver Location Tracking System. Handled 1 million active drivers sending GPS coordinates every 4 seconds using Geospatial Indexing (H3 / QuadTrees) and Apache Kafka."}
    ]',
    '[
        {"topic": "Graphs", "question": "Dijkstra with Dynamic Weights", "difficulty": "Hard"},
        {"topic": "System Design", "question": "Design Driver Location Tracking System", "difficulty": "Hard"}
    ]',
    20
),
-- 7. Goldman Sachs Analyst
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
    NULL,
    5,
    'Analyst',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "HackerRank Math/Aptitude + 2 Coding questions: \"Median from Data Stream\" (Two Heaps) and \"Coin Change\" (DP)."},
        {"round_name": "Technical Round 1", "content": "Puzzles & Probability followed by DSA: \"Subarray Product Less Than K\" using Sliding Window."},
        {"round_name": "Technical Round 2", "content": "DBMS deep dive: B-Trees indexing, ACID isolation levels, BCNF vs 3NF. Coding: \"Longest Common Subsequence\"."}
    ]',
    '[
        {"topic": "Heaps", "question": "Median from Data Stream", "difficulty": "Hard"},
        {"topic": "DP", "question": "Longest Common Subsequence", "difficulty": "Medium"}
    ]',
    15
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Initial Sample Comments
INSERT INTO comments (id, user_id, experience_id, comment_text) VALUES
(
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41',
    NULL,
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'This is a super helpful breakdown! Did they ask any specific questions on virtual memory page replacement policies in the second round?'
),
(
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42',
    NULL,
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    'Was the rate limiter coding round expected to run and compile on a live IDE, or did they only evaluate the class diagram and algorithms?'
)
ON CONFLICT (id) DO NOTHING;
