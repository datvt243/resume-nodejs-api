# 2026-09-20 — add-cv-profile-selection — diff

- Worker: implementer
- Node: `add-cv-profile-selection`
- Companion to `add-cv-profile-selection-plan.md` (same date) — that note
  has the acceptance table + test output; this one has the literal diff.

## New files (not shown by `git diff`, untracked)
- `src/models/profile.model.ts`
- `src/candidate_profile/profile/profile.validate.ts`
- `src/candidate_profile/profile/profile.service.ts`
- `src/candidate_profile/profile/profile.controller.ts`
- `src/routers/api/v1/profile.route.ts`
- `src/__tests__/candidate_profile/profile.service.test.ts`

Full contents of each were written directly via the session's Write tool
(shown to the operator live in the session at write time) — not
reproduced here to avoid duplicating ~300 lines already visible in the
session transcript. Shape: `profile.model.ts`/`profile.validate.ts`/
`profile.service.ts`/`profile.controller.ts`/`profile.route.ts` are
line-for-line structural copies of `application.model.ts`/
`application.validate.ts`/`application.service.ts`/
`application.controller.ts`/`application.route.ts` (the most recently
added CV-section pattern, `add-application-tracker`), swapping in the
Profile-specific fields (`name` + 6 ObjectId-id arrays instead of
Application's `company`/`position`/`appliedDate`/`status`/`note`/
`jobLink`) and adding `ensureDefaultProfile` (new logic, not templated
from any existing section) to `profile.service.ts`.

