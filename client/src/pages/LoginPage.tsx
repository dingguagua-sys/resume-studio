import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const DEFAULT_LOGIN_EMAIL = "yyx1853100";
const DEFAULT_LOGIN_PASSWORD = "123456";

function formatAuthError(ex: unknown): string {
  if (typeof ex === "object" && ex && "response" in ex) {
    const res = (ex as { response?: { status?: number; data?: unknown } }).response;
    if (res?.status === 404) {
      return "找不到登录接口(404)。请刷新页面重试；若已部署，请确认前端请求路径为 /api/auth/...。";
    }
    const d = res?.data;
    if (typeof d === "string") {
      const t = d.replace(/<[^>]+>/g, "").trim().slice(0, 200);
      return t || `服务器返回 ${res?.status ?? ""}`;
    }
    if (d && typeof d === "object") {
      const o = d as Record<string, unknown>;
      const line = (v: unknown) => (typeof v === "string" ? v : "");
      const parts = [line(o.error), line(o.hint), line(o.message)].filter(Boolean);
      if (parts.length) return parts.join(" — ");
    }
    if (res?.status === 500) {
      return "服务器返回 500。请确认后端服务和 MongoDB 已启动，再重试。";
    }
    if (res?.status) return `请求失败（${res.status}），请稍后再试`;
  }
  if (ex instanceof Error) {
    if (/network error|failed to fetch|ecconnrefused/i.test(ex.message)) {
      return "无法连接后端服务。请先启动后端（3001）并确保 MongoDB 可用。";
    }
    return ex.message;
  }
  return "请求失败，请稍后再试";
}

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(DEFAULT_LOGIN_EMAIL);
  const [password, setPassword] = useState(DEFAULT_LOGIN_PASSWORD);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      nav("/app", { replace: true });
    } catch (ex: unknown) {
      setErr(formatAuthError(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title">Resume Studio</h1>
        <p className="auth-sub">在线拖拽编辑 · 多模板 · PDF 导出 · 分享链接</p>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="field">
            <span>账号</span>
            <input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {err ? <div className="form-error">{err}</div> : null}
          <button type="submit" className="btn primary stretch" disabled={busy}>
            {busy ? "提交中…" : "进入工作台"}
          </button>
        </form>
        <Link to="/" className="auth-back">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
