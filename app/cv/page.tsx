import { cvData } from "@/data/cv";
import { format as formatDate } from "date-fns";
import styles from "./page.module.css";

export const metadata = {
  title: "CV - Allan Kimmer Jensen",
  description:
    "Curriculum Vitae - 15+ years experience in software architecture, frontend development, and security.",
};

function formatDateRange(start: string, end?: string | "present") {
  const startDate = new Date(start + "-01");
  const formattedStart = formatDate(startDate, "MMM yyyy");

  if (!end || end === "present") {
    return `${formattedStart} - Present`;
  }

  const endDate = new Date(end + "-01");
  const formattedEnd = formatDate(endDate, "MMM yyyy");
  return `${formattedStart} - ${formattedEnd}`;
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
                        <strong>{project.name}</strong> (
                        {formatDateRange(
                          project.dateRange.start,
                          project.dateRange.end
                        )}
                        )
                        <p>{project.description}</p>
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

      {/* Skills */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skills</h2>
        <div className={styles.skillsGrid}>
          {cvData.skills.map((skillGroup) => (
            <div key={skillGroup.category} className={styles.skillCategory}>
              <h3 className={styles.skillCategoryTitle}>
                {skillGroup.category}
              </h3>
              <ul className={styles.skillList}>
                {skillGroup.items.map((skill) => (
                  <li key={skill.name}>
                    <span className={styles.skillName}>{skill.name}</span>
                    {skill.proficiency && (
                      <span className={styles.proficiency}>
                        {skill.proficiency}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
    </div>
  );
}