## `git diff -- src/` (tracked files modified in place)
```diff
diff --git a/src/__tests__/candidate_me/index.test.ts b/src/__tests__/candidate_me/index.test.ts
index 82ea336..4c73127 100644
--- a/src/__tests__/candidate_me/index.test.ts
+++ b/src/__tests__/candidate_me/index.test.ts
@@ -12,6 +12,7 @@ import { handlerGetAboutMe, handlerRecordVisit } from '@/candidate_me';
 jest.mock('@/models', () => ({
   Candidate: { findOne: jest.fn() },
   Visit: { create: jest.fn() },
+  Profile: { findOne: jest.fn() },
   generalInformation: { find: jest.fn() },
   Experience: { find: jest.fn() },
   Education: { find: jest.fn() },
@@ -53,4 +54,62 @@ describe('candidate_me/index.ts (issue #135)', () => {
       expect(MODEL.Visit.create).not.toHaveBeenCalled();
     });
   });
+
+  describe('handlerGetAboutMe — profile filtering (issue #133)', () => {
+    const candidateId = '507f1f77bcf86cd799439000';
+    const candidateDoc = { _id: candidateId, email: 'votan.it@gmail.com' };
+
+    beforeEach(() => {
+      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(candidateDoc) });
+      const emptyFind = { exec: jest.fn().mockResolvedValue([]) };
+      (MODEL.generalInformation.find as jest.Mock).mockReturnValue(emptyFind);
+      (MODEL.Experience.find as jest.Mock).mockReturnValue(emptyFind);
+      (MODEL.Education.find as jest.Mock).mockReturnValue(emptyFind);
+      (MODEL.Reference.find as jest.Mock).mockReturnValue(emptyFind);
+      (MODEL.Project.find as jest.Mock).mockReturnValue(emptyFind);
+      (MODEL.Certificate.find as jest.Mock).mockReturnValue(emptyFind);
+      (MODEL.Award.find as jest.Mock).mockReturnValue(emptyFind);
+    });
+
+    it('never queries Profile when no profile param is given (existing share-links unaffected)', async () => {
+      await handlerGetAboutMe('votan.it@gmail.com', 'vi');
+
+      expect(MODEL.Profile.findOne).not.toHaveBeenCalled();
+      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
+    });
+
+    it('filters each section by the resolved profile\'s id lists', async () => {
+      const educationIds = ['507f1f77bcf86cd799439012'];
+      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({
+        exec: jest
+          .fn()
+          .mockResolvedValue({ educationIds, experienceIds: [], projectIds: [], certificateIds: [], awardIds: [], referenceIds: [] }),
+      });
+
+      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '507f1f77bcf86cd799439099');
+
+      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: educationIds } }), expect.anything());
+      expect(MODEL.Experience.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: [] } }), expect.anything());
+      // generalInformation has no id list on Profile — must stay unfiltered.
+      expect(MODEL.generalInformation.find).toHaveBeenCalledWith(
+        expect.not.objectContaining({ _id: expect.anything() }),
+        expect.anything(),
+      );
+    });
+
+    it('falls back to unfiltered data when the given profile id does not resolve for this candidate', async () => {
+      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
+
+      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '507f1f77bcf86cd799439099');
+
+      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
+    });
+
+    it('never queries Profile when the given id is rejected by QuerySafe (e.g. contains "$")', async () => {
+      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '$where:1');
+
+      expect(MODEL.Profile.findOne).not.toHaveBeenCalled();
+      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
+    });
+  });
 });
diff --git a/src/candidate/candidate.service.ts b/src/candidate/candidate.service.ts
index ba9edc5..9ed7e54 100644
--- a/src/candidate/candidate.service.ts
+++ b/src/candidate/candidate.service.ts
@@ -26,6 +26,7 @@ const CV_SECTION_MODELS: any[] = [
   MODELS.Certificate,
   MODELS.Award,
   MODELS.Application,
+  MODELS.Profile,
 ];
 
 // Only these 3 have an images[] field (issue #72) — same on-disk-file
diff --git a/src/candidate_me/index.ts b/src/candidate_me/index.ts
index 94634ba..2b654f5 100644
--- a/src/candidate_me/index.ts
+++ b/src/candidate_me/index.ts
@@ -27,13 +27,18 @@ const resolveLocalizedText = (value: any, lang: string): string => {
 export const fnGetAboutMe = async (req: Request, res: Response, next: NextFunction) => {
   const { email } = req.params;
   const lang = req.query.lang === 'en' ? 'en' : 'vi';
+  // Optional CV profile filter (issue #133) — a named subset of the
+  // candidate's own Education/Experience/Project/Certificate/Award/
+  // Reference entries. Omitted -> unchanged behavior (everything), so
+  // existing share-links keep working.
+  const profileId = typeof req.query.profile === 'string' ? req.query.profile : undefined;
   if (!email) res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));
 
   /**
    * get data
    */
   try {
-    const _me = await handlerGetAboutMe(email, lang);
+    const _me = await handlerGetAboutMe(email, lang, profileId);
     // Private profile (issue #75) — same response shape as "email not
     // found" so a private profile isn't distinguishable from a
     // non-existent one. Only gates this public route; the authenticated
@@ -49,7 +54,20 @@ export const fnGetAboutMe = async (req: Request, res: Response, next: NextFuncti
   }
 };
 
-export const handlerGetAboutMe = async (identifier: string, lang: string = 'vi') => {
+// Maps a CV-section collection name to the array field on a Profile
+// document that lists which of that section's ids belong to it.
+// generalInformation has no entry — it's a single document per candidate,
+// not a selectable list.
+const PROFILE_ID_FIELDS: Record<string, string> = {
+  experiences: 'experienceIds',
+  educations: 'educationIds',
+  references: 'referenceIds',
+  projects: 'projectIds',
+  certificates: 'certificateIds',
+  awards: 'awardIds',
+};
+
+export const handlerGetAboutMe = async (identifier: string, lang: string = 'vi', profileId?: string) => {
   const removeFields = { __v: 0, createdAt: 0, updatedAt: 0, candidateId: 0 };
 
   const { candidateQuerySafe } = await import('@/utils/querySafe');
@@ -69,6 +87,20 @@ export const handlerGetAboutMe = async (identifier: string, lang: string = 'vi')
 
   const { _id } = document;
 
+  // Resolve the optional profile filter (issue #133) — must belong to this
+  // same candidate; an invalid/foreign/deleted profile id is treated the
+  // same as "no profile given" (falls back to unfiltered) rather than
+  // erroring, since this is a public, unauthenticated route.
+  let profileDoc: Record<string, any> | null = null;
+  if (profileId) {
+    const { idQuerySafe: profileIdQuerySafe } = await import('@/utils/querySafe');
+    const safeProfileIdQuery = profileIdQuerySafe.safeQuery({}, { _id: profileId });
+    profileDoc =
+      '_id' in safeProfileIdQuery
+        ? await MODEL.Profile.findOne({ ...safeProfileIdQuery, candidateId: _id, deletedAt: null }).exec()
+        : null;
+  }
+
   /**
    * lấy thông tin liên quan [học vấn, kinh nghiệm, người liên hệ]
    */
@@ -95,8 +127,15 @@ export const handlerGetAboutMe = async (identifier: string, lang: string = 'vi')
     // candidateId filter, so this query returned EVERY candidate's CV
     // section data unfiltered.
     const safeCandidateQuery = idQuerySafe.safeQuery({}, { candidateId: _id?.toString() || '' });
+    // Profile filter (issue #133): the id list comes from the already
+    // ownership-checked `profileDoc` above (server-derived, not raw user
+    // input), so it's safe to merge in directly rather than through
+    // QuerySafe, which only accepts string values anyway.
+    const profileIdsField = PROFILE_ID_FIELDS[collection];
+    const sectionQuery =
+      profileDoc && profileIdsField ? { ...safeCandidateQuery, _id: { $in: profileDoc[profileIdsField] || [] } } : safeCandidateQuery;
     const _find: undefined | Record<string, any> | Record<string, any>[] = await model
-      .find(safeCandidateQuery, { _id: 0, ...removeFields })
+      .find(sectionQuery, { _id: 0, ...removeFields })
       .exec();
     if (!_find) continue;
     // Flatten Mongoose documents to plain objects immediately (same as
diff --git a/src/candidate_profile/BaseController.ts b/src/candidate_profile/BaseController.ts
index 3e7b157..901da00 100644
--- a/src/candidate_profile/BaseController.ts
+++ b/src/candidate_profile/BaseController.ts
@@ -28,6 +28,7 @@ const modelObject: { [key: string]: any } = {
   certificates: MODELS.Certificate,
   awards: MODELS.Award,
   applications: MODELS.Application,
+  profiles: MODELS.Profile,
 };
 
 export const baseGetAll = async (req: Request, res: Response, next: NextFunction) => {
diff --git a/src/config/swagger.config.ts b/src/config/swagger.config.ts
index 6cc1bf6..1914b59 100644
--- a/src/config/swagger.config.ts
+++ b/src/config/swagger.config.ts
@@ -246,6 +246,22 @@ const options: swaggerJsdoc.Options = {
             createdAt: { type: 'string', format: 'date-time' },
           },
         },
+        Profile: {
+          type: 'object',
+          description:
+            'A named subset of the candidate\'s own Education/Experience/Project/Certificate/Award/Reference entries, selectable via ?profile= on GET /api/me/{email}. A "Tổng hợp" (All) profile is synthesized automatically on first GET /api/v1/profile if the candidate has none yet.',
+          properties: {
+            _id: { type: 'string' },
+            candidateId: { type: 'string' },
+            name: { type: 'string' },
+            educationIds: { type: 'array', items: { type: 'string' } },
+            experienceIds: { type: 'array', items: { type: 'string' } },
+            projectIds: { type: 'array', items: { type: 'string' } },
+            certificateIds: { type: 'array', items: { type: 'string' } },
+            awardIds: { type: 'array', items: { type: 'string' } },
+            referenceIds: { type: 'array', items: { type: 'string' } },
+          },
+        },
         GeneralInformation: {
           type: 'object',
           properties: {
diff --git a/src/models/index.ts b/src/models/index.ts
index b256483..a56fa2c 100644
--- a/src/models/index.ts
+++ b/src/models/index.ts
@@ -5,8 +5,9 @@ import Certificate from './certificate.model';
 import Education from './education.model';
 import Experience from './experience.model';
 import generalInformation from './generalInformation.model';
+import Profile from './profile.model';
 import Project from './project.model';
 import Reference from './reference.modal';
 import Visit from './visit.model';
 
-export { Application, Award, Candidate, Certificate, Education, Experience, generalInformation, Project, Reference, Visit };
+export { Application, Award, Candidate, Certificate, Education, Experience, generalInformation, Profile, Project, Reference, Visit };
diff --git a/src/routers/api/v1/index.ts b/src/routers/api/v1/index.ts
index bff3032..c0dcb94 100644
--- a/src/routers/api/v1/index.ts
+++ b/src/routers/api/v1/index.ts
@@ -20,6 +20,7 @@ import routeProject from './project.route';
 import routeCertificate from './certificate.route';
 import routeAward from './award.route';
 import routeApplication from './application.route';
+import routeProfile from './profile.route';
 import { fnExportPDF } from '@/candidate_me/index';
 
 router.use('/auth', routeAuth);
@@ -32,6 +33,7 @@ router.use('/general-information', verifyToken, routeGeneralInformation);
 router.use('/project', verifyToken, routeProject);
 router.use('/certificate', verifyToken, routeCertificate);
 router.use('/application', verifyToken, routeApplication);
+router.use('/profile', verifyToken, routeProfile);
 
 /**
  * @swagger
diff --git a/src/routers/index.ts b/src/routers/index.ts
index 62bd87e..c55b87b 100644
--- a/src/routers/index.ts
+++ b/src/routers/index.ts
@@ -46,9 +46,15 @@ router.use('/api/v2', routerAPIV2);
  *           enum: [vi, en]
  *           default: vi
  *         description: Language to resolve localized free-text fields (introduction, section descriptions, career/careerGoal) into. Falls back to whichever language has content if the requested one is empty.
+ *       - in: query
+ *         name: profile
+ *         required: false
+ *         schema:
+ *           type: string
+ *         description: CV profile id (see /api/v1/profile) — when given, filters each CV section down to the ids listed on that profile. Omitted, or an id that doesn't resolve to a profile owned by this candidate, returns every section unfiltered (existing share-links unaffected).
  *     responses:
  *       200:
- *         description: Aggregated public profile (candidate + general information + all CV sections)
+ *         description: Aggregated public profile (candidate + general information + all CV sections, optionally filtered by ?profile=)
  *         content:
  *           application/json:
  *             schema:
diff --git a/src/types/base.type.ts b/src/types/base.type.ts
index 66762de..48c7abe 100644
--- a/src/types/base.type.ts
+++ b/src/types/base.type.ts
@@ -15,4 +15,5 @@ export enum Collections {
   CERTIFICATE = 'certificates',
   AWARD = 'awards',
   APPLICATION = 'applications',
+  PROFILE = 'profiles',
 }
```
