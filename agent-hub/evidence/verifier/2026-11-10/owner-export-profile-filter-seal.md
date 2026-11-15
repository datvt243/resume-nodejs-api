# 2026-11-10 - owner-export-profile-filter (SEAL)
- Worker: verifier · Version: 0.1.0
- Node: `owner-export-profile-filter` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub #400, branch `400-support-profile-on`)
- New PM status: SEALED (collapsed: full row → `haven/diagrams/dev-loop-archive.md`, pointer row active; 21 pointer rows → oldest `restrict-query-token` (2026-11-07) deleted, full row already archived at line 156)
- Notes audited: `evidence/implementer/2026-11-10/owner-export-profile-filter-plan.md`, `evidence/implementer/2026-11-10/owner-export-profile-filter.md`

## Isolation proof
Fresh Agent spawn whose task string opens "You are the agent-hub **verifier** worker … you did NOT write this change" and asks to run `verify_seal` on node `owner-export-profile-filter`, not the implementer's task string ("#400 Support `?profile=` on owner export …"). src/ diff not opened (EvidenceOnly); only the agent-hub feature-doc diffs and `.claude/rules/api.md` rows were read, to check 6b.

## Reasoning
| Check | Evidence |
|---|---|
| Commands match `doctrine/MEMORY.md` | `npx jest src/__tests__/candidate_me/index.test.ts`, `npm test`, `npm run build` (Typecheck inside Build), `npm run lint` — all from the table |
| Typecheck | `npm run build` → last lines `> resume-nodejs-api@2.7.2 copy` / `> cp -R ./src/public ./dist/`, `build exit 0`, re-run after the final test edit |
| Lint baseline | `✖ 274 problems (274 errors, 0 warnings)` ≤ 274; first run 278 (+4 `unbound-method` in the new test) fixed with the file's `as jest.Mock` pattern; per-file counts equal to stashed base for all 5 touched files |
| Output not cut | no `...`/truncated markers; jest summaries quoted |
| download-pdf passes `?profile=` (all formats) | `✓ GET /api/v1/download-pdf filters sections to the caller's own non-deleted profile` (asserts `Profile.findOne` filter `{ _id, candidateId: <caller>, deletedAt: null }` + `Education.find` `_id: { $in }`), `✓ … stays unfiltered without ?profile=`; `Tests: 58 passed, 58 total`. Read happens before the format branch (single `handlerGetAboutMe` call) |
| ats-check passes `?profile=` | `✓ POST /api/v1/cv/ats-check filters sections …`, `✓ … stays unfiltered without ?profile=` |
| Tests are red without the change | stash of the 2 src files → `Tests: 2 failed, 56 passed, 58 total` (the two filter cases), popped after |
| Same rule as public routes (missing/invalid/foreign → unfiltered) | rule reused, not re-implemented (`handlerGetAboutMe` unchanged signature); existing `✓ falls back to unfiltered …`, `✓ never queries Profile when … rejected by QuerySafe`, `✓ treats a malformed profile id (abc) …` still green; caller id from `req.user._id` (IDOR) |
| Swagger | `profile` query param on both routes; compiled by the build (doc comment) |
| `npm test` | `Tests: 5 failed, 658 passed, 663 total` — same 5 env failures (tokenExpiry `TOKEN_EXP_IN`, 4 atsPdfIntegration no-Chrome) as SEALED `dedup-visits` (659 total; +4 = this node's tests); none in a touched file |
| comments per code-comments.md | row present: one changed WHY line inside an existing `/** */` block, one 1-sentence WHY `//` in the test, `@swagger` param blocks; no issue refs |
| pdf-export-standard | N/A, correctly argued: no `createPDF*`/`createDocx` touched, no new format |
| Feature doc (6b) | cites `doctrine/features/cv-export.md`; change to Behavior 2 evidenced above; doc's jest criteria: `candidate_me/index.test.ts` 58/58, createPDF/createPDF.ats/createDocx inside `npm test` (only the 2 env suites failed), atsPdfIntegration = the doc's own "needs local Chrome" caveat. `## Feature doc changed` applies the operator's recorded answer "Change: support it — #400" (Open questions, 2026-11-07, present in cv-export.md); Changelog rows present in cv-export, ats-check, cv-profiles |
| Supersedes / Still open | `none`; `grep '#400'` on active diagram → only this node |
| Doctrine proposal (6c) | none in note |
| Forbidden states | ADHOC_WORK no (row appended before code edit per plan); NO_EVIDENCE no; EDIT_UNVERIFIED no (test + typecheck + lint cited); CODE_IN_HAVEN no (`find haven` for .ts/.js/.py/.sh → empty); DIAGRAM_DRIFT no (row updated here) |
| Seal gate | nothing outward-facing in this pass (ship via `/ship`) |
| Proportionality | 2 handlers (+1 comment line), 2 swagger blocks, api.md rows, 4 tests, 3 feature docs — all in plan anchors; diffstat 87+/11- |
| 11e | change to a verified doc — Status left as is |

## Noticed (not a REOPEN reason)
- `doctrine/features/INDEX.md` ats-check row still lists `#406, #407`; ats-check.md's Issues line now has `#400`. Index row should gain `#400` (cv-export and cv-profiles rows already have it).

## Re-run
none — audit-only per `verify_seal` "Re-run scope" (bundle overrides the spawn prompt's "re-run yourself"): note verbatim, commands match doctrine, every criterion cited, not outward-facing; pre-existing 5 failures confirmed against the SEALED `dedup-visits` record rather than re-run.
