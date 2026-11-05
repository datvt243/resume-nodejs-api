# 2026-11-05 - add-cv-file-name (r2, answers REOPEN)
- Worker: implementer · Version: 0.1.0
- Node: `add-cv-file-name` · REOPEN: `evidence/verifier/2026-11-05/add-cv-file-name-reopen.md`
- Task: same as `add-cv-file-name-plan.md` (#363). No `src/` change in r2 — this note only adds the missing `pdf-export-standard.md` check; everything else in the r1 plan note (diff, commands, outputs, acceptance table) stands as-is.

## Hub bytes before: 84303
(same as r1 — r2 changes no hub file besides adding this note)

## Command
```
git diff -U0 -- src/services/createPDF.ts src/services/createPDF.ats.ts src/services/createDocx.ts | grep "^[+-][^+-]"
git diff -U0 -- <same 3 files> | grep "^[+-][^+-]" | grep -ciE "letter-spacing|formatDate|applyPdfMetadata|<html|lang|style|css|filterXSS|birthday|gender|marital|avatar"
grep -rn "cvFilename(" src --exclude-dir=__tests__
grep -n "writeFileSync\|path: \`" src/services/createPDF.ts src/services/createPDF.ats.ts src/services/createDocx.ts
```

## Output
```
--- changed lines in export files:
+import { buildAtsContent, cvFilename } from '@/services/createPDF.ats';
-  res.setHeader('Content-Disposition', `attachment; filename="${content.email}.docx"`);
+  res.setHeader('Content-Disposition', `attachment; filename="${cvFilename({ cvFileName: data.cvFileName, content: buildAtsContent({ RECORD: data }) }, 'docx')}"`);
+    // NFD doesn't decompose đ/Đ (a distinct letter, not d + a mark)
+    .replace(/đ/g, 'd')
+    .replace(/Đ/g, 'D')
-/** Attachment filename for an ATS PDF — names only, never the email. */
-export const atsPdfFilename = (content: AtsContent): string => `${slugifyFilename(content.fullName)}_${slugifyFilename(content.headline || 'CV')}_CV.pdf`;
+/**
+ * Attachment filename for every CV download: the candidate's own `cvFileName`
+ * when set, else `<fullName>_<headline>_CV` — names only, never the email.
+ * Always slugified, so the value is safe inside a quoted `Content-Disposition`.
+ */
+export const cvFilename = ({ cvFileName = '', content }: { cvFileName?: string | undefined; content: Pick<AtsContent, 'fullName' | 'headline'> }, ext: 'pdf' | 'docx' = 'pdf'): string =>
+  `${cvFileName.trim() ? slugifyFilename(cvFileName) : `${slugifyFilename(content.fullName)}_${slugifyFilename(content.headline || 'CV')}_CV`}.${ext}`;
-  res.setHeader('Content-Disposition', `attachment; filename="${atsPdfFilename(content)}"`);
+  res.setHeader('Content-Disposition', `attachment; filename="${cvFilename({ cvFileName: data.cvFileName, content })}"`);
+import { buildAtsContent, cvFilename } from '@/services/createPDF.ats';
+    res.setHeader('Content-Disposition', `attachment; filename="${cvFilename({ cvFileName: data.cvFileName, content: buildAtsContent({ RECORD: data }) })}"`);
--- letter-spacing/formatDate/applyPdfMetadata/lang/css in changed lines:
0
--- cvFilename usages:
src/candidate_me/public-pdf.ts:80:    res.setHeader('Content-Disposition', `attachment; filename="${cvFilename({ cvFileName: data.cvFileName, content })}"`);
src/services/createPDF.ts:85:    res.setHeader('Content-Disposition', `attachment; filename="${cvFilename({ cvFileName: data.cvFileName, content: buildAtsContent({ RECORD: data }) })}"`);
src/services/createDocx.ts:243:  res.setHeader('Content-Disposition', `attachment; filename="${cvFilename({ cvFileName: data.cvFileName, content: buildAtsContent({ RECORD: data }) }, 'docx')}"`);
src/services/createPDF.ats.ts:481:  res.setHeader('Content-Disposition', `attachment; filename="${cvFilename({ cvFileName: data.cvFileName, content })}"`);
--- disk writes:
src/services/createPDF.ats.ts:478:    fs.writeFileSync(path.join(dir, `${slugifyFilename(content.email)}-ats.pdf`), buffer);
src/services/createPDF.ts:75:      path: `${URL}${email}.pdf`,
```

## pdf-export-standard.md — rule by rule
Scope of the export-code change (from the output above): 3 `res.setHeader('Content-Disposition', …)` lines, 2 imports, the `cvFilename` helper replacing `atsPdfFilename`, and the `đ/Đ` step in `slugifyFilename`. No HTML template, CSS, date, list, sanitiser, metadata or `page.pdf` line changed (keyword grep over changed lines = 0). `buildAtsContent` is called (not modified) in classic/DOCX only to read `fullName`/`headline` for the filename; its output never reaches their render.

| Rule | Status | Why |
|---|---|---|
| 1 no letter-spacing | holds — not touched | 0 CSS lines changed |
| 2 no network fonts | holds — not touched | no `<link>`/`@font-face`/`setContent` change |
| 3 labels/lang follow request | holds — not touched | no label, `<html lang>`, `<title>` or `t()` change; filename is not user-visible document text |
| 4 dates MM/YYYY | holds — not touched | no `formatDate` change |
| 5 list fields render | holds — not touched | no `getSkills`/list helper change |
| 6 sanitise free text in HTML | holds — not touched | `filterXSS` path unchanged; `cvFileName` never enters any HTML, only the header (and is slugified to `[A-Za-z0-9_]` there) |
| 7 no DOB/gender/marital/photo | holds — not touched | no field added to any template; `cvFileName` is not rendered |
| 8 ATS single-column | holds — not touched | ATS HTML unchanged; classic is exempt anyway (not ATS-branded) |
| 9 PDF metadata deliberate | holds — unchanged | `applyPdfMetadata(buffer, { title: … })` call in `renderAtsPdfBuffer` (`createPDF.ats.ts:445`) untouched; the edit is in `createCVAts` after the buffer is built |
| 10 no PII in on-disk paths | holds for this diff | `cvFilename()` output is used ONLY in the 4 `Content-Disposition` headers listed above — never as a disk path. The on-disk writes are unchanged lines: ATS `PERSIST_EXPORTED_PDF` path still uses `slugifyFilename(content.email)` (the `đ/Đ` step is a no-op on ASCII emails); classic `createPDF.ts:75` `path: \`${URL}${email}.pdf\`` is a PRE-EXISTING rule-10 violation (email in a file name under `public/pdf/`, served unauthenticated), not introduced or touched here → `## Noticed, not done`. The DOCX change *removes* the email from the download name (rule-10 spirit) |

Text-extraction evidence (`EDIT_UNVERIFIED` clause for rules 1-5): not required — no rule 1-5 code changed.

## Noticed, not done
- `createPDF.ts:75` classic PDF writes `<email>.pdf` into `public/pdf/` on every export (pre-existing rule-10 violation) — worth its own node (render to buffer only, like ATS).

## Seal gate: unchanged — operator "Approve all 4"
