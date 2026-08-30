# 2026-08-25 — feat-multilang-resume-content (SEAL)

- Worker: verifier (independent subagent, fresh dispatch — no history with
  the implementer sessions that wrote the diff on 2026-08-21 or the
  recheck note on 2026-08-25)
- Node: `feat-multilang-resume-content` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: **SEALED** (was PENDING)

## Special situation acknowledged
This node had shipped code (merged `develop` via PR #80, commit `49c0ac3`,
2026-08-21) but had never received an independent verdict — the only
prior verifier pass was a same-session self-grade refusal
(`evidence/verifier/2026-08-21/feat-multilang-resume-content-refusal.md`,
correctly refused under `NeverVerifyOwnWork`, not a judgment on the code).
Per instructions for this pass, I did not defer to either prior note's
claims — I read the current code myself, end to end, and ran the test
command myself. What follows cites only what I personally observed this
session.

## Repo state (personally confirmed)
```
$ git log --oneline -3
fe5ac82 docs(agent-hub): seal add-forgot-reset-password-flow (issue #70)
39b8302 Merge pull request #86 from datvt243/add-forgot-reset-password-flow-2026-08-25
67c2e1f feat: add forgot-password / reset-password flow (issue #70)

$ git branch --show-current
develop

$ git log --oneline -- src/models/part/index.ts
49c0ac3 feat: support multi-language resume content (vi/en) + fix critical data leak in public profile
0ac8798 format code
2ecf929 update personal skills
3a714d8 first commit
```
`49c0ac3` is on `develop`'s history (HEAD `fe5ac82` is a later, unrelated
merge). Confirms the implementer's 2026-08-25 recheck claim.

## Code read, criterion by criterion

**1. `localizedTextSchema` exists as described** — `src/models/part/index.ts:53-59`:
```
export const localizedTextSchema = new Schema(
  { vi: { type: String, default: '' }, en: { type: String, default: '' } },
  { _id: false },
);
```

**2. Applied across the 7 models** — `grep -rn "localizedTextSchema" src/models/`
shows real usage (not just import) in all 7: `project.model.ts:16`
(`description`), `education.model.ts:19` (`description`),
`candidate.model.ts:39` (`introduction`), `generalInformation.model.ts:18,26`
(`career`, `careerGoal`), `experience.model.ts:18` (`description`),
`award.model.ts:20` (`description`), `certificate.model.ts:17`
(`description`) — all 8 fields from the scope, all `{ type:
localizedTextSchema, default: () => ({}) }`.

**3. `src/config/joi.config.ts`** — `introduction` (line 165),
`description` (line 186), `descriptionOptional` (line 191) all now
`Joi.object(localizedTextShape).../messages({'object.base': '{#label}
phải là object dạng vi/en', ...})` where `localizedTextShape = { vi:
Joi.string().allow(''), en: Joi.string().allow('') }` (line 160-163).
Confirmed the earlier Joi-template-literal bug (`{ vi, en }` in a
`.messages()` string crashing at module load) is fixed — the current
message text is the literal-brace-free `'phải là object dạng vi/en'`,
matching what the 2026-08-21 note describes as the fix.

**4. `candidate.validate.ts`** — `git show 49c0ac3 -- src/candidate/candidate.validate.ts`:
duplicate inline `introduction: Joi.string().required()...` removed,
replaced with the shared `introduction` import. Confirmed via diff, not
inference.

**5. `candidate_profile/*` untouched except the necessarily-linked validator** —
`git show --stat 49c0ac3 -- src/candidate_profile/` shows exactly one
file touched: `general_information/generalInformation.validate.ts`
(input validation only, `career`/`careerGoal` switched to
`description.label(...)`) — no controller/service under
`candidate_profile/*` was touched, so authenticated CRUD read/write
*handlers* are provably unchanged. Confirmed by reading
`src/candidate_me/index.ts` in full: only `handlerGetAboutMe` (used by
the two public-facing entry points) calls `resolveLocalizedText`; nothing
in `candidate_profile/*` imports it.

**6. `?lang=` resolution — public profile + PDF export, same code path** —
read `src/candidate_me/index.ts` in full (165 lines):
- `resolveLocalizedText(value, lang)` (line 19-23): `value[lang] ||
  value.vi || value.en || ''`, with a defensive `typeof value ===
  'string'` passthrough for pre-migration data.
