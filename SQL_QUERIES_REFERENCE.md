# PlaceMentor AI — SQL Queries Reference
# =========================================
# This file documents EVERY SQL query used in each feature/endpoint.
# Organized by feature. Use this to understand what happens in the database
# for each API call.
#
# SYNTAX NOTE:
#   $1, $2, $3 → These are placeholders for actual values passed safely from Node.js.
#                 This is called "parameterized queries" — it prevents SQL Injection attacks.
#                 Example: WHERE email = $1   means   WHERE email = 'kaushik@gmail.com'
# =========================================


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 1: USER REGISTRATION
# Endpoint: POST /api/auth/register
# File: backend/controllers/authController.js
# ══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Check if email already exists (to prevent duplicates)
SELECT id
FROM users
WHERE email = $1;
-- $1 = 'kaushik@gmail.com'
-- If this returns a row → user already exists → send 400 error
-- If this returns nothing → safe to create new user

-- STEP 2: Insert new user into the database
INSERT INTO users (name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, name, email, role, target_company, readiness_score, created_at;
-- $1 = 'Kaushik'
-- $2 = 'kaushik@gmail.com'
-- $3 = '$2a$10$...' (bcrypt hashed password, NOT the plain text password)
-- RETURNING → means: after inserting, immediately send back those columns as a result
--             so we can use the data (like id) right away without a second SELECT

-- WHAT HAPPENS IN THE DATABASE:
-- A new row is added to the 'users' table.
-- password_hash stores the encrypted version of the password using bcrypt.
-- id is automatically generated as a UUID (e.g. '550e8400-e29b-41d4-a716-446655440000')
-- role defaults to 'student', readiness_score defaults to 60


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 2: USER LOGIN
# Endpoint: POST /api/auth/login
# File: backend/controllers/authController.js
# ══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Find the user by email
SELECT *
FROM users
WHERE email = $1;
-- $1 = 'kaushik@gmail.com'
-- SELECT * → fetches all columns including password_hash (needed for password comparison)
-- If no rows returned → user not found → send 401 error
-- If row found → proceed to password check (done in Node.js using bcrypt.compare)

-- NOTE: After finding the user, password verification happens in JavaScript (not SQL):
--   bcrypt.compare(plainPassword, user.password_hash)
--   → This compares the typed password with the stored hash
--   → If mismatch → send 401 error

-- WHAT HAPPENS IN THE DATABASE:
-- Only a READ operation (SELECT). Nothing is inserted or updated.
-- The password is NEVER stored in plain text. bcrypt handles all encryption/decryption.


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 3: SESSION RESTORE / GET CURRENT USER
# Endpoint: GET /api/auth/me
# File: backend/controllers/authController.js
# ══════════════════════════════════════════════════════════════════════════════

-- Fetch the current logged-in user's profile by their ID
SELECT id, name, email, role, target_company, readiness_score, created_at
FROM users
WHERE id = $1;
-- $1 = '550e8400-...' (UUID extracted from the decoded JWT token in authMiddleware.js)
-- Notice: we do NOT select password_hash here (never expose it to frontend)
-- If row found → send back user profile
-- If no row → send 404 error (user was deleted after token was issued)

-- WHAT HAPPENS IN THE DATABASE:
-- Only a READ operation (SELECT).
-- The user ID comes from the JWT token, NOT from the request body (more secure).


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 4: UPDATE USER PROFILE
# Endpoint: PUT /api/auth/me
# File: backend/controllers/authController.js
# ══════════════════════════════════════════════════════════════════════════════

-- Example 1: Update only target_company
UPDATE users
SET target_company = $1, updated_at = NOW()
WHERE id = $2
RETURNING id, name, email, role, target_company, readiness_score, created_at;
-- $1 = 'Google'
-- $2 = '550e8400-...' (user ID from JWT token)
-- NOW() → PostgreSQL function that returns current timestamp

-- Example 2: Update only readiness_score
UPDATE users
SET readiness_score = $1, updated_at = NOW()
WHERE id = $2
RETURNING id, name, email, role, target_company, readiness_score, created_at;
-- $1 = 75

-- Example 3: Update BOTH target_company AND readiness_score
UPDATE users
SET target_company = $1, readiness_score = $2, updated_at = NOW()
WHERE id = $3
RETURNING id, name, email, role, target_company, readiness_score, created_at;

-- HOW THE QUERY IS BUILT DYNAMICALLY IN CODE:
-- The controller checks which fields were sent and builds the SET clause dynamically.
-- This prevents overwriting fields that weren't included in the request.

-- RETURNING → sends back the updated row immediately, so we don't need a second SELECT.

-- WHAT HAPPENS IN THE DATABASE:
-- The users row for this user ID is updated.
-- updated_at timestamp is refreshed.


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 5: GET ALL COMPANIES
# Endpoint: GET /api/companies
# File: backend/controllers/companyController.js
# ══════════════════════════════════════════════════════════════════════════════

-- Fetch all companies, sorted alphabetically by name
SELECT *
FROM companies
ORDER BY name ASC;
-- Returns: id, name, description, logo_url, created_at for every company
-- ASC → A to Z order

-- WHAT HAPPENS IN THE DATABASE:
-- A full table scan on 'companies' table.
-- Returns all rows. Frontend will render each as a company card.


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 6: GET SINGLE COMPANY + ANALYTICS
# Endpoint: GET /api/companies/:id
# File: backend/controllers/companyController.js
# ══════════════════════════════════════════════════════════════════════════════

-- QUERY 1: Get the company's basic info
SELECT *
FROM companies
WHERE id = $1;
-- $1 = 1 (company ID from the URL parameter)
-- Returns: id, name, description, logo_url

-- QUERY 2: Get all experiences for this company to calculate analytics
SELECT rounds, questions, result
FROM experiences
WHERE company_id = $1;
-- $1 = 1 (same company ID)
-- rounds   → JSONB column: array of { round_name, content }
-- questions → JSONB column: array of { topic, question, difficulty }
-- result   → 'Selected' or 'Rejected'

-- ANALYTICS CALCULATIONS (done in JavaScript/Node.js after fetching, NOT in SQL):
--
-- 1. totalExperiences = experiences.length
--
-- 2. successRate:
--    successCount = how many rows have result = 'Selected'
--    successRate  = (successCount / totalExperiences) * 100
--
-- 3. averageRounds:
--    For each experience → parse rounds JSONB → get rounds.length
--    avgRounds = totalRoundsSum / totalExperiences
--
-- 4. mostAskedTopics:
--    For each experience → parse questions JSONB
--    For each question  → count occurrences of each topic
--    Sort by count descending → gives most common interview topics

-- WHAT HAPPENS IN THE DATABASE:
-- 2 SELECT queries are run.
-- All analytics math happens in JavaScript (Node.js), not in SQL.


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 7: GET ALL EXPERIENCES (Feed with Filters and Search)
# Endpoint: GET /api/experiences
# File: backend/controllers/experienceController.js
# ══════════════════════════════════════════════════════════════════════════════

-- BASE QUERY (no filters applied):
SELECT
  e.id,
  e.role,
  e.result,
  e.rounds,
  e.questions,
  e.upvotes,
  e.created_at,
  c.id         AS company_id,
  c.name       AS company_name,
  c.logo_url   AS company_logo,
  u.name       AS user_name,
  EXISTS(
    SELECT 1
    FROM experience_upvotes
    WHERE experience_id = e.id AND user_id = $1
  ) AS has_upvoted
FROM experiences e
JOIN companies c ON e.company_id = c.id
JOIN users u ON e.user_id = u.id
WHERE 1=1
ORDER BY e.created_at DESC;
-- $1 = logged-in user's UUID (or NULL if guest)
-- JOIN → combines data from multiple tables into one result row
-- EXISTS(...) → returns true/false: "Has THIS user upvoted THIS experience?"
-- WHERE 1=1 → always true, just a base clause so we can append AND conditions easily
-- ORDER BY DESC → newest experiences appear first

-- WITH FILTER: ?company_id=1
WHERE 1=1
  AND e.company_id = $2;
-- Only returns experiences for company with ID = 1

-- WITH FILTER: ?result=Selected
WHERE 1=1
  AND e.result = $2;
-- Only returns experiences where the student got selected

-- WITH FILTER: ?role=SDE
WHERE 1=1
  AND e.role ILIKE $2;
-- $2 = '%SDE%'
-- ILIKE → case-insensitive LIKE
-- So 'SDE 1', 'Backend SDE', 'SDE Intern' all match

-- WITH SEARCH: ?q=graphs
WHERE 1=1
  AND (
    c.name     ILIKE $2 OR
    e.role     ILIKE $2 OR
    e.rounds::text   ILIKE $2 OR
    e.questions::text ILIKE $2
  );
-- $2 = '%graphs%'
-- ::text → casts JSONB column to plain text so ILIKE can search inside it
-- Searches across: company name, role title, interview round descriptions, question topics

-- WHAT HAPPENS IN THE DATABASE:
-- 3 tables are JOINed: experiences, companies, users
-- 1 subquery (EXISTS) runs for each row to check upvote status
-- Filters are applied dynamically based on query params


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 8: GET SINGLE EXPERIENCE BY ID
# Endpoint: GET /api/experiences/:id
# File: backend/controllers/experienceController.js
# ══════════════════════════════════════════════════════════════════════════════

-- Fetch a specific experience post with full detail
SELECT
  e.id,
  e.role,
  e.result,
  e.rounds,
  e.questions,
  e.upvotes,
  e.created_at,
  c.id         AS company_id,
  c.name       AS company_name,
  c.logo_url   AS company_logo,
  u.name       AS user_name,
  EXISTS(
    SELECT 1
    FROM experience_upvotes
    WHERE experience_id = e.id AND user_id = $1
  ) AS has_upvoted
FROM experiences e
JOIN companies c ON e.company_id = c.id
JOIN users u ON e.user_id = u.id
WHERE e.id = $2;
-- $1 = logged-in user's UUID (or NULL)
-- $2 = 'abc-uuid-of-the-experience'

-- WHAT HAPPENS IN THE DATABASE:
-- Same JOIN structure as the feed query, but filtered to a single row by experience ID.
-- Returns complete data including all rounds and questions in JSONB format.


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 9: SUBMIT A PLACEMENT EXPERIENCE
# Endpoint: POST /api/experiences
# File: backend/controllers/experienceController.js
# ══════════════════════════════════════════════════════════════════════════════

-- STEP 1a: If only company_name is given (no company_id), look up the company
SELECT id
FROM companies
WHERE name ILIKE $1;
-- $1 = 'Google'
-- ILIKE → case-insensitive so 'google', 'Google', 'GOOGLE' all match

-- STEP 1b: If company not found in DB, create it dynamically
INSERT INTO companies (name, description)
VALUES ($1, $2)
RETURNING id;
-- $1 = 'Google'
-- $2 = 'Interviews and hiring information for Google'
-- RETURNING id → we need the new company's ID to link it to the experience

-- STEP 2: Insert the experience
INSERT INTO experiences (user_id, company_id, role, result, rounds, questions)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
-- $1 = '550e8400-...' (user_id from JWT token — student who is submitting)
-- $2 = 1            (company_id — Google's ID)
-- $3 = 'SDE Intern' (role they applied for)
-- $4 = 'Selected'   (result of the interview)
-- $5 = '[{"round_name":"OA","content":"2 DSA questions"}]'   (JSON string)
-- $6 = '[{"topic":"Arrays","question":"Two Sum","difficulty":"Easy"}]' (JSON string)
-- RETURNING * → returns the complete newly inserted row

-- WHAT HAPPENS IN THE DATABASE:
-- 1 row is inserted into the 'experiences' table.
-- rounds and questions are stored as JSONB (PostgreSQL's JSON data type).
-- If company didn't exist, a new row is also created in 'companies'.


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 10: TOGGLE UPVOTE ON AN EXPERIENCE
# Endpoint: POST /api/experiences/:id/upvote
# File: backend/controllers/experienceController.js
# ══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Check if the experience actually exists
SELECT id, upvotes
FROM experiences
WHERE id = $1;
-- $1 = 'abc-uuid' (experience ID from URL)
-- If no rows → experience doesn't exist → send 404 error

-- STEP 2: Check if this user already upvoted this experience
SELECT 1
FROM experience_upvotes
WHERE user_id = $1 AND experience_id = $2;
-- $1 = user UUID (from JWT token)
-- $2 = experience UUID (from URL)
-- SELECT 1 → we just need to know if a row EXISTS (not the actual data)
-- If row found → user already upvoted → we should REMOVE the upvote
-- If no row found → user hasn't upvoted → we should ADD the upvote

-- STEP 3a: REMOVE upvote (user already liked it, clicking again = unlike)
DELETE FROM experience_upvotes
WHERE user_id = $1 AND experience_id = $2;
-- Deletes exactly 1 row from the junction table
-- newUpvotesCount = currentUpvotes - 1

-- STEP 3b: ADD upvote (user hasn't liked it yet)
INSERT INTO experience_upvotes (user_id, experience_id)
VALUES ($1, $2);
-- Inserts 1 row into the junction table
-- newUpvotesCount = currentUpvotes + 1

-- STEP 4: Update the cached upvote count on the experience itself
UPDATE experiences
SET upvotes = $1
WHERE id = $2;
-- $1 = newUpvotesCount (calculated in JavaScript)
-- $2 = experience UUID
-- This caches the count so we don't have to COUNT(*) every time we display experiences

-- WHAT HAPPENS IN THE DATABASE:
-- experience_upvotes: 1 row is either INSERTED or DELETED
-- experiences: upvotes column is UPDATED with the new count
-- Total: 4 queries run for a single upvote toggle action


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 11: AI MOCK INTERVIEWS & SCORECARD PIPELINE
# Endpoint: POST /api/mock-interviews
#           POST /api/mock-interviews/:id/message
#           GET /api/mock-interviews/:id
# File: backend/controllers/mockController.js
# ══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Create a new mock interview session row
INSERT INTO mock_interviews (user_id, company_name, role, difficulty, chat_history, status)
VALUES ($1, $2, $3, $4, '[]'::jsonb, 'in_progress')
RETURNING *;
-- $1 = User UUID
-- $2 = 'Google'
-- $3 = 'Software Engineer'
-- $4 = 'Medium'

-- STEP 2: Update session with initial question in history
UPDATE mock_interviews
SET chat_history = $1::jsonb
WHERE id = $2 AND user_id = $3
RETURNING *;
-- $1 = '[{"role": "model", "text": "Hi! Let us start..."}]' (JSON string)
-- $2 = session UUID
-- $3 = User UUID

-- STEP 3: Fetch current session details
SELECT * FROM mock_interviews
WHERE id = $1 AND user_id = $2;
-- $1 = session UUID
-- $2 = User UUID

-- STEP 4: Save updated history with candidate answer
UPDATE mock_interviews
SET chat_history = $1::jsonb
WHERE id = $2 AND user_id = $3
RETURNING *;
-- $1 = Updated history array including user answer and next question

-- STEP 5: Save completed history (user's 5th response)
UPDATE mock_interviews
SET chat_history = $1::jsonb
WHERE id = $2 AND user_id = $3;
-- This stores the complete transcript before we calculate scores

-- STEP 6: Save scorecard feedback details
INSERT INTO interview_feedbacks (
  mock_interview_id, dsa_score, os_score, dbms_score, cn_score, overall_score, feedback_details, weak_areas
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
RETURNING *;
-- $1 = session UUID
-- $2 = 80 (DSA score)
-- $3 = 70 (OS score)
-- $4 = 75 (DBMS score)
-- $5 = 60 (CN score)
-- $6 = 71 (Overall average)
-- $7 = 'Narrative text feedback...'
-- $8 = '["Binary Trees", "DNS Lookup"]' (JSON string)

-- STEP 7: Mark interview session as completed
UPDATE mock_interviews
SET status = 'completed'
WHERE id = $1 AND user_id = $2
RETURNING *;

-- STEP 8: Update user's readiness score in user profile
UPDATE users
SET readiness_score = $1
WHERE id = $2;
-- $1 = Overall score from step 6 (e.g. 71)
-- $2 = User UUID

-- STEP 9: Get single mock interview details
SELECT * FROM mock_interviews
WHERE id = $1 AND user_id = $2;

-- STEP 10: Get scorecard feedback for a completed session
SELECT * FROM interview_feedbacks
WHERE mock_interview_id = $1;


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 13: AI STUDY ROADMAP GENERATOR
# Endpoints:
#   - POST /api/roadmaps
#   - GET /api/roadmaps
#   - GET /api/roadmaps/:id
#   - DELETE /api/roadmaps/:id
# File: backend/controllers/roadmapController.js
# ══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Create a new roadmap session
INSERT INTO roadmaps (user_id, target_company, days_available, roadmap_data)
VALUES ($1, $2, $3, $4::jsonb)
RETURNING *;
-- $1 = User UUID
-- $2 = Target company (e.g. 'Google')
-- $3 = Days available (e.g. 30)
-- $4 = JSON string of generated roadmap data

-- STEP 2: Get all roadmaps generated by a user
SELECT * FROM roadmaps
WHERE user_id = $1
ORDER BY created_at DESC;
-- $1 = User UUID

-- STEP 3: Get details of a specific roadmap
SELECT * FROM roadmaps
WHERE id = $1 AND user_id = $2;
-- $1 = Roadmap UUID
-- $2 = User UUID

-- STEP 4: Delete a specific roadmap
DELETE FROM roadmaps
WHERE id = $1 AND user_id = $2
RETURNING *;
-- $1 = Roadmap UUID
-- $2 = User UUID


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMA REFERENCE — TABLE STRUCTURES (Quick Reminder)
# ══════════════════════════════════════════════════════════════════════════════

-- users table
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,    -- Never store plain text passwords!
  role            VARCHAR(50) DEFAULT 'student',
  target_company  VARCHAR(100) DEFAULT NULL,
  readiness_score INTEGER DEFAULT 60,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- companies table
CREATE TABLE companies (
  id          SERIAL PRIMARY KEY,           -- Auto-incrementing integer (1, 2, 3...)
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url    VARCHAR(255),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- experiences table
CREATE TABLE experiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,      -- Foreign key to users
  company_id  INTEGER REFERENCES companies(id) ON DELETE CASCADE, -- Foreign key to companies
  role        VARCHAR(100) NOT NULL,
  result      VARCHAR(50) NOT NULL,         -- 'Selected' or 'Rejected'
  rounds      JSONB DEFAULT '[]',           -- Array of { round_name, content }
  questions   JSONB DEFAULT '[]',           -- Array of { topic, question, difficulty }
  upvotes     INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- experience_upvotes table (M:N junction table)
CREATE TABLE experience_upvotes (
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, experience_id)  -- Composite key: prevents duplicate upvotes
);

-- mock_interviews table (1:N relationship with users)
CREATE TABLE mock_interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name    VARCHAR(100) NOT NULL,
  role            VARCHAR(100) NOT NULL,
  difficulty      VARCHAR(50) NOT NULL,
  status          VARCHAR(50) DEFAULT 'in_progress',
  chat_history    JSONB DEFAULT '[]',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- interview_feedbacks table (1:1 relationship with mock_interviews)
CREATE TABLE interview_feedbacks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_interview_id UUID REFERENCES mock_interviews(id) ON DELETE CASCADE UNIQUE,
  dsa_score         INTEGER NOT NULL,
  os_score          INTEGER NOT NULL,
  dbms_score        INTEGER NOT NULL,
  cn_score          INTEGER NOT NULL,
  overall_score     INTEGER NOT NULL,
    feedback_details  TEXT NOT NULL,
    weak_areas        JSONB DEFAULT '[]',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- roadmaps table (1:N relationship with users)
  CREATE TABLE roadmaps (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    target_company VARCHAR(100) NOT NULL,
    days_available INTEGER NOT NULL,
    roadmap_data   JSONB NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );


  # ══════════════════════════════════════════════════════════════════════════════
  # KEY SQL CONCEPTS USED IN THIS PROJECT
# ══════════════════════════════════════════════════════════════════════════════

-- 1. PARAMETERIZED QUERIES ($1, $2...)
--    Prevents SQL Injection. Values are passed separately from the query text.
--    BAD  (dangerous): `WHERE email = '${email}'`  ← Attacker can inject SQL
--    GOOD (safe):      `WHERE email = $1`  with values: [email]

-- 2. JOIN
--    Combines rows from multiple tables based on a related column.
--    INNER JOIN (JOIN) → only rows that have a match in BOTH tables
--    Example: JOIN companies c ON e.company_id = c.id
--             → For each experience row, attach the matching company row

-- 3. RETURNING
--    After INSERT or UPDATE, immediately return the affected row(s).
--    Saves us from writing a separate SELECT query.
--    Example: INSERT INTO users (...) VALUES (...) RETURNING id, name, email;

-- 4. ILIKE
--    Case-insensitive pattern matching (PostgreSQL-specific).
--    LIKE  → case-sensitive  ('google' ≠ 'Google')
--    ILIKE → case-insensitive ('google' = 'Google' = 'GOOGLE')
--    % symbol → wildcard (matches any characters)
--    '%google%' → matches anything containing 'google' anywhere in the string

-- 5. EXISTS(subquery)
--    Returns true/false based on whether the subquery returns at least one row.
--    Much faster than COUNT(*) when you only need to know if something exists.
--    Example: EXISTS(SELECT 1 FROM experience_upvotes WHERE user_id=$1 AND experience_id=$2)

-- 6. ON DELETE CASCADE
--    If a parent row is deleted, automatically delete all child rows too.
--    Example: If a user is deleted → all their experiences are also deleted automatically.

-- 7. JSONB (Binary JSON)
--    PostgreSQL data type for storing JSON data.
--    Allows storing arrays and objects inside a single column.
--    ::text → cast JSONB to text string (so ILIKE can search inside it)
--    Example: rounds JSONB DEFAULT '[]'
--             → Stores: [{ "round_name": "OA", "content": "2 DSA problems" }]

-- 8. PRIMARY KEY (composite)
--    A primary key made of TWO columns together.
--    PRIMARY KEY (user_id, experience_id)
--    → The COMBINATION must be unique
--    → Same user cannot upvote the same experience twice
--    → But same user CAN upvote DIFFERENT experiences
--    → Different users CAN upvote the SAME experience

-- 9. UUID vs SERIAL
--    SERIAL   → auto-incrementing integer (1, 2, 3...) — used for companies
--    UUID     → random unique string (550e8400-e29b-41d4-a716-446655440000) — used for users, experiences
--    UUID is preferred for users/experiences because it is harder to guess and more secure.

-- 10. NOW()
--     PostgreSQL function that returns the current date and time.
--     Used in: updated_at = NOW()  when updating a row.
