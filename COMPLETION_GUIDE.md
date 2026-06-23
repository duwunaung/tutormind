# TutorMind Feature Completion Guide

This guide establishes the mandatory workflow, checklist, and quality assurance protocols to follow after completing any feature implementation, bug fix, or visual update in the **TutorMind** project.

---

## 1. Automated Version Bumping Protocol
Unless explicitly instructed otherwise by the user, **always increment the patch version number by `0.0.1`** (e.g. from `1.3.1` to `1.3.2`) in the following files:
1. **[`package.json`](file:///d:/Projects/Personal/tutormind/package.json)** (update the `"version"` field)
2. **[`app/chat/page.tsx`](file:///d:/Projects/Personal/tutormind/app/chat/page.tsx)** (update the footer version tag `<span className="font-mono bg-gray-950 ...">vX.Y.Z</span>`)
3. **[`app/components/AppFooter.tsx`](file:///d:/Projects/Personal/tutormind/app/components/AppFooter.tsx)** (update the footer version tag `<span className="font-mono ...">vX.Y.Z</span>`)

### Changelog Maintenance
* Document the changes at the top of the **Changelog** section in the **[`README.md`](file:///d:/Projects/Personal/tutormind/README.md)** file. Specify the version bump and write concise bullet points describing what was implemented.

---

## 2. Mandatory Verification & Build Check
Before presenting the completed task to the user, the following commands must be run locally in the workspace:

### 2.1 Run Vitest Test Suite
Execute the local unit test suite to ensure no regressions are introduced:
```cmd
npm.cmd run test
```
* **Protocol**: Copy the exact terminal test results summary (e.g. `Test Files  X passed | Y skipped`) and paste it directly into the final chat response so the user has immediate visibility of test health.

### 2.2 Run Production Next.js Build
Compile the application to guarantee there are no TypeScript, ESLint, or Next.js Turbopack compilation errors:
```cmd
npm.cmd run build
```
* **Protocol**: Verify that the build completes successfully with exit code `0`.

---

## 3. Strict Security Access Rules
For any public-facing or student-sharing features (e.g. `/share/[id]` or `/api/share/[id]`):
* **Backend Stripping**: Private tutor information, teacher notes, or `# Tutor Answer Key` markings **MUST** be programmatically stripped out on the backend server before sending the response JSON payload. Do not rely on hiding fields in client-side HTML, as details could leak in browser network inspectors.

---

## 4. Git Push & Commit Policy
* **Standard Policy**: By default, stage all changes (`git add .`), create a conventional commit (e.g. `feat: implement public link sharing`), and push to the remote branch (`git push`).
* **Review Exception**: If the user requests to "review first" or "do not push", commit the changes locally but **do not** execute the `git push` command. State clearly in the chat that the changes are left in your local working tree for their verification.

---

## 5. Rich Design & Micro-animations
Any new button, widget, or page must adhere to TutorMind's visual standards:
* **Glassmorphism**: Use deep backgrounds (`bg-gray-900`), border highlights (`border-gray-800`), and dark overlays (`backdrop-blur-sm`).
* **Glow & Pulsing**: Primary CTA buttons or floating icons (FAB) should include pulsing glows via self-contained `@keyframes` CSS styles.
* **Layout Sizing**: Ensure all layout text, padding, and positioning are styled using relative `rem` units to scale gracefully under the desktop zoom settings in `globals.css`.
