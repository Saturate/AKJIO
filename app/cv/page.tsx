import { cvData } from "@/data/cv";
import { format as formatDate } from "date-fns";
import { ExternalLink } from "lucide-react";
import { generateProfilePageSchema } from "@/utils/generateJsonLd";
import JsonLd from "@/components/JsonLd/JsonLd";
import styles from "./page.module.css";

export const metadata = {
  title: "CV - Allan Kimmer Jensen",
  description:
    "Curriculum Vitae - 15+ years experience in software architecture, frontend development, and security.",
};

const placementLabels: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  "3rd": "3rd place",
  "2nd": "2nd place",
  "1st": "1st place",
  winner: "Winner",
  finalist: "Finalist",
};

function formatDateRange(start?: string, end?: string | "present") {
  if (!start && !end) return null;

  const formattedStart = start
    ? formatDate(new Date(start + "-01"), "MMM yyyy")
    : "";

  if (!end || end === "present") {
    return start ? `${formattedStart} - Present` : "Present";
  }

  const formattedEnd = formatDate(new Date(end + "-01"), "MMM yyyy");
  return start ? `${formattedStart} - ${formattedEnd}` : formattedEnd;
}

export default function CVPage() {
  return (
    <div className={styles.cv}>
      <header className={styles.header}>
        <h1>Curriculum Vitae</h1>
        <p className={styles.subtitle}>
          15+ years experience • 200+ projects • Architecture • Frontend •
          Security
        </p>
      </header>

      {/* Work Experience */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Work Experience</h2>
        {cvData.work.map((work) => {
          const relatedProjects = cvData.projects.filter(
            (p) => p.relatedTo === work.id
          );

          return (
            <article key={work.id} className={styles.workItem}>
              <div className={styles.workHeader}>
                <div>
                  <h3 className={styles.workTitle}>
                    {work.url ? (
                      <a
                        href={work.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {work.company}
                      </a>
                    ) : (
                      work.company
                    )}
                  </h3>
                  <p className={styles.workPosition}>{work.position}</p>
                  {work.location && (
                    <p className={styles.workLocation}>{work.location}</p>
                  )}
                </div>
                <time className={styles.dateRange}>
                  {formatDateRange(work.dateRange.start, work.dateRange.end)}
                </time>
              </div>

              <p className={styles.summary}>{work.summary}</p>

              {work.highlights.length > 0 && (
                <ul className={styles.highlights}>
                  {work.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              )}

              {work.technologies.length > 0 && (
                <div className={styles.technologies}>
                  {work.technologies.map((tech) => (
                    <span key={tech} className={styles.tag}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {relatedProjects.length > 0 && (
                <details className={styles.projects}>
                  <summary>
                    Projects ({relatedProjects.length})
                  </summary>
                  <ul>
                    {relatedProjects.map((project) => (
                      <li key={project.id}>
                        <strong>{project.name}</strong>
                        {project.url && (
                          <a href={project.url} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {formatDateRange(project.dateRange.start, project.dateRange.end) && (
                          <> ({formatDateRange(project.dateRange.start, project.dateRange.end)})</>
                        )}
                        <p>{project.description}</p>
                        {project.technologies.length > 0 && (
                          <div className={styles.technologies}>
                            {project.technologies.map((tech) => (
                              <span key={tech} className={styles.tagSmall}>{tech}</span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          );
        })}
      </section>

      {/* Featured Projects */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured Projects</h2>
        {cvData.projects
          .filter((p) => p.featured)
          .map((project) => (
            <article key={project.id} className={styles.projectItem}>
              <div className={styles.projectHeader}>
                <h3 className={styles.projectTitle}>
                  {project.url ? (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.name}
                    </a>
                  ) : (
                    project.name
                  )}
                </h3>
                <time className={styles.dateRange}>
                  {formatDateRange(
                    project.dateRange.start,
                    project.dateRange.end
                  )}
                </time>
              </div>

              <p className={styles.summary}>{project.description}</p>

              {project.highlights.length > 0 && (
                <ul className={styles.highlights}>
                  {project.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              )}

              {project.technologies.length > 0 && (
                <div className={styles.technologies}>
                  {project.technologies.map((tech) => (
                    <span key={tech} className={styles.tag}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
      </section>

      {/* Education */}
      {cvData.education.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>
          {cvData.education.map((edu) => (
            <article key={edu.id} className={styles.educationItem}>
              <div className={styles.educationHeader}>
                <div>
                  <h3 className={styles.educationTitle}>
                    {edu.url ? (
                      <a
                        href={edu.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {edu.institution}
                      </a>
                    ) : (
                      edu.institution
                    )}
                  </h3>
                  <p className={styles.educationDegree}>
                    {edu.studyType} in {edu.area}
                  </p>
                </div>
                <time className={styles.dateRange}>
                  {formatDateRange(edu.dateRange.start, edu.dateRange.end)}
                </time>
              </div>
              {edu.highlights && edu.highlights.length > 0 && (
                <ul className={styles.highlights}>
                  {edu.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}

      {/* Certifications */}
      {cvData.certifications.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Certifications</h2>
          {cvData.certifications.map((cert) => (
            <article key={cert.id} className={styles.certItem}>
              <h3 className={styles.certTitle}>
                {cert.url ? (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer">
                    {cert.name}
                  </a>
                ) : (
                  cert.name
                )}
              </h3>
              <p className={styles.certIssuer}>
                {cert.issuer} • {formatDate(new Date(cert.date), "MMM yyyy")}
              </p>
            </article>
          ))}
        </section>
      )}

      {/* Awards */}
      {cvData.awards.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Awards</h2>
          {cvData.awards.map((award) => (
            <article key={award.id} className={styles.awardItem}>
              <div className={styles.awardHeader}>
                <div>
                  <h3 className={styles.awardTitle}>
                    {award.url ? (
                      <a href={award.url} target="_blank" rel="noopener noreferrer">
                        {award.category}
                      </a>
                    ) : (
                      award.category
                    )}
                  </h3>
                  <p className={styles.awardMeta}>
                    {award.name} • {award.issuer} • {award.date}
                  </p>
                </div>
                <span className={styles.awardPlacement} data-placement={award.placement}>
                  {placementLabels[award.placement] ?? award.placement}
                </span>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Skills */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skills</h2>
        <div className={styles.skillsGrid}>
          {cvData.skills.map((skillGroup) => (
            <div key={skillGroup.category} className={styles.skillCategory}>
              <h3 className={styles.skillCategoryTitle}>
                {skillGroup.category}
              </h3>
              <div className={styles.technologies}>
                {skillGroup.items.map((skill) => (
                  <span key={skill.name} className={styles.tag}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Publications */}
      {/* {cvData.publications.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Publications & Writing</h2>
          {cvData.publications.map((pub) => (
            <article key={pub.id} className={styles.publicationItem}>
              <h3 className={styles.publicationTitle}>
                {pub.url ? (
                  <a href={pub.url} target="_blank" rel="noopener noreferrer">
                    {pub.title}
                  </a>
                ) : (
                  pub.title
                )}
              </h3>
              {pub.venue && (
                <p className={styles.publicationVenue}>{pub.venue}</p>
              )}
              {pub.description && (
                <p className={styles.summary}>{pub.description}</p>
              )}
            </article>
          ))}
        </section>
      )} */}
      <JsonLd data={generateProfilePageSchema(cvData.work, cvData.skills)} />
    </div>
  );
}
