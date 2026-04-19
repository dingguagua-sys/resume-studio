import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { ResumeRenderer } from "../templates/ResumeRenderer";
import { DEFAULT_SECTION_ORDER, type ResumeData, type SectionKey, type TemplateId } from "../types/resume";

export default function SharePage() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(DEFAULT_SECTION_ORDER);
  const [data, setData] = useState<ResumeData | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!shareId) return;
      try {
        const { data: body } = await api.get<{
          resume: {
            title: string;
            templateId: string;
            sectionOrder: SectionKey[];
            data: ResumeData;
          };
        }>(`/public/resumes/${shareId}`);
        if (cancelled) return;
        setTitle(body.resume.title);
        setTemplateId((body.resume.templateId as TemplateId) || "classic");
        setSectionOrder(body.resume.sectionOrder?.length ? body.resume.sectionOrder : DEFAULT_SECTION_ORDER);
        setData(body.resume.data);
      } catch {
        if (!cancelled) setErr("分享不存在或已关闭");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (loading) {
    return (
      <div className="share-wrap">
        <p className="muted">加载中…</p>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="share-wrap">
        <p className="form-error">{err}</p>
        <Link to="/">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="share-wrap">
      <header className="share-bar">
        <div>
          <div className="share-badge">只读分享</div>
          <h1 className="share-title">{title}</h1>
        </div>
        <Link to="/login" className="btn primary">
          登录以编辑自己的简历
        </Link>
      </header>
      <div className="preview-outer">
        <div className="preview-scale">
          <ResumeRenderer templateId={templateId} data={data} sectionOrder={sectionOrder} />
        </div>
      </div>
    </div>
  );
}
