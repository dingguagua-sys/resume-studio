import type { ResumeData, SectionKey } from "../types/resume";

export function SectionSummary({ data }: { data: ResumeData }) {
  const t = data.basics.summary?.trim();
  if (!t) return null;
  return (
    <section className="cv-sec">
      <h2 className="cv-sec-title">个人总结</h2>
      <p className="cv-sec-body">{t}</p>
    </section>
  );
}

export function SectionExperience({ data }: { data: ResumeData }) {
  if (!data.experience.length) return null;
  return (
    <section className="cv-sec">
      <h2 className="cv-sec-title">工作经历</h2>
      <ul className="cv-list">
        {data.experience.map((e) => (
          <li key={e.id} className="cv-card">
            <div className="cv-card-head">
              <div>
                <div className="cv-strong">{e.role}</div>
                <div className="cv-muted">{e.company}</div>
              </div>
              <div className="cv-dates">
                {e.start} — {e.end}
              </div>
            </div>
            <ul className="cv-bullets">
              {e.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SectionEducation({ data }: { data: ResumeData }) {
  if (!data.education.length) return null;
  return (
    <section className="cv-sec">
      <h2 className="cv-sec-title">教育背景</h2>
      <ul className="cv-list">
        {data.education.map((ed) => (
          <li key={ed.id} className="cv-card">
            <div className="cv-card-head">
              <div>
                <div className="cv-strong">{ed.school}</div>
                <div className="cv-muted">
                  {ed.degree} · {ed.field}
                </div>
              </div>
              <div className="cv-dates">
                {ed.start} — {ed.end}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SectionSkills({ data }: { data: ResumeData }) {
  if (!data.skills.length) return null;
  return (
    <section className="cv-sec">
      <h2 className="cv-sec-title">技能</h2>
      <div className="cv-skills">
        {data.skills.map((s) => (
          <span key={s.id} className="cv-chip">
            {s.name}
            {s.level ? <span className="cv-chip-sub">{s.level}</span> : null}
          </span>
        ))}
      </div>
    </section>
  );
}

export function SectionProjects({ data }: { data: ResumeData }) {
  if (!data.projects.length) return null;
  return (
    <section className="cv-sec">
      <h2 className="cv-sec-title">项目</h2>
      <ul className="cv-list">
        {data.projects.map((p) => (
          <li key={p.id} className="cv-card">
            <div className="cv-card-head">
              <div className="cv-strong">{p.name}</div>
              {p.link ? (
                <a className="cv-link" href={p.link}>
                  {p.link}
                </a>
              ) : null}
            </div>
            <p className="cv-sec-body">{p.description}</p>
            {p.tech ? <div className="cv-muted cv-tech">{p.tech}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function renderSection(key: SectionKey, data: ResumeData) {
  switch (key) {
    case "summary":
      return <SectionSummary key="summary" data={data} />;
    case "experience":
      return <SectionExperience key="experience" data={data} />;
    case "education":
      return <SectionEducation key="education" data={data} />;
    case "skills":
      return <SectionSkills key="skills" data={data} />;
    case "projects":
      return <SectionProjects key="projects" data={data} />;
    default:
      return null;
  }
}
