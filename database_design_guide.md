# PlaceMentor AI - Database Design & System Architecture Guide

This guide details the complete database design for the **PlaceMentor AI** placement preparation platform. It contains the schema layout, entity segregations, relationship cardinalities (1:1, 1:N, M:N), SQL constraint definitions, and how these relationships translate to real-world user actions on the frontend.

---

## 🗺️ Entity-Relationship (ER) Diagram

Below is the complete entity-relationship mapping for all 16 tables. It specifies exact column names, data types, key constraints, and cardinalities.

```mermaid
erDiagram
    USERS ||--|| STUDENT_PROFILES : "has (1:1)"
    USERS ||--|| CODING_PROFILES : "has (1:1)"
    CODING_PROFILES ||--|{ CODING_PLATFORM_STATS : "tracks (1:N)"
    
    USERS ||--|{ EXPERIENCES : "submits (1:N)"
    COMPANIES ||--|{ EXPERIENCES : "associated_with (1:N)"
    
    USERS ||--|{ EXPERIENCE_UPVOTES : "likes (1:N)"
    EXPERIENCES ||--|{ EXPERIENCE_UPVOTES : "liked_by (1:N)"
    
    USERS ||--|{ COMMENTS : "writes (1:N)"
    EXPERIENCES ||--|{ COMMENTS : "commented_on (1:N)"
    
    USERS ||--|{ USER_SKILLS : "has_skill (1:N)"
    SKILLS ||--|{ USER_SKILLS : "skill_of (1:N)"
    
    COMPANIES ||--|{ COMPANY_SKILLS : "demands_skill (1:N)"
    SKILLS ||--|{ COMPANY_SKILLS : "skill_required_by (1:N)"
    
    USERS ||--|{ MOCK_INTERVIEWS : "takes (1:N)"
    MOCK_INTERVIEWS ||--|| INTERVIEW_FEEDBACKS : "evaluates (1:1)"
    
    USERS ||--|{ ROADMAPS : "generates (1:N)"
    USERS ||--|{ RESUMES : "analyzes (1:N)"
    
    USERS ||--|{ APPLICATIONS : "manages (1:N)"
    COMPANIES ||--|{ APPLICATIONS : "applied_to (1:N)"

    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role
        varchar target_company
        int readiness_score
        timestamp created_at
        timestamp updated_at
    }

    STUDENT_PROFILES {
        uuid id PK
        uuid user_id FK_UK
        varchar college_name
        numeric cgpa
        int graduation_year
        varchar github_url
        varchar linkedin_url
        timestamp created_at
    }

    CODING_PROFILES {
        uuid id PK
        uuid user_id FK_UK
        timestamp created_at
    }

    CODING_PLATFORM_STATS {
        uuid id PK
        uuid coding_profile_id FK
        varchar platform_name
        varchar username
        int solved_count
        int rating
        timestamp updated_at
    }

    COMPANIES {
        int id PK
        varchar name UK
        text description
        varchar logo_url
        timestamp created_at
    }

    SKILLS {
        int id PK
        varchar name UK
        varchar category
        timestamp created_at
    }

    USER_SKILLS {
        uuid user_id PK_FK
        int skill_id PK_FK
    }

    COMPANY_SKILLS {
        int company_id PK_FK
        int skill_id PK_FK
    }

    EXPERIENCES {
        uuid id PK
        uuid user_id FK
        int company_id FK
        varchar role
        varchar result
        jsonb rounds
        jsonb questions
        int upvotes
        timestamp created_at
    }

    EXPERIENCE_UPVOTES {
        uuid user_id PK_FK
        uuid experience_id PK_FK
    }

    COMMENTS {
        uuid id PK
        uuid user_id FK
        uuid experience_id FK
        text comment_text
        timestamp created_at
    }

    MOCK_INTERVIEWS {
        uuid id PK
        uuid user_id FK
        varchar company_name
        varchar role
        varchar difficulty
        varchar status
        jsonb chat_history
        timestamp created_at
    }

    INTERVIEW_FEEDBACKS {
        uuid id PK
        uuid mock_interview_id FK_UK
        int dsa_score
        int os_score
        int dbms_score
        int cn_score
        int overall_score
        text feedback_details
        jsonb weak_areas
        timestamp created_at
    }

    ROADMAPS {
        uuid id PK
        uuid user_id FK
        varchar target_company
        int days_available
        jsonb roadmap_data
        timestamp created_at
    }

    RESUMES {
        uuid id PK
        uuid user_id FK
        varchar file_name
        text parsed_text
        jsonb strengths
        jsonb weaknesses
        jsonb suggestions
        timestamp created_at
    }

    APPLICATIONS {
        uuid id PK
        uuid user_id FK
        int company_id FK
        varchar role
        varchar status
        timestamp applied_at
    }
```

