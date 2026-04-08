export type DateRange = {
  start: string; // ISO8601: "2023-01" or "2023-01-15"
  end?: string | "present";
};

export type CVTag = string; // e.g., "security", "saas", "high-stakes"

export type WorkExperience = {
  id: string;
  type: "employment" | "consulting";
  company: string;
  position: string;
  location?: string;
  dateRange: DateRange;
  summary: string;
  highlights: string[]; // Bullet points
  technologies: string[]; // For filtering
  tags: CVTag[]; // For filtering
  url?: string;
  featured?: boolean;
};

export type Project = {
  id: string;
  name: string;
  type: "open-source" | "side-project" | "client-work" | "internal-tool";
  dateRange: DateRange;
  description: string;
  highlights: string[];
  technologies: string[];
  tags: CVTag[];
  url?: string;
  featured?: boolean;
  relatedTo?: string; // Link to WorkExperience.id
};

export type Education = {
  id: string;
  institution: string;
  area: string; // Field of study
  studyType: string; // "Bachelor", "Master", "Certificate"
  dateRange: DateRange;
  score?: string;
  url?: string;
  highlights?: string[];
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  expires?: string;
  tags: CVTag[];
};

export type Publication = {
  id: string;
  type: "blog-post" | "talk" | "ctf-writeup" | "security-research" | "article";
  title: string;
  venue?: string;
  date: string;
  url?: string;
  description?: string;
  tags: CVTag[];
  featured?: boolean;
};

export type Technology = {
  name: string;
  proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
  keywords?: string[];
};

export type Skill = {
  category: string; // "Languages", "Frontend", "Security", etc.
  items: Technology[];
};

export type CVData = {
  work: WorkExperience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  publications: Publication[];
  skills: Skill[];
};
