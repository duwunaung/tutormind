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

 ✓ __tests__/ai-eval.test.ts (5 tests) 17.52s
   ✓ AI Evaluation Harness (5)
     ✓ 1. Prompt Flow and Readiness Token [READY_TO_GENERATE] (2)
       ✓ should NOT output [READY_TO_GENERATE] when crucial information is missing (4280ms)
       ✓ should output [READY_TO_GENERATE] when all required details are provided (3100ms)
     ✓ 2. JSON Schema and Section Count Calculations (2)
       ✓ should generate a valid lesson plan JSON matching the Zod schema (2850ms)
       ✓ should calculate and output the exact number of course sections requested (3180ms)
     ✓ 3. LLM-as-a-Judge Quality Assessment (1)
       ✓ should generate a plan that scores at least 4/5 on educational quality (4110ms)

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  22:01:05
   Duration  17.94s
```