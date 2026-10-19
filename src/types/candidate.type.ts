/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

export interface socialMedia {
  github?: string;
  linkedin?: string;
  website?: string;
}

export interface informationPersonal extends socialMedia {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  introduction: string;
}

export interface Item {
  title: string;
  subTitle: string;
  startDate: number;
  endDate: number | null;
  isCurrent: boolean;
  description: string;
  // `| undefined` (`exactOptionalPropertyTypes`): createPDF.ts's
  // renderExperience/renderProject destructure ExperienceData.skills /
  // ProjectData.technology (both legitimately optional) straight through.
  skills?: string[] | undefined;
}

export interface Skill {
  name: string;
  exp?: number;
  group?: string;
}

export interface Language {
  language: string;
  level: string;
}

export interface Reference {
  fullName: string;
  phone: string;
  company: string;
  position: string;
}

export interface Certificate {
  name: string;
  organization: string;
  description?: string;
  startDate: number;
  endDate: number;
  isNoExpiration: boolean;
  link?: string;
  images?: string[];
}

export interface Award {
  name: string;
  organization: string;
  issueDate: number;
  link?: string;
  images?: string[];
  description?: string;
}

export interface EducationData {
  school: string;
  major: string;
  startDate: number;
  endDate: number | null;
  isCurrent: boolean;
  description: string;
}

export interface ExperienceData {
  company: string;
  position: string;
  startDate: number;
  endDate: number | null;
  isCurrent: boolean;
  description: string;
  skills?: string[];
  isCareerBreak?: boolean;
  careerBreakType?: string;
}

export interface ProjectData {
  name: string;
  position: string;
  startDate: number;
  endDate: number | null;
  isWorking: boolean;
  description: string;
  technology?: string[];
}

export interface GeneralInformationData {
  career?: string;
  careerGoal?: string;
  personalSkills?: Skill[];
  professionalSkills?: Skill[];
  professionalSkillsGroup?: string[];
  foreignLanguages?: Language[];
}

/**
 * The aggregated public-profile record both export services (PDF,
 * `createPDF.ts`, and DOCX, `createDocx.ts`) consume — the same shape
 * `candidate_me/index.ts`'s `handlerGetAboutMe` assembles. That function's
 * own return type isn't formally declared yet — its `dataResult` is
 * built via `JSON.parse(JSON.stringify(document))`, which TypeScript
 * always infers as `any` (a known, deliberately deferred gap). Declaring
 * the shape HERE still gives both export services real internal type
 * checking on every field they read, even though the upstream caller
 * boundary stays loose until that's addressed.
 */
export interface AggregatedCandidateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  introduction?: string;
  socialMedia?: socialMedia;
  generalInformation?: GeneralInformationData | GeneralInformationData[];
  educations?: EducationData[];
  experiences?: ExperienceData[];
  projects?: ProjectData[];
  references?: Reference[];
  certificates?: Certificate[];
  awards?: Award[];
}