---

## 🗄️ PART 1: The Entities (The "Nouns")

Entities represent real-world objects, events, or documents. In the database, each entity is represented as a table with a unique Primary Key (`PK`).

### A. Strong Entities (Independent Tables)
These tables store core data that exists on its own without requiring any parent record:

1.  **`users` Table**:
    *   *Signifies*: Represents a registered user/student account.
    *   *Reflected in DB*: `id UUID PRIMARY KEY`, `email VARCHAR UNIQUE` (prevents duplicate registrations).
2.  **`companies` Table**:
    *   *Signifies*: Represents a hiring company (e.g., Amazon, Google).
    *   *Reflected in DB*: `id SERIAL PRIMARY KEY`, `name VARCHAR UNIQUE` (ensures company names are unique).
3.  **`skills` Table**:
    *   *Signifies*: Represents technical/coding topics (e.g., OS, Graphs, React).
    *   *Reflected in DB*: `id SERIAL PRIMARY KEY`, `name VARCHAR UNIQUE`.
4.  **`mock_interviews` Table**:
    *   *Signifies*: Represents a practice interview session started by a student.
    *   *Reflected in DB*: `id UUID PRIMARY KEY`, `chat_history JSONB` (retains the dialogue log between the user and Gemini).
5.  **`roadmaps` Table**:
    *   *Signifies*: Represents a week-by-week study plan generated by the AI.
    *   *Reflected in DB*: `id UUID PRIMARY KEY`, `roadmap_data JSONB` (stores the weekly details).
6.  **`resumes` Table**:
    *   *Signifies*: Represents a resume evaluation report.
    *   *Reflected in DB*: `id UUID PRIMARY KEY`, `parsed_text TEXT`.

### B. Weak Entities (Dependent Tables)
These tables represent objects that exist **only** because a parent record exists. In the database, they are reflected using a **Foreign Key (`[FK]`) with `ON DELETE CASCADE`** (so if the parent is deleted, the weak entity is deleted too).

7.  **`student_profiles` Table**:
    *   *Signifies*: Detailed educational/profile info of a student.
    *   *Reflected in DB*: `user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE`.
8.  **`coding_profiles` Table**:
    *   *Signifies*: A student's coding profile anchor.
    *   *Reflected in DB*: `user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE`.
9.  **`coding_platform_stats` Table**:
    *   *Signifies*: Sub-stats for a single platform (e.g. LeetCode rating).
    *   *Reflected in DB*: `coding_profile_id UUID REFERENCES coding_profiles(id) ON DELETE CASCADE`.
10. **`interview_feedbacks` Table**:
    *   *Signifies*: The evaluation card for a mock interview.
    *   *Reflected in DB*: `mock_interview_id UUID REFERENCES mock_interviews(id) ON DELETE CASCADE UNIQUE`.
11. **`experiences` Table**:
    *   *Signifies*: An interview review. It relies on both a user and a company.
    *   *Reflected in DB*: `user_id UUID REFERENCES users(id) ON DELETE CASCADE`, `company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`.
12. **`comments` Table**:
    *   *Signifies*: A message left under an experience review.
    *   *Reflected in DB*: `experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE`.
13. **`applications` Table**:
    *   *Signifies*: An active job application tracking card.
    *   *Reflected in DB*: `user_id UUID REFERENCES users(id) ON DELETE CASCADE`.

---

## 🔗 PART 2: The Relationships & SQL Reflections

Relationships connect tables together. In SQL, they are implemented using **Foreign Keys** and **Junction Tables**.

### 1. One-to-One Relationships (1:1)
One row in Table A matches exactly one row in Table B.
*   **How it is Reflected in DB**: We place a **`UNIQUE` constraint** on the Foreign Key column. This ensures no two rows in the child table can point to the same parent row.

*   **`users` ── `student_profiles`**:
    *   *SQL Reflection*: `user_id UUID REFERENCES users(id) UNIQUE`
