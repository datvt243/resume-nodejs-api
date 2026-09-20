# 2026-09-20 — add-linkedin-export-parse-endpoint — diff

- Worker: implementer
- Node: `add-linkedin-export-parse-endpoint`
- Companion to `add-linkedin-export-parse-endpoint-plan.md` (same date) —
  that note has the acceptance table + test output; this one has the
  literal diff.

## New files (not shown by `git diff`, untracked)
- `src/candidate/parseLinkedInExport.service.ts`
- `src/middlewares/uploadLinkedInExport.middleware.ts`
- `src/__tests__/candidate/parseLinkedInExport.service.test.ts`
- `src/__tests__/candidate/candidate.controller.test.ts`

Full contents of each were written directly via the session's Write tool
(shown to the operator live in the session at write time) — not
reproduced here. `uploadLinkedInExport.middleware.ts` is structurally the
same error-wrapping pattern as `uploadCV.middleware.ts`, swapped to
`multer.memoryStorage()` + a `.zip` filter + a 20MB cap.
`parseLinkedInExport.service.ts` is new logic (no existing section to
template from) — see the plan note's Diff table for what it does.

## `git diff -- package.json package-lock.json src/candidate/candidate.controller.ts src/locales/en.ts src/locales/vi.ts src/routers/api/v1/candidate.route.ts`
```diff
diff --git a/package-lock.json b/package-lock.json
index ff374c8..8b0a073 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -10,10 +10,12 @@
       "license": "ISC",
       "dependencies": {
         "@babel/runtime": "^7.22.10",
+        "adm-zip": "^0.6.1",
         "bcrypt": "^5.1.1",
         "body-parser": "^1.20.2",
         "cookie-parser": "^1.4.7",
         "cors": "^2.8.5",
+        "csv-parse": "^7.0.2",
         "docx": "^9.7.1",
         "dotenv": "^16.4.5",
         "exit-hook": "^4.0.0",
@@ -44,6 +46,7 @@
         "@babel/node": "^7.22.10",
         "@babel/plugin-transform-runtime": "^7.22.10",
         "@babel/preset-env": "^7.22.10",
+        "@types/adm-zip": "^0.5.8",
         "@types/bcrypt": "^5.0.2",
         "@types/cookie-parser": "^1.4.10",
         "@types/cors": "^2.8.17",
@@ -3129,6 +3132,16 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/@types/adm-zip": {
+      "version": "0.5.8",
+      "resolved": "https://registry.npmjs.org/@types/adm-zip/-/adm-zip-0.5.8.tgz",
+      "integrity": "sha512-RVVH7QvZYbN+ihqZ4kX/dMiowf6o+Jk1fNwiSdx0NahBJLU787zkULhGhJM8mf/obmLGmgdMM0bXsQTmyfbR7Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/node": "*"
+      }
+    },
     "node_modules/@types/babel__core": {
       "version": "7.20.5",
       "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
@@ -3573,6 +3586,15 @@
         "node": ">=0.4.0"
       }
     },
+    "node_modules/adm-zip": {
+      "version": "0.6.1",
+      "resolved": "https://registry.npmjs.org/adm-zip/-/adm-zip-0.6.1.tgz",
+      "integrity": "sha512-Xwrja8nx9e5o2N1my4DsKCeKpdrnACyr1wtbPxBDgGzKzKyE9kRtBFA8mWldI+RVlD7CBZNWY/wQ2+ydwOR6kQ==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=14.0"
+      }
+    },
     "node_modules/agent-base": {
       "version": "6.0.2",
       "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
@@ -4944,6 +4966,12 @@
       "integrity": "sha512-KALDyEYgpY+Rlob/iriUtjV6d5Eq+Y191A5g4UqLAi8CyGP9N1+FdVbkc1SxKc2r4YAYqG8JzO2KGL+AizD70Q==",
       "license": "MIT"
     },
+    "node_modules/csv-parse": {
+      "version": "7.0.2",
+      "resolved": "https://registry.npmjs.org/csv-parse/-/csv-parse-7.0.2.tgz",
+      "integrity": "sha512-uKZghv9UmPkMVLYy//KZ9HFAIJsl7wkhoEdIL0+rhuSY9pZQlhaeGEDPIe+/w7eh81MOql8Q/9+inAGWG6ZHYA==",
+      "license": "MIT"
+    },
     "node_modules/data-uri-to-buffer": {
       "version": "6.0.2",
       "resolved": "https://registry.npmjs.org/data-uri-to-buffer/-/data-uri-to-buffer-6.0.2.tgz",
diff --git a/package.json b/package.json
index 789296c..956d687 100644
--- a/package.json
+++ b/package.json
@@ -32,10 +32,12 @@
   },
   "dependencies": {
     "@babel/runtime": "^7.22.10",
+    "adm-zip": "^0.6.1",
     "bcrypt": "^5.1.1",
     "body-parser": "^1.20.2",
     "cookie-parser": "^1.4.7",
     "cors": "^2.8.5",
+    "csv-parse": "^7.0.2",
     "docx": "^9.7.1",
     "dotenv": "^16.4.5",
     "exit-hook": "^4.0.0",
@@ -66,6 +68,7 @@
     "@babel/node": "^7.22.10",
     "@babel/plugin-transform-runtime": "^7.22.10",
     "@babel/preset-env": "^7.22.10",
+    "@types/adm-zip": "^0.5.8",
     "@types/bcrypt": "^5.0.2",
     "@types/cookie-parser": "^1.4.10",
     "@types/cors": "^2.8.17",
diff --git a/src/candidate/candidate.controller.ts b/src/candidate/candidate.controller.ts
index e2e431e..7f6c89b 100644
--- a/src/candidate/candidate.controller.ts
+++ b/src/candidate/candidate.controller.ts
@@ -19,6 +19,7 @@ import {
   handlerGetVisits,
 } from '@/candidate/candidate.service';
 import { CV_UPLOAD_DIR } from '@/middlewares/uploadCV.middleware';
+import { parseLinkedInExportZip } from '@/candidate/parseLinkedInExport.service';
 import { t } from '@/utils/i18n';
 
 export const fnGetInformationById = async (req: Request, res: Response) => {
@@ -107,6 +108,38 @@ export const fnDownloadCV = async (req: Request, res: Response, next: NextFuncti
   }
 };
 
+export const fnParseLinkedInExport = async (req: Request, res: Response, next: NextFunction) => {
+  /**
+   * `uploadLinkedInExportMiddleware` (candidate.route.ts) already
+   * validated the file (.zip only, <= 20 MB) and kept it in memory --
+   * nothing is written to disk or persisted to the DB here. Stateless
+   * parse-and-return (issue #141): the frontend maps the result into its
+   * existing create forms for the user to review/edit before saving.
+   */
+  const file = (req as any).file as Express.Multer.File | undefined;
+  if (!file) {
+    return formatReturn(res, {
+      statusCode: StatusCodes.BAD_REQUEST,
+      success: false,
+      message: t('linkedinImport.noFileUploaded', (req as any).lang),
+    });
+  }
+
+  try {
+    const data = parseLinkedInExportZip(file.buffer);
+    return formatReturn(res, { success: true, message: t('linkedinImport.parseSuccess', (req as any).lang), data });
+  } catch (err) {
+    if (err instanceof Error && err.message === 'INVALID_ZIP') {
+      return formatReturn(res, {
+        statusCode: StatusCodes.BAD_REQUEST,
+        success: false,
+        message: t('linkedinImport.invalidZip', (req as any).lang),
+      });
+    }
+    handleError(err, next, (req as any).lang);
+  }
+};
+
 export const fnGetVisits = async (req: Request, res: Response, next: NextFunction) => {
   /**
    * Self only — always the authenticated user's own id (same IDOR-safe
diff --git a/src/locales/en.ts b/src/locales/en.ts
index 5230bb2..9b4da8b 100644
--- a/src/locales/en.ts
+++ b/src/locales/en.ts
@@ -55,6 +55,14 @@ export default {
     cvFileNotFound: 'No CV has been uploaded yet',
     getVisitsSuccess: 'Visits fetched successfully',
   },
+  linkedinImport: {
+    noFileUploaded: 'No file was uploaded',
+    invalidFileType: 'Only ZIP files (LinkedIn Data export) are accepted',
+    fileTooLarge: 'File exceeds the allowed size (20 MB)',
+    invalidZip: 'The ZIP file is invalid or corrupted',
+    parseSuccess: 'LinkedIn data parsed successfully',
+    parseFailed: 'Failed to parse LinkedIn data',
+  },
   generalInformation: {
     alreadyExists: 'Candidate already has information, cannot save',
   },
diff --git a/src/locales/vi.ts b/src/locales/vi.ts
index 2df4f67..5ada179 100644
--- a/src/locales/vi.ts
+++ b/src/locales/vi.ts
@@ -55,6 +55,14 @@ export default {
     cvFileNotFound: 'Chưa có CV nào được tải lên',
     getVisitsSuccess: 'Lấy danh sách lượt ghé thăm thành công',
   },
+  linkedinImport: {
+    noFileUploaded: 'Không có file nào được tải lên',
+    invalidFileType: 'Chỉ chấp nhận file ZIP (LinkedIn Data export)',
+    fileTooLarge: 'File vượt quá dung lượng cho phép (20 MB)',
+    invalidZip: 'File ZIP không hợp lệ hoặc bị hỏng',
+    parseSuccess: 'Đọc dữ liệu LinkedIn thành công',
+    parseFailed: 'Đọc dữ liệu LinkedIn thất bại',
+  },
   generalInformation: {
     alreadyExists: 'Candidate đã có thông tin, không thể lưu thêm',
   },
diff --git a/src/routers/api/v1/candidate.route.ts b/src/routers/api/v1/candidate.route.ts
index 9719be3..6983b52 100644
--- a/src/routers/api/v1/candidate.route.ts
+++ b/src/routers/api/v1/candidate.route.ts
@@ -15,8 +15,10 @@ import {
   fnUploadCV,
   fnDownloadCV,
   fnGetVisits,
+  fnParseLinkedInExport,
 } from '@/candidate/candidate.controller';
 import { uploadCVMiddleware } from '@/middlewares/uploadCV.middleware';
+import { uploadLinkedInExportMiddleware } from '@/middlewares/uploadLinkedInExport.middleware';
 
 /**
  * @swagger
@@ -48,6 +50,66 @@ import { uploadCVMiddleware } from '@/middlewares/uploadCV.middleware';
  */
 router.post('/upload-cv', uploadCVMiddleware, fnUploadCV);
 
+/**
+ * @swagger
+ * /api/v1/candidate/parse-linkedin-export:
+ *   post:
+ *     tags: [Candidate]
+ *     summary: Parse a LinkedIn "Data export" ZIP (Education.csv/Positions.csv) into Education/Experience entries for the frontend to review before saving
+ *     description: Stateless parse-and-return endpoint -- nothing is persisted. Best-effort only (dates and free-text fields depend on LinkedIn's export format); the frontend is expected to map the result into its existing create forms for the user to review/edit before saving, never auto-save.
+ *     security:
+ *       - bearerAuth: []
+ *     requestBody:
+ *       required: true
+ *       content:
+ *         multipart/form-data:
+ *           schema:
+ *             type: object
+ *             properties:
+ *               file:
+ *                 type: string
+ *                 format: binary
+ *                 description: The LinkedIn export ZIP (max 20MB)
+ *     responses:
+ *       200:
+ *         description: Parsed Education/Experience entries (never persisted)
+ *         content:
+ *           application/json:
+ *             schema:
+ *               allOf:
+ *                 - $ref: '#/components/schemas/ApiResponse'
+ *                 - type: object
+ *                   properties:
+ *                     data:
+ *                       type: object
+ *                       properties:
+ *                         educations:
+ *                           type: array
+ *                           items:
+ *                             type: object
+ *                             properties:
+ *                               school: { type: string }
+ *                               major: { type: string }
+ *                               startDate: { type: number, nullable: true }
+ *                               endDate: { type: number, nullable: true }
+ *                               isCurrent: { type: boolean }
+ *                               description: { type: string }
+ *                         experiences:
+ *                           type: array
+ *                           items:
+ *                             type: object
+ *                             properties:
+ *                               company: { type: string }
+ *                               position: { type: string }
+ *                               startDate: { type: number, nullable: true }
+ *                               endDate: { type: number, nullable: true }
+ *                               isCurrent: { type: boolean }
+ *                               description: { type: string }
+ *       400:
+ *         description: Missing file, wrong type (non-ZIP), too large (> 20MB), or the ZIP itself is corrupt/unreadable
+ */
+router.post('/parse-linkedin-export', uploadLinkedInExportMiddleware, fnParseLinkedInExport);
+
 /**
  * @swagger
  * /api/v1/candidate/cv-file:
```
