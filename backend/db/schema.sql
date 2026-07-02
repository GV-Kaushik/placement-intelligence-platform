-- Enable gen_random_uuid() function if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if they exist (clean setup)
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS company_skills CASCADE;
DROP TABLE IF EXISTS coding_platform_stats CASCADE;
DROP TABLE IF EXISTS coding_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS roadmaps CASCADE;
DROP TABLE IF EXISTS interview_feedbacks CASCADE;
DROP TABLE IF EXISTS mock_interviews CASCADE;
DROP TABLE IF EXISTS experience_upvotes CASCADE;
DROP TABLE IF EXISTS experiences CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    target_company VARCHAR(100) DEFAULT NULL,
    readiness_score INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student Profiles Table
CREATE TABLE student_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    college_name VARCHAR(255),
    cgpa NUMERIC(4,2),
    graduation_year INTEGER,
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Coding Profiles Table
CREATE TABLE coding_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Coding Platform Stats Table (Option 2 - Dynamic 1:N Sub-table)
CREATE TABLE coding_platform_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coding_profile_id UUID REFERENCES coding_profiles(id) ON DELETE CASCADE,
    platform_name VARCHAR(100) NOT NULL, -- 'LeetCode', 'Codeforces', etc.
    username VARCHAR(100) NOT NULL,
    solved_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Companies Table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Skills Table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'DSA', 'CS Core', 'Development'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Skills Junction Table (M:N Link)
CREATE TABLE user_skills (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

-- 8. Company Skills Junction Table (M:N Link)
CREATE TABLE company_skills (
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, skill_id)
);

-- 9. Experiences Table (Option B - Dynamic JSONB Rounds)
CREATE TABLE experiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    result VARCHAR(50) NOT NULL,
    rounds JSONB DEFAULT '[]', -- Array of { round_name, content }
    questions JSONB DEFAULT '[]', -- Array of { topic, question, difficulty }
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Upvotes Junction Table (M:N Link)
CREATE TABLE experience_upvotes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, experience_id)
);

-- 11. Comments Table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Mock Interviews Table
CREATE TABLE mock_interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    chat_history JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Interview Feedback Table (1:1 Link)
CREATE TABLE interview_feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mock_interview_id UUID REFERENCES mock_interviews(id) ON DELETE CASCADE UNIQUE,
    dsa_score INTEGER NOT NULL,
    os_score INTEGER NOT NULL,
    dbms_score INTEGER NOT NULL,
    cn_score INTEGER NOT NULL,
    overall_score INTEGER NOT NULL,
    feedback_details TEXT NOT NULL,
    weak_areas JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Roadmaps Table
CREATE TABLE roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_company VARCHAR(100) NOT NULL,
    days_available INTEGER NOT NULL,
    roadmap_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Resumes Table
CREATE TABLE resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    parsed_text TEXT,
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Applications Table
CREATE TABLE applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Applied', -- 'Applied', 'OA', 'Interviewing', 'Selected', 'Rejected'
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
