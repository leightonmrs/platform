# ПЦР Академия

A Russian language learning platform for a PCR fundamentals course.

Features: author course editor, modules and lessons, YouTube/Vimeo or uploaded video, protected attachments, quizzes graded by the server, private notes, persistent individual progress, learner results, JSON export/import and a printable completion confirmation.

## Runtime

Vinext / React, Cloudflare D1 (`DB`) and R2 (`BUCKET`). Hosted sign-in and access are managed by Sites. The Site starts owner-private. On the first authenticated visit to the empty private Site, the owner initializes the course and becomes its author. Initialize the course before sharing. Author operations are checked against that stable user ID; learner data is scoped to the current signed-in user. Never trust identity headers from a direct public origin; hosted dispatch owns their injection.

## Content

Six modules contain eleven short, editable introductory texts and one ten-question quiz. These are starter teaching materials, not a full clinical training programme. Sources are linked in the lessons. No third-party videos are bundled. Add your own lecture recordings, course name, author and organization through the editor. The printable confirmation is not a continuing education credential.

## Development and validation

Use the Sites setup and build helpers. Generate migrations with `npm run db:generate`. After building, run:

```
node node_modules/typescript/bin/tsc --noEmit
node --import ./scripts/sites-env.mjs scripts/test-academy.mjs
```

The smoke suite runs the built Worker in an isolated Miniflare instance with disposable D1 and R2. It does not call the hosted Site or modify production data.

## Launch scope

This version supports one course and native ChatGPT sign-in. Payments, email marketing, custom domains, multiple course catalogues, standalone password accounts and formal certificates are not configured. Long videos should use an external video host; single uploads are limited to 50 MB. Author changes require an explicit save. Quiz changes or a new pass threshold invalidate affected results. The current Site audience must be changed explicitly before inviting learners.
