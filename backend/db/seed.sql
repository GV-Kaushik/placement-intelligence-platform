-- 1. Seed User
-- Password is 'password123' (hashed using bcrypt)
INSERT INTO users (id, name, email, password_hash, role, target_company, readiness_score)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Senior Student',
    'senior@placementor.ai',
    '$2a$10$TqyG5F27q77f/2Y26mE8QOrYgB9q6w64Z2nJex5qTszE2jF8oX7b.',
    'student',
    'Atlassian',
    85
) ON CONFLICT (email) DO NOTHING;

-- 2. Seed Student Profile (1:1 with user)
INSERT INTO student_profiles (id, user_id, college_name, cgpa, graduation_year, github_url, linkedin_url)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'National Institute of Technology',
    9.20,
    2026,
    'https://github.com/senior_coder_nit',
    'https://linkedin.com/in/senior-student-placementor'
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Seed Coding Profile Anchor (1:1 with user)
INSERT INTO coding_profiles (id, user_id)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) ON CONFLICT (user_id) DO NOTHING;

-- 4. Seed Coding Platform Stats (Option 2 - 1:N Sub-table)
INSERT INTO coding_platform_stats (id, coding_profile_id, platform_name, username, solved_count) VALUES
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'LeetCode',
    'senior_lc_profile',
    420
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Codeforces',
    'senior_cf_handle',
    180
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'GeeksforGeeks',
    'senior_gfg_profile',
    290
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Featured Companies
INSERT INTO companies (id, name, description, logo_url) VALUES
(1, 'Amazon', 'Global leader in e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'),
(2, 'Atlassian', 'Australian software company that develops products for software development, project management, and content management (Jira, Confluence, Trello).', 'https://upload.wikimedia.org/wikipedia/commons/g/g2/Atlassian_logo.svg'),
(3, 'Google', 'American multinational technology company focusing on search engine technology, online advertising, cloud computing, and computer software.', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'),
(4, 'Microsoft', 'American multinational technology corporation producing computer software, consumer electronics, personal computers, and services.', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'),
(5, 'Goldman Sachs', 'Leading global financial institution that delivers a broad range of financial services across investment banking, securities, and wealth management.', 'https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Master Skills List
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
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Student Skills (M:N Map)
-- Mapping Senior Student (user_id) to React, Node, PostgreSQL, DP, and OS
INSERT INTO user_skills (user_id, skill_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 10), -- React
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 11), -- Node.js
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 12), -- PostgreSQL
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2),  -- DP
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 7)   -- OS
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- 8. Seed Company Skills Requirements (M:N Map)
-- Amazon requests Graphs, DP, OS, DBMS
INSERT INTO company_skills (company_id, skill_id) VALUES
(1, 1), -- Graphs
(1, 2), -- DP
(1, 7), -- OS
(1, 8), -- DBMS
-- Atlassian requests System Design, Trees, React
(2, 13), -- System Design
(2, 6),  -- Trees
(2, 10), -- React
-- Google requests Graphs, Trees, DP
(3, 1), -- Graphs
(3, 6), -- Trees
(3, 2)  -- DP
ON CONFLICT (company_id, skill_id) DO NOTHING;

