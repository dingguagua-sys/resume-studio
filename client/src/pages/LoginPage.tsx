import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, displayName);
      nav("/app", { replace: true });
    } catch (ex: unknown) {
      const data =
        typeof ex === "object" && ex && "response" in ex
          ? (ex as { response?: { data?: { error?: string; hint?: string } } }).response?.data
          : undefined;
      const parts = [data?.error, data?.hint].filter(Boolean);
      setErr(parts.length ? parts.join(" — ") : "请求失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title">Resume Studio</h1>
        <p className="auth-sub">在线拖拽编辑 · 多模板 · PDF 导出 · 分享链接</p>
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
            登录
          </button>
          <button
            type="button"
            className={mode === "register" ? "on" : ""}
            onClick={() => setMode("register")}
          >
            注册
          </button>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          {mode === "register" ? (
            <label className="field">
              <span>昵称</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
            </label>
          ) : null}
          <label className="field">
            <span>邮箱</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {err ? <div className="form-error">{err}</div> : null}
          <button type="submit" className="btn primary stretch" disabled={busy}>
            {busy ? "提交中…" : mode === "login" ? "进入工作台" : "创建账号"}
          </button>
        </form>
        <Link to="/" className="auth-back">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
