import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="logo">Resume Studio</span>
        {!loading && (
          <div className="landing-actions">
            {user ? (
              <Link to="/app" className="btn primary">
                我的工作台
              </Link>
            ) : (
              <Link to="/login" className="btn primary">
                登录 / 注册
              </Link>
            )}
          </div>
        )}
      </header>
      <main className="landing-hero">
        <h1>多人可用的在线简历工作台</h1>
        <p>拖拽调整模块顺序，实时预览 A4 版式，5 套模板一键切换，导出 PDF 与生成只读分享链接。</p>
        <div className="landing-cta">
          <Link to={user ? "/app" : "/login"} className="btn primary large">
            {user ? "继续编辑" : "免费开始使用"}
          </Link>
          <span className="btn ghost large" style={{ cursor: "default" }}>
            部署：仓库根目录 DEPLOY.md（Vercel + Atlas）
          </span>
        </div>
        <ul className="landing-points">
          <li>前端 React + 拖拽（dnd-kit）</li>
          <li>后端 Node.js + MongoDB（注册登录 JWT）</li>
          <li>可部署到 Vercel + MongoDB Atlas</li>
        </ul>
      </main>
    </div>
  );
}
