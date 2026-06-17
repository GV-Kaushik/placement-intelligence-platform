# PlaceMentor AI — Complete Feature Flow Documentation
# =====================================================
# This file explains EVERY feature built so far.
# For each feature: which files are involved, in what order, and what happens at each step.
# Use this as reference if an interviewer asks: "How does feature X work?"
# =====================================================


# ──────────────────────────────────────────────────────────────────────────────
# OVERALL PROJECT ARCHITECTURE (Big Picture)
# ──────────────────────────────────────────────────────────────────────────────
#
#  BROWSER (React Frontend)         HTTP Request/Response         NODE.JS (Express Backend)
#  ─────────────────────────        ─────────────────────         ─────────────────────────
#
#  src/pages/*.jsx                  axios (api.js)                index.js  (entry point)
#       │                               │                              │
#  src/context/AuthContext.jsx    ──────┤                         routes/*.js  (URL routing)
#       │                               │                              │
#  src/services/api.js  ──────────────→ │  → HTTP Request →       middleware/  (security guard)
#                                       │                              │
#                                       │  ← HTTP Response ←      controllers/*.js  (logic)
#                                                                       │
#                                                                  config/db.js  (database connection)
#                                                                       │
#                                                                  PostgreSQL Database
#
#
# HOW FRONTEND AND BACKEND TALK:
#   1. User does something on UI (clicks button, fills form)
#   2. React component calls a function (e.g. login(), register())
#   3. That function uses api.js (Axios) to send an HTTP Request to the backend
#   4. api.js INTERCEPTOR automatically adds "Authorization: Bearer <token>" to every request
#   5. Backend's index.js receives the request and routes it to the correct router file
#   6. Router file checks if middleware (security guard) is needed, then calls the controller
#   7. Controller runs the database query and sends back a JSON response
#   8. React receives the JSON response and updates the UI
#
# ──────────────────────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 1: USER REGISTRATION (Signup)
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: Opens /signup page, fills Name + Email + Password, clicks "Create Account"
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. frontend/src/pages/Signup.jsx
#     → User types name, email, password, confirmPassword into input fields
#     → Each onChange updates local state: setName(), setEmail(), setPassword(), setConfirmPassword()
#     → User clicks "Create Account" button (type="submit")
#     → <form onSubmit={handleSubmit}> fires handleSubmit()
#
#  2. handleSubmit() inside Signup.jsx
#     → e.preventDefault()  ← Stops browser page reload
#     → Validates: are fields empty? do passwords match? is password >= 6 chars?
#     → If validation fails → setError("...message...") → shows red error box → STOPS here
#     → If validation passes → calls register(name, email, password) from AuthContext
#
#  3. frontend/src/context/AuthContext.jsx  → register() function
#     → Calls: api.post('/auth/register', { name, email, password })
#
#  4. frontend/src/services/api.js  → Axios interceptor runs
#     → Checks localStorage for token → none found (new user) → no Authorization header added
#     → Sends HTTP POST request to: http://localhost:5000/api/auth/register
#     → Request body (JSON): { name: "Kaushik", email: "k@test.com", password: "pass123" }
#
# [BACKEND]
#  5. backend/index.js
#     → app.use('/api/auth', authRoutes) → matches the URL → forwards to authRoutes.js
#
#  6. backend/routes/authRoutes.js
#     → router.post('/register', registerUser) → no middleware (public route) → calls registerUser()
#
#  7. backend/controllers/authController.js  → registerUser()
#     → Reads name, email, password from req.body
#     → Queries DB: "Does this email already exist in users table?"
#     → If YES → sends 400 error: "A user with this email already exists"
#     → If NO  → bcrypt.hash(password) → converts plain password to encrypted hash
#     → INSERT INTO users (name, email, password_hash) → saves new row to database
#     → generateToken(user) → creates a JWT token (valid for 30 days)
#     → Sends 201 response: { success: true, token: "eyJ...", user: { id, name, email, role } }
#
# [FRONTEND - BACK]
#  8. AuthContext.jsx receives the response
#     → localStorage.setItem('token', res.data.token)  ← Saves token to browser storage
#     → setUser(res.data.user)  ← Stores user object in global React state
#
#  9. Signup.jsx
#     → navigate('/dashboard')  ← Redirects user to dashboard page
#
# DATABASE TABLES AFFECTED: users (INSERT new row)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 2: USER LOGIN
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: Opens /login page, fills Email + Password, clicks "Sign In"
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. frontend/src/pages/Login.jsx
#     → User fills email and password
#     → Clicks "Sign In" button → <form onSubmit={handleSubmit}> fires
#
#  2. handleSubmit() inside Login.jsx
#     → e.preventDefault()
#     → Validates: are fields empty?
#     → Calls login(email, password) from AuthContext
#
#  3. frontend/src/context/AuthContext.jsx  → login() function
#     → Calls: api.post('/auth/login', { email, password })
#
#  4. frontend/src/services/api.js  → Axios interceptor runs
#     → No token in localStorage yet → no Authorization header
#     → Sends HTTP POST to: http://localhost:5000/api/auth/login
#
# [BACKEND]
#  5. backend/index.js → backend/routes/authRoutes.js
#     → router.post('/login', loginUser) → calls loginUser() (no middleware, public)
#
#  6. backend/controllers/authController.js  → loginUser()
#     → SELECT * FROM users WHERE email = $1  ← Find user by email
#     → If NOT found → 401 error: "Invalid email or password"
#     → If found → bcrypt.compare(password, user.password_hash) ← Compare passwords
#     → If password WRONG → 401 error: "Invalid email or password"
#     → If password CORRECT → delete user.password_hash (never send this to frontend)
#     → generateToken(user) → creates JWT token
#     → Sends 200 response: { success: true, token: "eyJ...", user: {...} }
#
# [FRONTEND - BACK]
#  7. AuthContext.jsx
#     → localStorage.setItem('token', token) ← saves token
#     → setUser(user) ← sets global user state
#
#  8. Login.jsx → navigate('/dashboard')
#
# DATABASE TABLES AFFECTED: users (SELECT only, no changes)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 3: SESSION RESTORATION (Auto-Login on Page Refresh)
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: User refreshes the browser or opens the app again later.
#              The app should remember that the user is already logged in.
#
# WHY THIS IS NEEDED:
#   React state is wiped on every page refresh.
#   Without this, user would be logged out every time they refresh.
#   We saved the token in localStorage (browser storage that survives refresh).
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. frontend/src/main.jsx
#     → React app starts, renders <AuthProvider> wrapping entire app
#
#  2. frontend/src/context/AuthContext.jsx  → AuthProvider mounts
#     → useState sets: user = null, loading = true
#     → useEffect runs immediately (runs once on first load):
#         const token = localStorage.getItem('token')
#         If token found → calls api.get('/auth/me')
#
#  3. frontend/src/services/api.js  → Axios interceptor runs
#     → Finds token in localStorage → adds "Authorization: Bearer eyJ..." header
#     → Sends HTTP GET to: http://localhost:5000/api/auth/me
#
# [BACKEND]
#  4. backend/routes/authRoutes.js
#     → router.get('/me', protect, getMe)  ← HAS MIDDLEWARE (protect) first!
#
#  5. backend/middleware/authMiddleware.js  → protect()
#     → Reads req.headers.authorization
#     → Splits "Bearer eyJ..." → extracts "eyJ..."
#     → jwt.verify(token, JWT_SECRET) → decodes token → gets { id, email, name, role }
#     → Sets req.user = { id, email, name, role }
#     → Calls next() → passes control to getMe()
#
#  6. backend/controllers/authController.js  → getMe()
#     → SELECT id, name, email, role FROM users WHERE id = $1 (uses req.user.id)
#     → Sends 200 response: { success: true, user: {...} }
#
# [FRONTEND - BACK]
#  7. AuthContext.jsx
#     → setUser(res.data.user) ← restores the user into global state
#     → setLoading(false) ← loading is done!
#
#  8. frontend/src/App.jsx
#     → loading is now false → stops showing spinner
#     → user is now set → route guard allows /dashboard → user sees their dashboard!
#
# ★ If token is EXPIRED or INVALID:
#     → jwt.verify() throws an error in protect middleware
#     → Backend sends 401 response
#     → AuthContext catches the error → localStorage.removeItem('token') → setUser(null)
#     → App.jsx sees user=null → redirects to /login
#
# DATABASE TABLES AFFECTED: users (SELECT only)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 4: ROUTE PROTECTION (Auth Guards in React Router)
# ══════════════════════════════════════════════════════════════════════════════
#
# WHAT THIS DOES: Prevents guest users from accessing /dashboard directly in the URL bar.
#                 Prevents logged-in users from seeing /login and /signup (redirects to dashboard).
#
# FILE: frontend/src/App.jsx
#
# HOW IT WORKS:
#
#   // If user is logged in AND tries to go to /login → redirect to /dashboard
#   <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
#
#   // If user is NOT logged in AND tries to go to /dashboard → redirect to /login
#   <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
#
# THE ROLE OF loading VARIABLE:
#   → loading = true  means: "We are still checking if there's a valid token. DON'T redirect yet!"
#   → loading = false means: "Check is complete. Now apply the route guards."
#
#   if (loading) {
#     return <Spinner />; // Wait here, don't make wrong redirect decisions
#   }
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 5: LOGOUT
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: User clicks "Logout" button anywhere in the app.
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND only — NO API CALL NEEDED]
#  1. Component calls logout() from AuthContext (via useAuth hook)
#
#  2. frontend/src/context/AuthContext.jsx  → logout()
#     → localStorage.removeItem('token')  ← Destroys the stored JWT token
#     → setUser(null) ← Wipes user from React global state
#
#  3. App.jsx re-renders
#     → user is now null
#     → Route guard: user=null on /dashboard → <Navigate to="/login" />
#     → User is instantly redirected to the login page
#
# WHY NO API CALL?
#   JWT tokens are stateless — the backend doesn't store session info.
#   Simply deleting the token from localStorage is enough.
#   The old token becomes "orphaned" — even if someone finds it, it expires in 30 days.
#
# DATABASE TABLES AFFECTED: None
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 6: GET ALL COMPANIES (Company Explorer List)
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: User navigates to /companies page (to be built in frontend).
#              The page needs to fetch all companies from the backend.
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. Companies page component (to be built)
#     → On mount, calls: api.get('/companies')
#
#  2. frontend/src/services/api.js  → Axios interceptor
#     → If user is logged in → adds Authorization header (optional for this public route)
#     → Sends HTTP GET to: http://localhost:5000/api/companies
#
# [BACKEND]
#  3. backend/index.js
#     → app.use('/api/companies', companyRoutes) → forwards to companyRoutes.js
#
#  4. backend/routes/companyRoutes.js
#     → router.get('/', getCompanies) → NO middleware (public) → calls getCompanies()
#
#  5. backend/controllers/companyController.js  → getCompanies()
#     → SELECT * FROM companies ORDER BY name ASC
#     → Returns list of all companies as JSON array
#     → Sends 200 response: { success: true, companies: [...] }
#
# [FRONTEND - BACK]
#  6. Companies page component
#     → receives companies array
#     → Renders each company as a card on screen
#
# DATABASE TABLES AFFECTED: companies (SELECT only)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 7: GET SINGLE COMPANY DETAILS + ANALYTICS
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: User clicks on a company card (e.g. "Google") from the companies list.
#              URL changes to /companies/1 (where 1 is Google's database ID).
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. Company detail page component (to be built)
#     → Reads company ID from URL params: const { id } = useParams()
#     → Calls: api.get(`/companies/${id}`)
#     → Sends HTTP GET to: http://localhost:5000/api/companies/1
#
# [BACKEND]
#  2. backend/routes/companyRoutes.js
#     → router.get('/:id', getCompanyById) → :id captures "1" from URL → calls getCompanyById()
#
#  3. backend/controllers/companyController.js  → getCompanyById()
#     → Query 1: SELECT * FROM companies WHERE id = $1  → gets company info
#     → Query 2: SELECT rounds, questions, result FROM experiences WHERE company_id = $1
#       → gets ALL experiences shared for this company
#     → Calculates ANALYTICS from the experiences data:
#         - totalExperiences (how many people shared their story)
#         - successRate (% of people who got Selected)
#         - averageRounds (avg number of interview rounds)
#         - mostAskedTopics (which topics appear most in the questions JSONB column)
#     → Sends 200 response: { success: true, company: {...}, analytics: {...} }
#
# [FRONTEND - BACK]
#  4. Company detail page
#     → Displays company name, description
#     → Displays analytics: success rate bar, topic frequency chart, avg rounds badge
#
# DATABASE TABLES AFFECTED: companies (SELECT), experiences (SELECT for analytics)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 8: GET PLACEMENT EXPERIENCES FEED
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: User visits /experiences page to read interview stories shared by other students.
#              Can search by keyword, filter by company, role, or result (Selected/Rejected).
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. Experiences feed page (to be built)
#     → Calls: api.get('/experiences')  (with optional query params)
#     → Example with filters: api.get('/experiences?company_id=1&result=Selected&q=graphs')
#     → Sends HTTP GET to: http://localhost:5000/api/experiences
#
#  2. api.js interceptor
#     → If logged in → adds Authorization header → backend can show "has_upvoted" flag
#     → If guest → no token → backend still works, just shows has_upvoted=false for all
#
# [BACKEND]
#  3. backend/routes/experienceRoutes.js
#     → router.get('/', protectOptional, getExperiences)
#     → protectOptional middleware runs FIRST (but doesn't block request if no token)
#
#  4. backend/middleware/authMiddleware.js  → protectOptional()
#     → If token exists → decodes it, sets req.user (for has_upvoted check)
#     → If no token → skips silently, calls next() anyway
#
#  5. backend/controllers/experienceController.js  → getExperiences()
#     → Reads query params: company_id, role, result, q (search keyword)
#     → Builds a dynamic SQL query with conditional WHERE clauses:
#         - ?company_id=1   → AND e.company_id = 1
#         - ?result=Selected → AND e.result = 'Selected'
#         - ?q=graphs       → AND (company name OR role OR rounds text OR questions text ILIKE '%graphs%')
#     → Joins experiences + companies + users tables
#     → Checks EXISTS(experience_upvotes) to tell if current user already upvoted each post
#     → Sends 200 response: { success: true, count: 5, experiences: [...] }
#
# DATABASE TABLES AFFECTED: experiences (SELECT), companies (JOIN), users (JOIN), experience_upvotes (EXISTS check)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 9: SUBMIT A PLACEMENT EXPERIENCE
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: Logged-in student fills a form to share their interview experience.
#              REQUIRES LOGIN — guests cannot post.
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. Submit Experience form page (to be built)
#     → Calls: api.post('/experiences', { company_name, role, result, rounds, questions })
#     → rounds = [ { round_name: "Online Assessment", content: "2 DSA questions" }, ... ]
#     → questions = [ { topic: "Arrays", question: "Two Sum", difficulty: "Easy" }, ... ]
#
#  2. api.js interceptor
#     → Token found → adds "Authorization: Bearer eyJ..." header ← REQUIRED for this route
#     → Sends HTTP POST to: http://localhost:5000/api/experiences
#
# [BACKEND]
#  3. backend/routes/experienceRoutes.js
#     → router.post('/', protect, createExperience)
#     → protect middleware runs FIRST → if no token → 401 error → request BLOCKED
#
#  4. backend/middleware/authMiddleware.js  → protect()
#     → Decodes token → sets req.user = { id, email, name, role }
#     → Calls next()
#
#  5. backend/controllers/experienceController.js  → createExperience()
#     → If company_id provided → uses it directly
#     → If only company_name provided → looks up company in DB
#        → If company exists → uses its ID
#        → If NOT exists → creates a new company row dynamically (INSERT INTO companies)
#     → Converts rounds and questions arrays to JSON strings (JSONB storage)
#     → INSERT INTO experiences (user_id, company_id, role, result, rounds, questions)
#     → user_id comes from req.user.id (from the decoded JWT token, never from frontend)
#     → Sends 201 response: { success: true, experience: {...} }
#
# DATABASE TABLES AFFECTED: experiences (INSERT), companies (SELECT or INSERT if new)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 10: UPVOTE / UN-UPVOTE AN EXPERIENCE (Toggle)
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: Logged-in student clicks the 👍 upvote button on an experience post.
#              If already upvoted → removes the upvote (toggle behavior).
#              REQUIRES LOGIN.
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. Experience card component (to be built)
#     → User clicks upvote button
#     → Calls: api.post(`/experiences/${experienceId}/upvote`)
#     → Token added by interceptor
#     → Sends HTTP POST to: http://localhost:5000/api/experiences/abc-uuid/upvote
#
# [BACKEND]
#  2. backend/routes/experienceRoutes.js
#     → router.post('/:id/upvote', protect, toggleUpvoteExperience)
#     → protect middleware → verifies token → sets req.user
#
#  3. backend/controllers/experienceController.js  → toggleUpvoteExperience()
#     → expId = req.params.id  (UUID of the experience)
#     → userId = req.user.id   (who is clicking)
#     → Checks: SELECT 1 FROM experience_upvotes WHERE user_id=$1 AND experience_id=$2
#     → If upvote EXISTS (already liked):
#         → DELETE FROM experience_upvotes  (removes the row)
#         → decrements upvote count
#         → hasUpvoted = false
#     → If upvote NOT exists (first time liking):
#         → INSERT INTO experience_upvotes  (adds the row)
#         → increments upvote count
#         → hasUpvoted = true
#     → UPDATE experiences SET upvotes = newCount  (caches the count)
#     → Sends 200 response: { success: true, hasUpvoted: true/false, upvotes: 15 }
#
# [FRONTEND - BACK]
#  4. Experience card component
#     → Updates the upvote button state and count number in real-time (no page refresh)
#
# DATABASE TABLES AFFECTED:
#   experience_upvotes (INSERT or DELETE), experiences (UPDATE upvotes count)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 11: UPDATE USER PROFILE (Target Company, Readiness Score)
# ══════════════════════════════════════════════════════════════════════════════
#
# USER ACTION: Student selects their target company or updates readiness score on Dashboard.
#              REQUIRES LOGIN.
#
# STEP-BY-STEP FLOW:
#
# [FRONTEND]
#  1. Dashboard component (to be built)
#     → User picks a company from a dropdown → calls updateProfile({ target_company: "Google" })
#
#  2. frontend/src/context/AuthContext.jsx  → updateProfile()
#     → Calls: api.put('/auth/me', { target_company: "Google" })
#     → Token added by interceptor
#     → Sends HTTP PUT to: http://localhost:5000/api/auth/me
#
# [BACKEND]
#  3. backend/routes/authRoutes.js
#     → router.put('/me', protect, updateMe) → protect middleware → calls updateMe()
#
#  4. backend/controllers/authController.js  → updateMe()
#     → Reads { target_company, readiness_score } from req.body
#     → Dynamically builds UPDATE query (only updates fields that were sent)
#     → UPDATE users SET target_company=$1, updated_at=NOW() WHERE id=$2
#     → Uses req.user.id from JWT (user cannot fake their own ID)
#     → Sends 200 response: { success: true, user: { ...updatedUser } }
#
# [FRONTEND - BACK]
#  5. AuthContext.jsx  → setUser(res.data.user) ← updates global user state with new data
#     → Dashboard re-renders with new target company displayed
#
# DATABASE TABLES AFFECTED: users (UPDATE)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# COMPLETE DATABASE TABLES SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
#
# Table Name             | What it Stores
# ───────────────────────┼────────────────────────────────────────────────────
# users                  | All registered user accounts (id, name, email, password_hash, target_company)
# student_profiles       | Extended student info (college, CGPA, graduation year, GitHub, LinkedIn)
# coding_profiles        | Links a user to their coding platform profiles (parent table)
# coding_platform_stats  | Per-platform stats (LeetCode solved count, Codeforces rating, etc.)
# companies              | All target companies (Google, Microsoft, etc.)
# skills                 | All skills/topics (Arrays, DBMS, Operating Systems, etc.)
# user_skills            | Junction: which users have which skills (M:N)
# company_skills         | Junction: which companies require which skills (M:N)
# experiences            | Placement interview stories shared by students (with JSONB rounds & questions)
# experience_upvotes     | Junction: which users upvoted which experiences (M:N toggle)
# comments               | Comments left on placement experience posts
# mock_interviews        | AI mock interview sessions (stores chat history as JSONB)
# interview_feedbacks    | AI-generated feedback scores after completing a mock interview (1:1 with mock_interviews)
# roadmaps               | AI-generated study roadmaps stored per user
# resumes                | Resume files uploaded by user (with AI analysis: strengths, weaknesses, suggestions)
# applications           | Job application tracker (company, role, status: Applied/OA/Interviewing/Selected/Rejected)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE 12: AI MOCK INTERVIEWS & SCORECARD PIPELINE
# ══════════════════════════════════════════════════════════════════════════════
#
# DESCRIPTION: Allows logged-in students to practice interviews with a company-specific, 
#              role-specific, and difficulty-adapted AI interviewer (Gemini).
#              At the end of a 5-question chat, it calculates domain scores and feedback.
#
# STEP-BY-STEP CHRONOLOGICAL FLOW:
#
#   [PHASE 1: SESSION INITIATION]
#     Candidate selects Company, Role, Difficulty on UI
#     └── clicks "Start Interview"
#         └── Sends HTTP POST to: /api/mock-interviews
#             ├── Backend creates new session row in mock_interviews (status: 'in_progress', chat_history: '[]')
#             ├── Backend calls geminiService to generate the 1st Interview Question (Q1)
#             ├── Backend appends Q1 to chat_history: [{ role: 'model', text: Q1 }]
#             ├── Backend updates DB row with Q1
#             └── Sends 201 Response back to React containing the Q1 question
#
#   [PHASE 2: CONVERSATION LOOP (Turns 1 to 4)]
#     Candidate types answer and clicks "Send"
#     └── Sends HTTP POST to: /api/mock-interviews/:id/message with body: { message: "answer text" }
#         ├── Backend retrieves session and pushes candidate message: { role: 'user', text: "answer text" }
#         ├── Backend counts user responses in history using a 'for' loop
#         ├── IF responses < 5:
#         │   ├── Call geminiService to read history and generate the next adaptive question (Q_next)
#         │   ├── Append Q_next to history: { role: 'model', text: Q_next }
#         │   ├── Save updated history to DB
#         │   └── Sends 200 Response back to React containing the new question
#         └── (Repeat for questions 2, 3, and 4)
#
#   [PHASE 3: FINAL ANSWER & AI EVALUATION (Turn 5)]
#     Candidate types final answer and clicks "Send"
#     └── Sends HTTP POST to: /api/mock-interviews/:id/message (5th user message)
#         ├── Backend retrieves session and pushes 5th answer to history
#         ├── Count = 5 (Max reached!)
#         ├── Save completed history to DB (so transcript is fully stored)
#         ├── Call geminiService.evaluateInterview() to analyze transcript
#         │   └── Gemini evaluates DSA, OS, DBMS, CN scores and returns a structured JSON object
#         ├── Insert scorecard row in interview_feedbacks (dsa_score, os_score, CN/OS/DBMS scores, feedback_details, weak_areas)
#         ├── Update mock_interviews.status = 'completed'
#         ├── Update users.readiness_score = overall_score (updates dashboard metrics)
#         └── Sends 200 Response back to React containing the finished session and final scorecard
#
# DATABASE TABLES AFFECTED:
#   mock_interviews (INSERT/UPDATE), interview_feedbacks (INSERT), users (UPDATE readiness_score)
#
# ══════════════════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════════════════
# WHAT IS BUILT vs WHAT IS PENDING
# ══════════════════════════════════════════════════════════════════════════════
#
# ✅ BUILT (Backend API + DB ready):
#   - User Registration (POST /api/auth/register)
#   - User Login (POST /api/auth/login)
#   - Session Restore (GET /api/auth/me)
#   - Update Profile (PUT /api/auth/me)
#   - Get All Companies (GET /api/companies)
#   - Get Company + Analytics (GET /api/companies/:id)
#   - Get Experiences Feed + Search (GET /api/experiences)
#   - Get Single Experience (GET /api/experiences/:id)
#   - Submit Experience (POST /api/experiences)
#   - Toggle Upvote (POST /api/experiences/:id/upvote)
#   - Start Mock Interview (POST /api/mock-interviews)
#   - Send Chat Message & Evaluate (POST /api/mock-interviews/:id/message)
#   - Retrieve Mock Interview (GET /api/mock-interviews/:id)
#   - Generate Study Roadmap (POST /api/roadmaps)
#   - Get Roadmaps History (GET /api/roadmaps)
#   - Get Specific Roadmap (GET /api/roadmaps/:id)
#   - Delete Roadmap (DELETE /api/roadmaps/:id)
#   - Auth Middleware (protect, protectOptional, adminOnly)
#   - Database Schema (16 tables)
#   - Seed Data
#   - Frontend: LandingPage, Login, Signup, Dashboard, Companies, CompanyDetail, Experiences, ExperienceDetail, SubmitExperience, MockInterview, Roadmap, AuthContext, api.js, App.jsx routing
#
# 🔲 PENDING (Frontend pages to build):
#   - ResumeEvaluator.jsx (PDF upload + AI analysis)
#   - ApplicationTracker.jsx (Kanban/table of job applications)
#
# ══════════════════════════════════════════════════════════════════════════════
