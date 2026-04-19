import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { SortableSections } from "../components/SortableSections";
import { exportResumePdf } from "../lib/exportPdf";
import { ResumeRenderer } from "../templates/ResumeRenderer";
import {
  DEFAULT_SECTION_ORDER,
  type ResumeData,
  type SectionKey,
  type TemplateId,
  TEMPLATE_OPTIONS,
} from "../types/resume";

function uid() {
  return crypto.randomUUID();
}

export default function EditorPage() {
  const { id } = useParams();
  const printRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(DEFAULT_SECTION_ORDER);
  const [data, setData] = useState<ResumeData | null>(null);
  const [shareId, setShareId] = useState<string | undefined>();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfBanner, setPdfBanner] = useState<{ ok: boolean; text: string } | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfBanner) return;
    const t = window.setTimeout(() => setPdfBanner(null), 14000);
    return () => window.clearTimeout(t);
  }, [pdfBanner]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const { data: body } = await api.get<{
        resume: {
          title: string;
          templateId: string;
          sectionOrder: SectionKey[];
          data: ResumeData;
          shareId?: string;
        };
      }>(`resumes/${id}`);
      if (cancelled) return;
      setTitle(body.resume.title);
      setTemplateId((body.resume.templateId as TemplateId) || "classic");
      setSectionOrder(
        body.resume.sectionOrder?.length ? body.resume.sectionOrder : DEFAULT_SECTION_ORDER
      );
      setData(body.resume.data);
      setShareId(body.resume.shareId);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!loaded || !id) return;
    const t = window.setTimeout(() => {
      void api.put(`resumes/${id}`, {
        title,
        templateId,
        sectionOrder,
        data,
      });
    }, 750);
    return () => window.clearTimeout(t);
  }, [loaded, id, title, templateId, sectionOrder, data]);

  const patchBasics = useCallback((patch: Partial<ResumeData["basics"]>) => {
    setData((d) => (d ? { ...d, basics: { ...d.basics, ...patch } } : d));
  }, []);

  const exportPdf = useCallback(async () => {
    if (!printRef.current || !data) return;
    setPdfBanner(null);
    setPdfBusy(true);
    try {
      const { filename } = await exportResumePdf(printRef.current, title || "resume");
      setPdfBanner({
        ok: true,
        text: `已生成「${filename}」。文件由浏览器保存到默认「下载」目录（Mac 打开访达 → 左侧「下载」；Windows 为「下载」文件夹）。若没有出现文件，请查看地址栏右侧是否拦截了下载。`,
      });
    } catch (e) {
      setPdfBanner({
        ok: false,
        text: `导出失败：${e instanceof Error ? e.message : String(e)}。可将浏览器缩放设为 100% 后重试。`,
      });
    } finally {
      setPdfBusy(false);
    }
  }, [data, title]);

  const enableShare = useCallback(async () => {
    if (!id) return;
    setShareMsg(null);
    const { data: body } = await api.post<{ shareId: string }>(`resumes/${id}/share`);
    setShareId(body.shareId);
    const url = `${window.location.origin}/share/${body.shareId}`;
    setShareMsg(`分享链接：${url}`);
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg(`已复制链接：${url}`);
    } catch {
      /* ignore */
    }
  }, [id]);

  const disableShare = useCallback(async () => {
    if (!id) return;
    await api.delete(`resumes/${id}/share`);
    setShareId(undefined);
    setShareMsg("已关闭分享");
  }, [id]);

  if (!data) {
    return (
      <div className="shell">
        <p className="muted" style={{ padding: 24 }}>
          加载中…
        </p>
      </div>
    );
  }

  function renderPanel(key: SectionKey) {
    switch (key) {
      case "summary":
        return (
          <label className="field block">
            <textarea
              rows={4}
              value={data.basics.summary}
              onChange={(e) => patchBasics({ summary: e.target.value })}
            />
          </label>
        );
      case "experience":
        return (
          <div className="stack">
            {data.experience.map((ex, idx) => (
              <div key={ex.id} className="card-form">
                <div className="row2">
                  <label className="field">
                    <span>公司</span>
                    <input
                      value={ex.company}
                      onChange={(e) => {
                        const next = [...data.experience];
                        next[idx] = { ...ex, company: e.target.value };
                        setData({ ...data, experience: next });
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>职位</span>
                    <input
                      value={ex.role}
                      onChange={(e) => {
                        const next = [...data.experience];
                        next[idx] = { ...ex, role: e.target.value };
                        setData({ ...data, experience: next });
                      }}
                    />
                  </label>
                </div>
                <div className="row2">
                  <label className="field">
                    <span>开始</span>
                    <input
                      value={ex.start}
                      onChange={(e) => {
                        const next = [...data.experience];
                        next[idx] = { ...ex, start: e.target.value };
                        setData({ ...data, experience: next });
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>结束</span>
                    <input
                      value={ex.end}
                      onChange={(e) => {
                        const next = [...data.experience];
                        next[idx] = { ...ex, end: e.target.value };
                        setData({ ...data, experience: next });
                      }}
                    />
                  </label>
                </div>
                <label className="field block">
                  <span>要点（每行一条）</span>
                  <textarea
                    rows={4}
                    value={ex.bullets.join("\n")}
                    onChange={(e) => {
                      const bullets = e.target.value.split("\n");
                      const next = [...data.experience];
                      next[idx] = { ...ex, bullets };
                      setData({ ...data, experience: next });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() =>
                    setData({ ...data, experience: data.experience.filter((x) => x.id !== ex.id) })
                  }
                >
                  删除本条
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn ghost small"
              onClick={() =>
                setData({
                  ...data,
                  experience: [
                    ...data.experience,
                    {
                      id: uid(),
                      company: "",
                      role: "",
                      start: "",
                      end: "",
                      bullets: [""],
                    },
                  ],
                })
              }
            >
              + 添加经历
            </button>
          </div>
        );
      case "education":
        return (
          <div className="stack">
            {data.education.map((ed, idx) => (
              <div key={ed.id} className="card-form">
                <div className="row2">
                  <label className="field">
                    <span>学校</span>
                    <input
                      value={ed.school}
                      onChange={(e) => {
                        const next = [...data.education];
                        next[idx] = { ...ed, school: e.target.value };
                        setData({ ...data, education: next });
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>学位</span>
                    <input
                      value={ed.degree}
                      onChange={(e) => {
                        const next = [...data.education];
                        next[idx] = { ...ed, degree: e.target.value };
                        setData({ ...data, education: next });
                      }}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>专业</span>
                  <input
                    value={ed.field}
                    onChange={(e) => {
                      const next = [...data.education];
                      next[idx] = { ...ed, field: e.target.value };
                      setData({ ...data, education: next });
                    }}
                  />
                </label>
                <div className="row2">
                  <label className="field">
                    <span>开始</span>
                    <input
                      value={ed.start}
                      onChange={(e) => {
                        const next = [...data.education];
                        next[idx] = { ...ed, start: e.target.value };
                        setData({ ...data, education: next });
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>结束</span>
                    <input
                      value={ed.end}
                      onChange={(e) => {
                        const next = [...data.education];
                        next[idx] = { ...ed, end: e.target.value };
                        setData({ ...data, education: next });
                      }}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() =>
                    setData({ ...data, education: data.education.filter((x) => x.id !== ed.id) })
                  }
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn ghost small"
              onClick={() =>
                setData({
                  ...data,
                  education: [
                    ...data.education,
                    { id: uid(), school: "", degree: "", field: "", start: "", end: "" },
                  ],
                })
              }
            >
              + 添加教育
            </button>
          </div>
        );
      case "skills":
        return (
          <div className="stack">
            {data.skills.map((sk, idx) => (
              <div key={sk.id} className="skill-editor-row">
                <label className="field">
                  <input
                    placeholder="技能名"
                    value={sk.name}
                    onChange={(e) => {
                      const next = [...data.skills];
                      next[idx] = { ...sk, name: e.target.value };
                      setData({ ...data, skills: next });
                    }}
                  />
                </label>
                <label className="field">
                  <input
                    placeholder="程度"
                    value={sk.level}
                    onChange={(e) => {
                      const next = [...data.skills];
                      next[idx] = { ...sk, level: e.target.value };
                      setData({ ...data, skills: next });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() => setData({ ...data, skills: data.skills.filter((x) => x.id !== sk.id) })}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn ghost small"
              onClick={() =>
                setData({
                  ...data,
                  skills: [...data.skills, { id: uid(), name: "", level: "" }],
                })
              }
            >
              + 添加技能
            </button>
          </div>
        );
      case "projects":
        return (
          <div className="stack">
            {data.projects.map((p, idx) => (
              <div key={p.id} className="card-form">
                <label className="field">
                  <span>项目名称</span>
                  <input
                    value={p.name}
                    onChange={(e) => {
                      const next = [...data.projects];
                      next[idx] = { ...p, name: e.target.value };
                      setData({ ...data, projects: next });
                    }}
                  />
                </label>
                <label className="field">
                  <span>链接</span>
                  <input
                    value={p.link}
                    onChange={(e) => {
                      const next = [...data.projects];
                      next[idx] = { ...p, link: e.target.value };
                      setData({ ...data, projects: next });
                    }}
                  />
                </label>
                <label className="field block">
                  <span>描述</span>
                  <textarea
                    rows={2}
                    value={p.description}
                    onChange={(e) => {
                      const next = [...data.projects];
                      next[idx] = { ...p, description: e.target.value };
                      setData({ ...data, projects: next });
                    }}
                  />
                </label>
                <label className="field">
                  <span>技术栈</span>
                  <input
                    value={p.tech}
                    onChange={(e) => {
                      const next = [...data.projects];
                      next[idx] = { ...p, tech: e.target.value };
                      setData({ ...data, projects: next });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() =>
                    setData({ ...data, projects: data.projects.filter((x) => x.id !== p.id) })
                  }
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn ghost small"
              onClick={() =>
                setData({
                  ...data,
                  projects: [
                    ...data.projects,
                    { id: uid(), name: "", description: "", link: "", tech: "" },
                  ],
                })
              }
            >
              + 添加项目
            </button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="shell editor-shell">
      <header className="shell-bar">
        <Link to="/app" className="logo">
          ← 工作台
        </Link>
        <div className="shell-bar-right wrap">
          <label className="field inline">
            <span className="sr-only">标题</span>
            <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <button type="button" className="btn ghost" disabled={pdfBusy} onClick={() => void exportPdf()}>
            {pdfBusy ? "导出中…" : "导出 PDF"}
          </button>
          {shareId ? (
            <>
              <button type="button" className="btn ghost" onClick={() => void disableShare()}>
                关闭分享
              </button>
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  void navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`)
                }
              >
                复制链接
              </button>
            </>
          ) : (
            <button type="button" className="btn primary" onClick={() => void enableShare()}>
              生成分享链接
            </button>
          )}
        </div>
      </header>
      {shareMsg ? <div className="banner-msg">{shareMsg}</div> : null}
      {pdfBanner ? (
        <div className={`banner-msg ${pdfBanner.ok ? "banner-msg--ok" : "banner-msg--err"}`}>{pdfBanner.text}</div>
      ) : null}
      <div className="editor-grid">
        <aside className="editor-side">
          <section className="panel">
            <h3>模板</h3>
            <div className="tpl-grid">
              {TEMPLATE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tpl-card ${templateId === t.id ? "on" : ""}`}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="tpl-name">{t.label}</span>
                  <span className="tpl-hint">{t.hint}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h3>基本信息</h3>
            <div className="stack">
              <label className="field">
                <span>姓名</span>
                <input value={data.basics.name} onChange={(e) => patchBasics({ name: e.target.value })} />
              </label>
              <label className="field">
                <span>标题</span>
                <input
                  value={data.basics.headline}
                  onChange={(e) => patchBasics({ headline: e.target.value })}
                />
              </label>
              <div className="row2">
                <label className="field">
                  <span>邮箱</span>
                  <input
                    value={data.basics.email}
                    onChange={(e) => patchBasics({ email: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>电话</span>
                  <input
                    value={data.basics.phone}
                    onChange={(e) => patchBasics({ phone: e.target.value })}
                  />
                </label>
              </div>
              <label className="field">
                <span>城市</span>
                <input
                  value={data.basics.location}
                  onChange={(e) => patchBasics({ location: e.target.value })}
                />
              </label>
              <label className="field">
                <span>网站</span>
                <input
                  value={data.basics.website}
                  onChange={(e) => patchBasics({ website: e.target.value })}
                />
              </label>
            </div>
          </section>
          <section className="panel">
            <h3>模块顺序（拖拽）</h3>
            <SortableSections order={sectionOrder} onChange={setSectionOrder} renderPanel={renderPanel} />
          </section>
        </aside>
        <section className="editor-preview">
          <div className="preview-toolbar">A4 实时预览</div>
          <div className="preview-outer">
            <div className="preview-scale">
              <ResumeRenderer
                ref={printRef}
                templateId={templateId}
                data={data}
                sectionOrder={sectionOrder}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
