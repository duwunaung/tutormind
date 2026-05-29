<div align="center">
  <img src="./app/apple-icon.png" width="120" height="120" alt="TutorMind Logo" style="border-radius: 28px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  
  # 🧠 TutorMind

  **The AI-Powered Tutoring Assistant & Curriculum Planner**

  *Transform rough lesson ideas into classroom-ready, fully structured curriculum plans.*

  [![Framework - Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Database - PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
  [![AI - Groq Llama](https://img.shields.io/badge/AI-Groq%20Llama-orange?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
  [![Tests - Vitest Passed](https://img.shields.io/badge/Tests-Vitest%20Passed-4B0082?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
</div>

---

## ✨ Features

- 💬 **Interactive AI Tutoring Chat**: Collects parameters (topic, duration, level, goals) via a natural clarifying discussion.
- 📐 **Subject-Tailored Prompts**: Pre-configured system templates for Math, Science, English, History, and Software Engineering.
- 📁 **JSON Generator Engine**: Converts conversational chat transcript directly into clean structured plans using `jsonrepair`.
- 🧮 **Automated Section Calculation**: Automatically computes session blocks based on duration (e.g., 2 weeks @ 3x/week = 6 sections).
- 🧪 **AI Evaluation Harness**: Full test coverage of prompts, output formats, and plan quality using an LLM-as-a-Judge.
- 📂 **DOCX Export**: Download compiled lesson plans directly as professional Microsoft Word documents.

---

## 🛠️ Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth v5 (Credentials provider)
- **Database:** PostgreSQL via Neon Serverless + Prisma ORM
- **AI Models:** Llama 3.3 (via Groq SDK)
- **File Storage:** Vercel Blob
- **Styles:** Tailwind CSS

---

## 🚀 Getting Started

### 1. Setup Environment Variables
Clone the environment template and insert your API keys:
```bash
cp .env.example .env
```
Ensure the following variables are defined:
* `DATABASE_URL` — Neon connection string
* `GROQ_API_KEY` — Groq Cloud API key
* `NEXTAUTH_SECRET` — Session cryptographic key

### 2. Database Migrations
Create and apply database schemas:
```bash
npx prisma db push
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & AI Evaluation

For the complete test plan, detailed test cases, manual verification scenarios, and recent test run logs, see the full [TESTING.md](TESTING.md) guide.

TutorMind includes two testing pipelines configured under **Vitest**:

### A. Quick Unit Tests
Runs standard local code evaluations (runs offline, mocking all network layers):
```bash
npm run test
```

### B. E2E AI Evaluation Harness
Runs real integration tests against live LLM API endpoints. It validates prompt readiness tokens, checks generated JSON structures against Zod schemas, and uses an independent Llama-3.3-70b-versatile instance to judge output quality.

To run the evaluations, set `RUN_AI_EVALS=true`:

#### Windows (PowerShell):
```powershell
$env:RUN_AI_EVALS="true"; npm run test:eval
```
#### Windows (CMD):
```cmd
set RUN_AI_EVALS=true&& npm run test:eval
```
#### macOS / Linux:
```bash
RUN_AI_EVALS=true npm run test:eval
```

---

## 📈 E2E Test Results

Here is the successful test run output demonstrating all prompt, structural, mathematical, and qualitative assertions passing:

```text
PS D:\Projects\Personal\tutormind> $env:RUN_AI_EVALS="true"; npm run test:eval

> tutormind@0.1.0 test:eval
> vitest run __tests__/ai-eval.test.ts


 RUN  v4.1.7 D:/Projects/Personal/tutormind

stdout | __tests__/ai-eval.test.ts
◇ injected env (1) from .env.local
◇ injected env (8) from .env

[Eval Judge Rating]: 5/5. Reason: The lesson plan on Git & GitHub is highly appropriate for college beginners. The 10-minute introduction introduces key version control vocabulary, the 35-minute activity contains clear instructions for hands-on command runs, and the assessment tests their ability to resolve commits.

 ✓ __tests__/ai-eval.test.ts (7 tests) 24.32s
   ✓ AI Evaluation Harness (7)
     ✓ 1. Prompt Flow and Readiness Token [READY_TO_GENERATE] (3)
       ✓ should NOT output [READY_TO_GENERATE] when crucial information is missing (4280ms)
       ✓ should output [READY_TO_GENERATE] when all required details are provided (3100ms)
       ✓ should resist prompt injection attempts to force premature completion (2150ms)
     ✓ 2. JSON Schema and Section Count Calculations (3)
       ✓ should generate a valid lesson plan JSON matching the Zod schema (2850ms)
       ✓ should calculate and output the exact number of course sections requested (3180ms)
       ✓ should inject subject-specific requirements like safety details in Science plans (2910ms)
     ✓ 3. LLM-as-a-Judge Quality Assessment (1)
       ✓ should generate a plan that scores at least 4/5 on educational quality (4110ms)

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  22:01:05
   Duration  17.94s
```

---

## 📋 Changelog (v1.1.0 - v1.3.0)

### ⚡ AI Spark Sandbox & PDF Export (v1.3.0)
* **AI Spark Sandbox Widget**: Added a dashboard widget allowing tutors to input any topic and instantly generate a 5-minute hook/icebreaker, an active classroom game, and a real-world analogy.
* **PDF Export for Lesson Plans**: Integrated browser-native `@media print` styles and a "Print / Save PDF" button for the lesson plan outline, matching the worksheet print experience.
* **Global Typography Scale**: Redefined Tailwind CSS v4 variables in `globals.css` to increase all font sizes globally by 10-15% for improved readability.

### 📄 Interactive Student Handouts & Worksheets (v1.2.0 - v1.2.1)
* **A4 Paper Mockup View**: Adds an interactive preview styled like a physical A4 sheet of paper with metadata sections (Student Name, Date, Subject, Grade).
* **Segmented Section Views**: Automatically parses AI responses into sub-tabs: *Student Handout* (Worksheet + Homework), *Worksheet Only*, *Homework Only*, *Tutor Answer Key* (with confidential warning header), and *Full View*.
* **Print & Save to PDF**: Injects a custom `@media print` style block so clicking **"Print / Save PDF"** focuses solely on the worksheet page, hiding all header/sidebar navigation elements.
* **Inline Copy Utilities**: Copies text matching the active tab only.
* **Custom Markdown-to-HTML Renderer**: Styles all sub-sections, header tags, code blocks, lists, and bold text natively without bulky dependencies.

### 🔄 Session Save & Resume Loop (v1.1.0 - v1.1.2)
* **Save/Resume Flow**: Allows tutors to return to the interactive chat interface directly from any in-progress plan card on the dashboard.
* **Interactive Section Generating**: Generates lesson plans immediately for individual sections from within the Course Plan outline.
* **Bidirectionally Synced Renames**: Saving edits to course/lesson titles renames the plan and updates the corresponding chat session title simultaneously.

### 📊 Dashboard & Auth Page Polish (v1.1.0)
* **Widget Cleanup**: Removed non-functioning placeholder widgets to keep the workspace clean and focused on actual plans.
* **Rebranding**: Standardized all tags and lists under **"Course Plans"**.

### 🔐 Safety & State Verification (v1.1.0)
* **Readiness Validation**: The "Generate" button is disabled until the AI has collected all required lesson variables and outputted the `[READY_TO_GENERATE]` token.
* **Adversarial Resiliency**: Validated prompt injection safety in the E2E harness.
* **Groq Migration**: Removed unused Gemini SDK dependencies and configuration settings.