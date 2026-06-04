# 👥 TutorMind User Acceptance Testing (UAT) Report

This document outlines the **User Acceptance Testing (UAT) Plan, Scenarios, and Results** for **TutorMind**. The scenarios listed below are designed to validate that the application satisfies the requirements of educators and tutors under real-world conditions.

---

## 📖 1. UAT Executive Summary

### 1.1 Objective
User Acceptance Testing ensures that **TutorMind** meets the day-to-day workflow needs of a professional educator:
1. **Ease of Planning**: Streamlining lesson and course planning through a simple, natural conversation.
2. **Output Usability**: Delivering clean, classroom-ready worksheets, homework handouts, and printable answer keys.
3. **Seamless Exporting**: Providing standard Word documents (DOCX) and print-to-PDF options without layout issues.
4. **Reliability**: Saving in-progress work so tutors can resume sessions without data loss.
5. **Security & Synchronization**: Safeguarding teacher answer keys on shared links, and warning tutors when worksheets are out-of-sync with refined plans.

---

## 👥 2. User Roles & Personas

| Role Name | Description | Key Focus Area in UAT |
| :--- | :--- | :--- |
| **New Tutor / Guest** | An educator visiting the site for the first time. | Registration flow, subject selection, onboarding clarity. |
| **Active Tutor / Planner** | An educator who creates, adjusts, and downloads plans. | Interactive AI chat, worksheet generation, PDF/DOCX exporting. |
| **Student / Homework Viewer** | An anonymous student viewing a shared worksheet link. | View student handout and homework tasks, print/download without seeing answers. |

---

## 📊 3. UAT Test Scenario Matrix & Results

All tests were performed on a staging build of TutorMind.

| Scenario ID | Feature Area | User Action | Expected System Behavior | Tester Observation / Verdict | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | Account & Dashboard | Register a new account with a specialty and sign in. | User account created; redirected to Dashboard showing stats widget. | Success. Correct stats (0 plans, selected specialty) rendered immediately. | **PASSED** |
| **UAT-02** | Interactive Chat | Start lesson chat and request "Algebra" without details. | Chat engine requests topic, grade, duration, and goals. Generates questions. | Success. Promptly asked clarification questions; the "Generate" button remained disabled. | **PASSED** |
| **UAT-03** | Readiness Control | Provide all lesson details in the chat. | AI detects full details, outputs `[READY_TO_GENERATE]`, and enables the "Generate" button. | Success. Once all variables were provided, the "Generate Plan" button unlocked immediately. | **PASSED** |
| **UAT-04** | Course Plan Scaling | Request a "3-week course at 2x/week". | System calculates **exactly 6 sessions** and lists them in the course plan structure. | Success. The course plan rendered exactly 6 distinct session blocks with custom objectives. | **PASSED** |
| **UAT-05** | Lesson Customization | Edit lesson titles and objectives in the interactive editor. | Text updates instantly on the screen; saved modifications apply to the DB. | Success. Inline forms allowed quick updates; dashboard cards reflected the updated titles. | **PASSED** |
| **UAT-06** | Worksheet Layout | Generate student worksheet and toggle A4 views. | Formats worksheet markdown into tabs (*Full*, *Worksheet Only*, *Answer Key*) with A4 styling. | Success. The A4 page mockup looked clean. Toggling tabs showed only respective content. | **PASSED** |
| **UAT-07** | Answer Key Warning | Select "Tutor Answer Key" tab. | Displays correct answers and injects a warning header about confidentiality. | Success. Red warning header: "CONFIDENTIAL ANSWER KEY - FOR TUTOR USE ONLY" displayed. | **PASSED** |
| **UAT-08** | Browser PDF Print | Click "Print / Save PDF" on Worksheet page. | Browser print window opens showing only the A4 sheet; navigation UI is hidden. | Success. Sidebars, headers, and buttons were completely hidden in the print preview. | **PASSED** |
| **UAT-09** | Word DOCX Export | Click "Export DOCX" on a course plan. | Generates and downloads a clean, formatted `.docx` file containing all sections. | Success. File downloaded; headings and lists were correctly formatted when opened in Word. | **PASSED** |
| **UAT-10** | Session Resuming | Exit an active chat session mid-way, and click "Resume". | Loads the full message history in the chat sidebar, allowing continuation. | Success. Chat history restored; the AI resumed exactly where the user left off. | **PASSED** |
| **UAT-11** | Public Link Sharing | Click "Share Link" button on worksheet page, enable public access toggle, copy link, and paste into a separate incognito browser tab. | Incognito page loads anonymous student worksheet dashboard. The tutor answer key is completely stripped from both HTML view and API response. | Success. Incognito view loads a clean student dashboard with worksheet and homework. Network inspector confirms answer key is not served in JSON. | **PASSED** |
| **UAT-12** | Handout Sync & Regeneration | Refine a lesson plan with a pre-existing worksheet via the AI chat. Open the Worksheet tab. Click the "Regenerate Handout" button in the warning banner. | Plan is adjusted. The "Worksheets & Handouts" tab shows a pulsing amber dot. The tab view displays an out-of-sync warning banner. Clicking the regenerate button updates the worksheet and clears warnings. | Success. AI refinement was instant and non-blocking. The warning banner allowed triggering regeneration with a single click, successfully updating the worksheet and clearing all warnings. | **PASSED** |

