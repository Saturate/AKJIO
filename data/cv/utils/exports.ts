import type { CVData } from "../types";

// JSON Resume schema: https://jsonresume.org/schema/
type JsonResume = {
  basics: {
    name?: string;
    label?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      city?: string;
      countryCode?: string;
      region?: string;
    };
    profiles?: Array<{
      network: string;
      username?: string;
      url: string;
    }>;
  };
  work: Array<{
    name: string;
    position: string;
    url?: string;
    startDate: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education: Array<{
    institution: string;
    url?: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  skills: Array<{
    name: string;
    level?: string;
    keywords?: string[];
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
  }>;
  publications?: Array<{
    name: string;
    publisher?: string;
    releaseDate?: string;
    url?: string;
    summary?: string;
  }>;
  certificates?: Array<{
    name: string;
    date?: string;
    issuer?: string;
    url?: string;
  }>;
};

/**
 * Convert CVData to JSON Resume format
 * https://jsonresume.org/schema/
 */
export function toJsonResume(
  cvData: CVData,
  basics?: JsonResume["basics"]
): JsonResume {
  return {
    basics: basics || {
      name: "Allan Kimmer Jensen",
      label: "Solution Architect | Frontend • Security • DevOps/DX | 15+ Years • 200+ Projects",
      url: "https://akj.io",
      summary:
        "I build practical, business-aligned software that people actually enjoy using. Over the years I've contributed to (roughly) 200 client projects spanning B2B platforms, B2C products, SaaS applications, and rich information/visual systems. Deeply technical, yes — but always human-centered. If it doesn't serve the user, it's not done.",
      location: {
        city: "Copenhagen",
        countryCode: "DK",
        region: "Capital Region of Denmark",
      },
      profiles: [
        {
          network: "Website",
          url: "https://akj.io",
        },
        {
          network: "LinkedIn",
          url: "https://www.linkedin.com/in/allankimmerjensen",
        },
        {
          network: "GitHub",
          username: "Saturate",
          url: "https://github.com/Saturate",
        },
        {
          network: "Company",
          url: "https://remmik.com",
        },
      ],
    },
    work: cvData.work.map((work) => ({
      name: work.company,
      position: work.position,
      url: work.url,
      startDate: work.dateRange.start,
      endDate:
        work.dateRange.end === "present" ? undefined : work.dateRange.end,
      summary: work.summary,
      highlights: work.highlights,
    })),
    education: cvData.education.map((edu) => ({
      institution: edu.institution,
      url: edu.url,
      area: edu.area,
      studyType: edu.studyType,
      startDate: edu.dateRange.start,
      endDate:
        edu.dateRange.end === "present" ? undefined : edu.dateRange.end,
      score: edu.score,
      courses: edu.highlights,
    })),
    skills: cvData.skills.flatMap((skillGroup) =>
      skillGroup.items.map((tech) => ({
        name: tech.name,
        level: tech.proficiency,
        keywords: tech.keywords || [],
      }))
    ),
    projects: cvData.projects.map((project) => ({
      name: project.name,
      description: project.description,
      highlights: project.highlights,
      keywords: project.technologies,
      startDate: project.dateRange.start,
      endDate:
        project.dateRange.end === "present" ? undefined : project.dateRange.end,
      url: project.url,
      type: project.type,
    })),
    publications: cvData.publications.map((pub) => ({
      name: pub.title,
      publisher: pub.venue,
      releaseDate: pub.date,
      url: pub.url,
      summary: pub.description,
    })),
    certificates: cvData.certifications.map((cert) => ({
      name: cert.name,
      date: cert.date,
      issuer: cert.issuer,
      url: cert.url,
    })),
  };
}

/**
 * Export CVData as JSON Resume formatted string
 */
export function exportJsonResume(
  cvData: CVData,
  basics?: JsonResume["basics"]
): string {
  return JSON.stringify(toJsonResume(cvData, basics), null, 2);
}

/**
 * Placeholder for future PDF generation
 */
export function toPdfFormat(_cvData: CVData): unknown {
  // Future implementation: convert CVData to PDF-friendly format
  // Could use libraries like puppeteer, react-pdf, or pdfkit
  throw new Error("PDF export not yet implemented");
}
