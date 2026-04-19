import { forwardRef } from "react";
import type { ResumeData, SectionKey, TemplateId } from "../types/resume";
import { renderSection } from "./sectionBlocks";

type Props = {
  templateId: TemplateId;
  data: ResumeData;
  sectionOrder: SectionKey[];
};

function BasicsBlock({ data, variant }: { data: ResumeData; variant: TemplateId }) {
  const b = data.basics;
  return (
    <header className={`cv-header cv-header--${variant}`}>
      <div>
        <h1 className="cv-name">{b.name || "姓名"}</h1>
        <p className="cv-headline">{b.headline || "职位 / 一句话介绍"}</p>
      </div>
      <div className="cv-contact">
        {[b.email, b.phone, b.location, b.website].filter(Boolean).map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </header>
  );
}

const FALLBACK_ORDER: SectionKey[] = ["summary", "experience", "education", "skills", "projects"];

const Shell = forwardRef<HTMLDivElement, Props & { className?: string }>(
  ({ templateId, data, sectionOrder, className }, ref) => {
    const order = sectionOrder.length ? sectionOrder : FALLBACK_ORDER;
    const asideKeys: SectionKey[] = ["summary", "skills"];
    const body =
      templateId === "classic" ? (
        <div className="cv-split">
          <aside className="cv-aside">
            {order.filter((k) => asideKeys.includes(k)).map((k) => renderSection(k, data))}
          </aside>
          <div className="cv-main">
            {order.filter((k) => !asideKeys.includes(k)).map((k) => renderSection(k, data))}
          </div>
        </div>
      ) : (
        <div className="cv-body">{order.map((k) => renderSection(k, data))}</div>
      );
    return (
      <div ref={ref} className={`cv-page cv-tpl-${templateId} ${className ?? ""}`}>
        <BasicsBlock data={data} variant={templateId} />
        {body}
      </div>
    );
  }
);
Shell.displayName = "ResumeShell";

/** Classic: sidebar contact + main */
export const ResumeClassic = forwardRef<HTMLDivElement, Props>((props, ref) => (
  <Shell {...props} ref={ref} className="cv-layout-classic" />
));
ResumeClassic.displayName = "ResumeClassic";

/** Modern: big name, airy */
export const ResumeModern = forwardRef<HTMLDivElement, Props>((props, ref) => (
  <Shell {...props} ref={ref} className="cv-layout-modern" />
));
ResumeModern.displayName = "ResumeModern";

/** Minimal: single column hairlines */
export const ResumeMinimal = forwardRef<HTMLDivElement, Props>((props, ref) => (
  <Shell {...props} ref={ref} className="cv-layout-minimal" />
));
ResumeMinimal.displayName = "ResumeMinimal";

/** Bold: dark top band */
export const ResumeBold = forwardRef<HTMLDivElement, Props>((props, ref) => (
  <Shell {...props} ref={ref} className="cv-layout-bold" />
));
ResumeBold.displayName = "ResumeBold";

/** Academic: serif title, formal */
export const ResumeAcademic = forwardRef<HTMLDivElement, Props>((props, ref) => (
  <Shell {...props} ref={ref} className="cv-layout-academic" />
));
ResumeAcademic.displayName = "ResumeAcademic";

const MAP = {
  classic: ResumeClassic,
  modern: ResumeModern,
  minimal: ResumeMinimal,
  bold: ResumeBold,
  academic: ResumeAcademic,
} as const;

export const ResumeRenderer = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const Cmp = MAP[props.templateId] ?? ResumeClassic;
  return <Cmp ref={ref} {...props} />;
});
ResumeRenderer.displayName = "ResumeRenderer";