- `fnGetAboutMe` (line 25-39): `lang = req.query.lang === 'en' ? 'en' :
  'vi'` → `handlerGetAboutMe(email, lang)`.
- `handlerGetAboutMe` (line 41-125): resolves `introduction` (line 99),
  every `description` across `educations/experiences/awards/certificates/projects`
  (line 100-105), and `generalInformation.career`/`careerGoal` (line
  113-117) down to plain strings.
- `fnExportPDF` (line 127-164): resolves the authenticated caller's own
  email from `req.user._id` (IDOR-safe — never a client-supplied id),
  reads `req.query.lang` the same way (line 154), and calls the exact
  same `handlerGetAboutMe(email, lang)` (line 155) before
  `createCV(data, res)`.
- Router wiring confirmed: `src/routers/api/v1/index.ts:66` →
  `router.get('/download-pdf', verifyTokenByQuery, fnExportPDF)`;
  `src/routers/index.ts:59` → `router.get('/api/me/:email',
  fnGetAboutMe)`.

**7. PDF-render risk assessed independently (this session's own addition
to the record)** — read `src/services/createPDF.ts` in full.
`pageRender`/`getDataCandidate` destructure `introduction`/`description`
straight out of the `RECORD` object passed to `createCV(data, res)` and
interpolate them as plain `${description}` / `${introduction}` template
strings — no object-shape-specific logic anywhere in this file. Since
`data` is exactly `handlerGetAboutMe`'s already-resolved return value
(plain strings by the time `createCV` sees it, per point 6), there is no
code path in the PDF renderer that could behave differently for a
resolved string vs. the pre-feature plain-string field — the interpolation
is shape-agnostic. This directly supports (with fresh evidence, not just
trusting the prior note's assertion) both prior notes' judgment that the
"PDF never visually screenshotted" gap is low-risk/non-blocking: the
renderer has no branch that distinguishes old-shape from new-shape input.

**8. Migration script — read in full, not summarized from the note** —
`src/scripts/migrate-localize-text-fields.ts:38-43`:
```
const migrateField = async (model: any, field: string) => {
  const result = await model.updateMany({ $expr: { $eq: [{ $type: `$${field}` }, 'string'] } }, [
    { $set: { [field]: { vi: `$${field}`, en: '' } } },
  ]);
  return result.modifiedCount ?? 0;
};
```
This is genuinely idempotent by construction: the `$expr`/`$type` match
only fires on documents where the field is *currently* a plain string;
after the first run every matched doc becomes an object, so a second run
matches zero documents — confirmed by reading the actual query logic, not
by trusting the note's prose description of it. `package.json:26` has
`"migrate:localize-text": "ts-node -r tsconfig-paths/register
src/scripts/migrate-localize-text-fields.ts"` — the npm script referenced
in both prior notes is real. Not re-run this session (already run against
the live DB per 2026-08-21 note + verified idempotent there — re-running
a live-DB migration script gratuitously during a read-only verify pass is
not warranted).

## Test command — run by me, personally, this session

```
$ npm test
...
Test Suites: 9 passed, 9 total
Tests:       49 passed, 49 total
Snapshots:   0 total
Time:        4.156 s, estimated 5 s
Ran all test suites.
```
No truncation, no redaction. Matches the count in the 2026-08-25 recheck
note (49, not the original 45 — the +4 are the already-sealed
`add-forgot-reset-password-flow` tests, unrelated to this node). Zero
failures.

## Issue #79 — read via `gh issue view 79`

Proposal (verbatim from the issue): localize `introduction` +
section `description` + `generalInformation.career`/`careerGoal` (issue
also floats `positionDesired`/`position`/`major`/`school`/`company` as
"candidates too" but explicitly caveats "some of those — like company
names — probably shouldn't be translated"); `{vi, en}` schema shape
("or a more open Map<String,String>... start with vi/en to match current
usage" — issue explicitly allows the fixed-language-set choice actually
shipped); `?lang=` on `GET /api/me/:email` and `GET
/api/v1/download-pdf`; Joi validation updated; migration script for
existing string data.

All of this is met by the code read above. The one field the issue
floated but the implementation excluded, `positionDesired`, has a
documented scope reason in the 2026-08-21 note (it shares the
`position` Joi validator with `Experience.position`, which is a job
title, not free-text prose) — consistent with the issue's own caveat
that not everything on its "candidates too" list should necessarily be
translated. This is a defensible, recorded scope decision, not an
unexplained omission.

## Acceptance — one row per criterion, evidence cited per row

| Criterion | Evidence |
|---|---|
| Traces to exactly one diagram node | `feat-multilang-resume-content`, present in PM table |
| `{vi,en}` schema on 8 fields, 7 models | `src/models/part/index.ts:53-59` + grep across `src/models/` (7 files, all real usages) |
| Joi validates `{vi,en}` shape | `src/config/joi.config.ts:160-193` |
| `?lang=` resolves on BOTH public profile and PDF export via the same function | `src/candidate_me/index.ts:25-164`, router wiring `src/routers/api/v1/index.ts:66`, `src/routers/index.ts:59` |
| Authenticated CRUD (`candidate_profile/*`) unchanged | `git show --stat 49c0ac3 -- src/candidate_profile/` → only the validator file, no controller/service |
| Migration idempotent, matches the note's description | Read `src/scripts/migrate-localize-text-fields.ts:38-43` directly — `$expr`/`$type` guard confirmed in the actual code |
| Exact test command run + read back verbatim, this session | `npm test` → `Test Suites: 9 passed, 9 total` / `Tests: 49 passed, 49 total` (pasted above) |
| Merged to `develop` | `git log --oneline -- src/models/part/index.ts` → `49c0ac3`, reachable from current `develop` HEAD |
| Meets issue #79's stated proposal | `gh issue view 79`, compared point-by-point above |

## Forbidden-states check (`agent-hub/CLAUDE.md`)

| State | Hit? |
|---|---|
| `ADHOC_WORK` | No — node exists on diagram, work done under implementer identity, PR-reviewed |
| `NO_EVIDENCE` | No — 3 notes exist (2026-08-21 diff, 2026-08-21 refusal, 2026-08-25 recheck) plus this one |
| `EDIT_UNVERIFIED` | No — I ran `npm test` myself this session and pasted the verbatim tail above |
| `CODE_IN_HAVEN` | No — nothing runnable written into `haven/` |
| `DIAGRAM_DRIFT` | **This is what this SEAL fixes** — code has been live on `develop` since 2026-08-21, diagram said PENDING until this verdict |

## Known non-blocking gap (carried forward, not silently dropped)

Neither I, nor either prior note's author, ever opened the actual
generated PDF file and visually inspected the rendered text for a
`?lang=en` export. I closed part of this gap independently this session
by reading `src/services/createPDF.ts` in full (see point 7 above): the
renderer has no object-shape-specific branching, so a resolved plain
string behaves identically to the pre-feature plain-string field. Given
that plus the shared-function-call evidence in `candidate_me/index.ts`,
I judge this **non-blocking for SEAL** — consistent with both prior
notes' judgment, now backed by a fresh, independent read of the
consuming code rather than just the note's assertion.

## Candidate bug for a NEW node (not fixed here, not a reason to REOPEN this node)

None found beyond what's already tracked. `pageRender`/`getDataCandidate`
in `src/services/createPDF.ts` do not read `generalInformation.career`/
`careerGoal` into the PDF output at all (only `renderSkills` on
`generalInformation`, and `foreignLanguages`) — i.e. `career`/`careerGoal`
are localized and returned correctly by `handlerGetAboutMe`/`fnGetAboutMe`
(public profile JSON), but the PDF template never renders those two
fields regardless of language. This predates this feature (the PDF
template has never rendered `career`/`careerGoal`, localized or not) —
out of scope for `feat-multilang-resume-content` (which only had to make
localization *available and resolvable*, not guarantee every consumer
renders every field), so **not a reason to REOPEN this node**. Flagging
as a candidate for a new, separate node if `career`/`careerGoal` should
appear on the exported PDF at all — a pre-existing PDF-template gap, not
a regression introduced by this diff.

## Verdict

**SEAL.** All acceptance criteria have cited, independently-verified
evidence. Zero forbidden-state hits. Test suite green, read back verbatim
by me. Diagram PM status updated below.