---

## 📝 4. Detailed UAT Walkthroughs & User Journeys

### 🧑‍💻 Journey A: Onboarding & Account Creation
**Goal**: Verify that a new educator can sign up and establish their teaching profile.

#### Step-by-Step Test Procedure
1. Navigate to the **Sign Up** page.
2. Fill out the registration form:
   * **Name**: `Sarah Jenkins`
   * **Email**: `sarah.jenkins@tutormind.edu`
   * **Password**: `TutorSafePassword2026!`
   * **Primary Specialty**: `English / Language Arts`
   * **Default Grade Level**: `Middle School (Grade 6-8)`
3. Click the **Register** button.
4. Sign in with the newly created credentials.

#### 👁️ User Experience Observation
> *"The registration form gave instant validation errors when I typed a short password, which was helpful. Upon signing in, the dashboard was clean and greeted me with 'Welcome, Sarah Jenkins!' displaying a specialty tag of 'English / Language Arts' and an empty state dashboard showing '0 total plans generated'."*

* **Status**: **PASSED**

---

### 💬 Journey B: AI Chat Discussion & Lesson Generation
**Goal**: Verify that the AI conducts a structured interview and blocks plan generation until all required details are clarified.

#### Step-by-Step Test Procedure
1. Click **"New Lesson Plan"** on the dashboard.
2. Select **"English / Language Arts"** as the subject.
3. In the chat box, type: *"I want to teach a lesson on metaphors."* and press send.
4. Observe the AI response. Note if the **"Generate Plan"** button is disabled.
5. In the chat box, type: *"This is for 6th grade, it will be a 45-minute lesson, and the goal is to identify metaphors in poems."*
6. Observe the response and check if the **"Generate Plan"** button is now enabled.
7. Click **"Generate Plan"**.

#### 👁️ User Experience Observation
> *"When I first requested the lesson, the AI responded politely, asking about my grade level, duration, and specific learning objectives. The 'Generate Plan' button in the sidebar was greyed out and disabled. Once I responded with the missing information, the AI generated a confirmation message, the button instantly changed color to active blue, and clicking it rendered the full lesson plan on my screen in less than 3 seconds."*

* **Status**: **PASSED**

---

### 📄 Journey C: Worksheet Layout & A4 Document Print Verification
**Goal**: Verify that the tutor can view segmented worksheet data and print a student handout without developer command tools.

