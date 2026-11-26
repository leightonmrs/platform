# Институт Лабораторной Медицины КАМЛАБ

A Russian language learning platform with an editable multi-course catalogue and the existing PCR fundamentals course.

Features: author course editor, modules and lessons, YouTube/Vimeo or uploaded video, protected attachments, quizzes graded by the server, private notes, persistent individual progress, learner results, JSON export/import and a printable completion confirmation.

## Runtime

Vinext / React, Cloudflare D1 (`DB`) and R2 (`BUCKET`). Hosted sign-in and access are managed by Sites. The Site starts owner-private. On the first authenticated visit to the empty private Site, the owner initializes the course and becomes its author. Initialize the course before sharing. Author operations are checked against that stable user ID; learner data is scoped to the current signed-in user. Never trust identity headers from a direct public origin; hosted dispatch owns their injection.

## Content

Six modules contain eleven short, editable introductory texts and one ten-question quiz. These are starter teaching materials, not a full clinical training programme. Sources are linked in the lessons. No third-party videos are bundled. Add your own lecture recordings, course name, author and organization through the editor. The printable confirmation is not a continuing education credential.

Lesson 1.1 also includes staged self-check questions and the two-part situational case “Кому принадлежит результат ПЦР” from the supplied teaching documents. Learners write four open responses before submitting to reveal the worked solution. Submitted responses and earlier solutions are private and stored in D1, scoped to user, course, lesson and content version. Open responses receive no automatic grade. The server overlays default exercises on the existing main-course lesson without replacing its saved text or video; JSON exports and author saves preserve the exercises. Student state and initial server rendering omit model answers. `/api/case-study` returns the solution only after a saved submission. Migration 0003 adds the submissions table without changing existing records.

## Development and validation

Use the Sites setup and build helpers. Generate migrations with `npm run db:generate`. After building, run:

```
node node_modules/typescript/bin/tsc --noEmit
node --import ./scripts/sites-env.mjs scripts/test-academy.mjs
node scripts/test-self-check.mjs
node scripts/test-case-study.mjs
```

The smoke suite runs the built Worker in an isolated Miniflare instance with disposable D1 and R2. It does not call the hosted Site or modify production data.

## Launch scope

This version supports multiple independent courses and native ChatGPT sign-in. Owners add draft courses, edit programmes, configure categories, set KZT prices, attach HTTPS payment links and publish courses. Free courses are accessible directly; paid course lessons, files, progress and certificates require an enrollment. A pending order does not grant access. A platform owner verifies receipt in the external payment service and confirms the order to grant access. No card data is collected and no payment is inferred from redirects. Payment-provider accounts, payment links, automatic payment webhooks, email marketing, custom domains, standalone password accounts and formal certificates are not configured. Long videos should use an external video host; single uploads are limited to 50 MB. Author changes require an explicit save. Quiz changes or a new pass threshold invalidate affected results. The current Site audience must be changed explicitly before inviting learners.

Course-specific lesson storage keys preserve existing PCR progress and notes while separating records from other courses, including imports with matching lesson IDs. Additive migration 0001 creates enrollments/orders and associates existing assets with the main course. Original curriculum and historical data are retained.
