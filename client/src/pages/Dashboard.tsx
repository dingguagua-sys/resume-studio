import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Row = { id: string; title: string; templateId: string; updatedAt: string; shareId?: string };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const { data } = await api.get<{ resumes: Row[] }>("/resumes");
      setRows(data.resumes);
    } catch {
      setErr("加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    const { data } = await api.post<{ resume: { id: string } }>("/resumes", { title: "新简历" });
    nav(`/app/resume/${data.resume.id}`);
  }

  async function remove(id: string) {
    if (!confirm("确定删除该简历？")) return;
    await api.delete(`/resumes/${id}`);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="shell">
      <header className="shell-bar">
        <Link to="/" className="logo">
          Resume Studio
        </Link>
        <div className="shell-bar-right">
          <span className="muted">{user?.email}</span>
          <button type="button" className="btn ghost" onClick={() => void create()}>
            + 新建简历
          </button>
          <button type="button" className="btn ghost" onClick={logout}>
            退出
          </button>
        </div>
      </header>
      <main className="shell-main">
        <h2 className="page-title">我的简历</h2>
        {err ? <div className="form-error">{err}</div> : null}
        {loading ? <p className="muted">加载中…</p> : null}
        {!loading && rows.length === 0 ? <p className="muted">还没有简历，点击右上角新建。</p> : null}
        <ul className="resume-table">
          {rows.map((r) => (
            <li key={r.id} className="resume-row">
              <div>
                <Link to={`/app/resume/${r.id}`} className="resume-title">
                  {r.title}
                </Link>
                <div className="muted small">
                  模板 {r.templateId} · 更新 {new Date(r.updatedAt).toLocaleString()}
                  {r.shareId ? " · 已开启分享" : ""}
                </div>
              </div>
              <div className="resume-row-actions">
                <Link className="btn small" to={`/app/resume/${r.id}`}>
                  编辑
                </Link>
                <button type="button" className="btn small danger" onClick={() => void remove(r.id)}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