```
+--------------------------------------------------------------+
|                     TutorMind Workspace                      |
|                                                              |
| [Full View]  [Worksheet Only]  [Answer Key]  [Export DOCX]   |
|                                                              |
| +----------------------------------------------------------+ |
| |                    STUDENT WORKSHEET                     | |
| | Name: ____________________     Date: __________________   | |
| | Subject: English               Grade: 6                  | |
| |                                                          | |
| | 1. Identify the metaphor in this sentence:               | |
| |    "The classroom was a zoo during recess."              | |
| |                                                          | |
| +----------------------------------------------------------+ |
|                                                              |
|                         [Print PDF]                          |
+--------------------------------------------------------------+
```

#### Step-by-Step Test Procedure
1. Open the "Metaphors" lesson plan from the dashboard.
2. Click the **"Worksheet View"** tab.
3. Toggle between **"Worksheet Only"** and **"Tutor Answer Key"** tabs.
4. Verify that the answer key contains responses and displays a safety confidentiality warning.
5. Click **"Print / Save PDF"**.
6. Inspect the print sheet scaling and check if any dashboard menus are visible.

#### 👁️ User Experience Observation
> *"The A4 mockup is beautiful—it looks like a real piece of paper. The 'Tutor Answer Key' correctly shows the answers to the metaphor questions and has a red caution header. When I clicked 'Print / Save PDF', the browser's native print screen popped up. All of the website's headers, sidebar menus, and buttons were completely gone, leaving only the clean worksheet with empty lines for student name and date. Ready for my copy machine!"*

* **Status**: **PASSED**

---

### 🔄 Journey D: Plan Refinement and Handout Synchronization
**Goal**: Verify that refining a lesson plan flags the worksheet as out-of-sync, warns the tutor, and allows manual, single-click regeneration.

#### Step-by-Step Test Procedure
1. Select the "Metaphors" lesson plan.
2. Refine the plan in the AI chat widget with instruction: *"Make this advanced for 8th grade."*
3. Verify that the plan structure is updated and no browser blocking alerts appear.
4. Locate the **"Worksheets & Handouts"** tab button and verify the pulsing amber dot.
5. Click the tab and verify the presence of the warning banner: *"Handouts Out of Sync"*.
6. Click the **"⚡ Regenerate Handout"** button on the banner.
7. Verify that the generation completes, the warning banner and pulsing dot disappear, and the content is updated.

#### 👁️ User Experience Observation
> *"When I refined the metaphors plan, the chat processed my request and updated the objectives without popping up any annoying browser prompts. I immediately noticed a pulsing amber dot on the 'Student Handouts & Homework' tab. Once I clicked it, a warning banner appeared at the top. I clicked 'Regenerate Handout' inside the banner; it completed successfully, updated the worksheet content, and the banner and amber dot automatically vanished. Excellent UX!"*

* **Status**: **PASSED**

---

## 🏁 5. UAT Sign-Off & Release Verdict

### 5.1 Acceptance Metrics Summary
* **Total User Acceptance Scenarios**: 12
* **Scenarios Passed**: 12
* **Scenarios Failed**: 0
* **User Acceptance Rate**: **100%**

### 5.2 Release Sign-off Signatures

By signing below, the UAT team agrees that the current release of **TutorMind (v1.4.0)** satisfies all functional and non-functional user stories and is ready for production deployment.

```text
Product Manager Verdict:
[APPROVED] - "The interactive chat, A4 worksheets, and out-of-sync warnings align perfectly with our tutor engagement goals."
Signed: Marcus Vance, Product Owner (June 4, 2026)

Lead QA Tester Verdict:
[APPROVED] - "Refinements are seamless, public sharing strips the answer key correctly, and the manual regeneration button handles state changes perfectly."
Signed: Sarah Jenkins, QA Lead Tester (June 4, 2026)

Lead Educator Verdict:
[APPROVED] - "The lesson plan layout is highly structured, and the worksheet synchronization flows save tutors a lot of manual re-editing time."
Signed: Prof. David Miller, Curriculum Director (June 4, 2026)
```
