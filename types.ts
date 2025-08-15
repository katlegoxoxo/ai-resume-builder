
export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  address: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate:string;
  isCurrent: boolean;
  description: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
}

export interface TemplateStyle {
  fontFamily: string;
  primaryColor: string;
}

export interface JobAnalysisResult {
  readonly matchScore: number;
  readonly keywordGaps: readonly string[];
  readonly improvementSuggestions: {
    readonly summary?: string;
    readonly experience?: string;
  };
  readonly missingSkills: readonly string[];
}

export interface ATSCheckResult {
    readonly atsScore: number;
    readonly suggestions: readonly string[];
}

export enum TemplateId {
  MODERN = 'modern',
  PROFESSIONAL = 'professional',
  CREATIVE = 'creative',
}