*   **`users` ── `coding_profiles`**:
    *   *SQL Reflection*: `user_id UUID REFERENCES users(id) UNIQUE`
*   **`mock_interviews` ── `interview_feedbacks`**:
    *   *SQL Reflection*: `mock_interview_id UUID REFERENCES mock_interviews(id) UNIQUE`

### 2. One-to-Many Relationships (1:N)
One row in Table A can connect to multiple rows in Table B, but a row in Table B belongs to only one row in Table A.
*   **How it is Reflected in DB**: The child table contains a standard **Foreign Key (`REFERENCES`)** *without* a Unique constraint. This allows multiple child rows to store the same parent ID.

*   **`users` ── `experiences`**:
    *   *SQL Reflection*: `experiences.user_id UUID REFERENCES users(id)` (A user writes many reviews).
*   **`companies` ── `experiences`**:
    *   *SQL Reflection*: `experiences.company_id INTEGER REFERENCES companies(id)` (A company has many reviews).
*   **`experiences` ── `comments`**:
    *   *SQL Reflection*: `comments.experience_id UUID REFERENCES experiences(id)` (A review has many comments).
*   **`users` ── `comments`**:
    *   *SQL Reflection*: `comments.user_id UUID REFERENCES users(id)` (A user writes many comments).
*   **`users` ── `mock_interviews`**:
    *   *SQL Reflection*: `mock_interviews.user_id UUID REFERENCES users(id)`.
*   **`coding_profiles` ── `coding_platform_stats`**:
    *   *SQL Reflection*: `coding_platform_stats.coding_profile_id UUID REFERENCES coding_profiles(id)`.
*   **`users` ── `applications`**:
    *   *SQL Reflection*: `applications.user_id UUID REFERENCES users(id)` (A user tracks many job applications).
*   **`companies` ── `applications`**:
    *   *SQL Reflection*: `applications.company_id INTEGER REFERENCES companies(id)`.

### 3. Many-to-Many Relationships (M:N)
Multiple rows in Table A can connect to multiple rows in Table B.
*   **How it is Reflected in DB**: Enforced via a **Junction Table** (or bridge table) that contains two foreign keys pointing to both parent tables. The composite Primary Key of this table is made of `(key_A, key_B)`.

*   **`users` ◄ M:N ► `experiences` (Liking Reviews)**:
    *   *Junction Table*: `experience_upvotes`
    *   *SQL Reflection*: 
        ```sql
        CREATE TABLE experience_upvotes (
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, experience_id) -- Composite PK: prevents duplicate likes
        );
        ```
*   **`users` ◄ M:N ► `skills` (Student Skills)**:
    *   *Junction Table*: `user_skills`
    *   *SQL Reflection*:
        ```sql
        CREATE TABLE user_skills (
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, skill_id)
        );
        ```
*   **`companies` ◄ M:N ► `skills` (Company Skill Requirements)**:
    *   *Junction Table*: `company_skills`
    *   *SQL Reflection*:
        ```sql
        CREATE TABLE company_skills (
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
            PRIMARY KEY (company_id, skill_id)
        );
        ```

---

## 🖥️ PART 3: Frontend Action Mapping (How it behaves in UI)

Here is how these PK/FK relationships manifest as real user actions on the frontend:

1.  **User signs up**: Inserts a row in `users`. The website then prompts them: *"Fill out your education details."* Saving that form inserts a row in `student_profiles` containing their `user_id`. (1:1 Relationship created).
2.  **User writes a review**: The user fills out a form. They select "Amazon" (Company ID `1`). When they click submit, the website inserts a row in `experiences` storing `company_id = 1` and `user_id = <logged_in_user_id>`. (1:N Relationships created).
3.  **User upvotes a review**: The user clicks the Upvote button. The website immediately sends a request to insert a row in `experience_upvotes` containing `(user_id, experience_id)`. (M:N Relationship updated).
4.  **User comments**: Under a review card, a text box allows typing. Submitting it inserts a row in `comments` storing the review's ID (`experience_id`) and the commenter's ID (`user_id`). (1:N Relationships created).
5.  **Student checks application status**: A dashboard kanban board displays columns: *Applied, OA, Interview, Selected*. Moving a company card from *Applied* to *Interview* updates the `status` column in the `applications` table. (1:N Relationship updated).