-- 9. Seed Placement Experiences (Option B - Dynamic JSONB Rounds)
INSERT INTO experiences (id, user_id, company_id, role, result, rounds, questions, upvotes) VALUES
-- Amazon Experience 1
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "Online Assessment had 2 questions on HackerRank. Time: 70 mins. 1. Find the number of subarrays having sum exactly equal to K (HashMap approach). 2. Minimize maximum distance between gas stations (Binary Search on Answer). All test cases passed."},
        {"round_name": "Technical Round 1", "content": "Technical Round 1 (45 mins): Discussion on projects. Then a DSA question: \"Find shortest path in a binary grid with obstacles\" (BFS approach). Followed by Amazon Leadership Principles: \"Tell me about a time you handled a conflict in your team.\""},
        {"round_name": "Technical Round 2", "content": "Technical Round 2 (60 mins): Deep dive into OS & DBMS. Questions on virtual memory, paging, and SQL joins. Write a query to find the second highest salary. Final DSA question: \"Merge K Sorted Lists\" (Min-heap approach)."}
    ]',
    '[
        {"topic": "Arrays", "question": "Subarray sum equals K", "difficulty": "Medium"},
        {"topic": "Binary Search", "question": "Minimize max distance between stations", "difficulty": "Hard"},
        {"topic": "Graphs", "question": "Shortest path in binary grid with obstacles", "difficulty": "Medium"},
        {"topic": "Heaps", "question": "Merge K Sorted Lists", "difficulty": "Hard"},
        {"topic": "DBMS", "question": "Second highest salary SQL query", "difficulty": "Medium"}
    ]',
    12
),
-- Amazon Experience 2
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'SDE Full Time',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "OA: 1 Graph question (Find critical connections in a network - Tarjan Algorithm) and 1 DP question (Word Break problem). Passed 13/15 test cases on Graph, 15/15 on DP."},
        {"round_name": "Technical Round 1", "content": "Technical Round 1: Focus on DSA. \"Course Schedule II\" (Topological Sort / DFS). Interviewer asked about time complexity and cycle detection logic in directed graphs."},
        {"round_name": "Technical Round 2", "content": "Technical Round 2: Focused on System Design and Leadership Principles. Designing a URL shortener like TinyURL. Discussed scalability, database selection (NoSQL vs SQL), and caching strategies."}
    ]',
    '[
        {"topic": "Graphs", "question": "Critical Connections / Tarjan Algorithm", "difficulty": "Hard"},
        {"topic": "DP", "question": "Word Break Problem", "difficulty": "Medium"},
        {"topic": "Graphs", "question": "Course Schedule II / Topological Sort", "difficulty": "Medium"},
        {"topic": "System Design", "question": "Design URL Shortener (TinyURL)", "difficulty": "Medium"}
    ]',
    8
),
-- Atlassian Experience 1
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    2,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "OA was on Hackerearth. Had 3 questions. 1. Simple array manipulation (Easy). 2. Tree path sum query (Medium). 3. Dynamic Programming (Edit distance variant - Hard). I solved 2 completely, 3rd partially."},
        {"round_name": "Technical Round 1 (System & Code Design)", "content": "Technical Round 1 (System Design & Code Design): Implement a Rate Limiter library in Java/JS. Focus on concurrency, thread-safety, and OOP principles. Used Token Bucket algorithm."},
        {"round_name": "Values Fit Round", "content": "Technical Round 2 (Values Fit Round): Atlassian values are very important. Be prepared for: \"Play, as a team\", \"Be the change you seek\", \"Don''t #@!% the customer\". Discussed scenarios matching these values."}
    ]',
    '[
        {"topic": "Trees", "question": "Path Sum III", "difficulty": "Medium"},
        {"topic": "DP", "question": "Edit Distance variant", "difficulty": "Hard"},
        {"topic": "System Design", "question": "Design a Rate Limiter (Token Bucket)", "difficulty": "Hard"}
    ]',
    15
),
-- Google Experience 1
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    3,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "Google Online Challenge (GOC): 2 questions. 1. Greedy algorithm with prefix sum (Medium). 2. Tree query using Segment Tree / Euler Tour (Hard). Solved 1 completely, 2nd partially. Got shortlisted."},
        {"round_name": "Technical Round 1", "content": "Technical Round 1: \"Binary Tree Maximum Path Sum\" (Hard). Focus was on handling negative values. The interviewer then asked to modify it to find the path itself, not just the sum."},
        {"round_name": "Technical Round 2", "content": "Technical Round 2: \"Sliding Window Maximum\" (Hard) using Monotonic Queue. Discussed why queue size is bounded, time complexity analysis, and edge cases with duplicates."}
    ]',
    '[
        {"topic": "Trees", "question": "Binary Tree Maximum Path Sum", "difficulty": "Hard"},
        {"topic": "Sliding Window", "question": "Sliding Window Maximum", "difficulty": "Hard"},
        {"topic": "Segment Trees", "question": "Range Sum Query - Mutable", "difficulty": "Hard"}
    ]',
    22
),
-- Microsoft Experience 1
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    4,
    'SDE Intern',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "OA on Codility: 3 questions in 90 mins. 1. String manipulation (Easy). 2. Array problem (Medium). 3. Dynamic Programming / Subsequence sum (Medium). Solved all 3."},
        {"round_name": "Technical Round 1", "content": "Technical Round 1: Coding on MS Teams. Question: \"Reverse Nodes in k-Group\" (Hard). Interviewer asked to do it in O(1) extra space. Also questions on C++ pointers, references, and Destructors."},
        {"round_name": "Technical Round 2", "content": "Technical Round 2: Design and DSA. Design a collaborative document editor like Google Docs (high level). DSA question: \"LRU Cache\" (Medium) using Doubly Linked List and HashMap."}
    ]',
    '[
        {"topic": "Linked List", "question": "Reverse Nodes in k-Group", "difficulty": "Hard"},
        {"topic": "Design", "question": "Design LRU Cache", "difficulty": "Medium"},
        {"topic": "Strings", "question": "Valid Parentheses check", "difficulty": "Easy"}
    ]',
    10
),
-- Goldman Sachs Experience 1
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    5,
    'Analyst',
    'Selected',
    '[
        {"round_name": "Online Assessment", "content": "OA on HackerRank: 1. Numerical Ability / Maths (20 questions). 2. Coding (2 questions: \"Median from Data Stream\" - Heaps, and \"Coin Change\" - DP). 3. Computer Science multiple choice questions."},
        {"round_name": "Technical Round 1", "content": "Technical Round 1: Puzzles and Math! \"How to measure 45 minutes with two candles?\" and probability questions. Then DSA: \"Subarray Product Less Than K\" (Sliding Window)."},
        {"round_name": "Technical Round 2", "content": "Technical Round 2: Resume deep dive. DBMS questions: Normalization (1NF, 2NF, 3NF, BCNF), transaction properties (ACID), and indexes (B-Trees). Coding: \"Longest Common Subsequence\"."}
    ]',
    '[
        {"topic": "Math", "question": "Median from Data Stream", "difficulty": "Hard"},
        {"topic": "DP", "question": "Coin Change Problem", "difficulty": "Medium"},
        {"topic": "Sliding Window", "question": "Subarray Product Less Than K", "difficulty": "Medium"},
        {"topic": "DBMS", "question": "Database Normalization explanation", "difficulty": "Medium"},
        {"topic": "DP", "question": "Longest Common Subsequence", "difficulty": "Medium"}
    ]',
    14
)
ON CONFLICT (id) DO NOTHING;

-- 10. Seed Comments
INSERT INTO comments (id, user_id, experience_id, comment_text) VALUES
(
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'This is an incredibly detailed review! Thanks. Did they ask any specific questions on virtual memory page replacement policies in the second round?'
),
(
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
    'Was the rate limiter coding round expected to run and compile, or did they only evaluate the class diagram and algorithm?'
)
ON CONFLICT (id) DO NOTHING;

-- 11. Seed Student Placement Applications Tracking
INSERT INTO applications (id, user_id, company_id, role, status) VALUES
(
    '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a51',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    2, -- Atlassian
    'SDE Intern',
    'Selected'
),
(
    '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a52',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1, -- Amazon
    'SDE Full Time',
    'Interviewing'
),
(
    '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a53',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    3, -- Google
    'SDE Intern',
    'OA'
)
ON CONFLICT (id) DO NOTHING;
