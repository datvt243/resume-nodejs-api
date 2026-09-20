export interface BaseReturn {
  type?: string;
  success?: boolean;
  message?: string;
  errors?: any;
  data?: Record<string, any>[] | Record<string, any> | null;
}

export enum Collections {
  INFORMATION = 'generalInformation',
  EXPERIENCE = 'experiences',
  EDUCATION = 'educations',
  REFERENCE = 'references',
  PROJECT = 'projects',
  CERTIFICATE = 'certificates',
  AWARD = 'awards',
  APPLICATION = 'applications',
}
