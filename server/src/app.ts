import "./env.js";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { connectDb } from "./db.js";
import { User } from "./models/User.js";
import { Resume } from "./models/Resume.js";
import { authMiddleware, signToken, userPublic, type AuthedRequest } from "./auth.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: [clientOrigin, /^https:\/\/.*\.vercel\.app$/],
    credentials: true,
  })
);

const jwtSecret = process.env.JWT_SECRET || "dev-insecure-change-me";
const mongoUri = process.env.MONGODB_URI || "";

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

async function ensureDb(_req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!mongoUri) {
    res.status(500).json({ error: "服务器未配置 MONGODB_URI" });
    return;
  }
  try {
    await connectDb(mongoUri);
    next();
  } catch (e) {
    console.error("MongoDB connect error:", e);
    const err = e as Error & { code?: string };
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
      error: "数据库连接失败",
      ...(isDev && {
        hint:
          err?.code === "ECONNREFUSED" || /ECONNREFUSED/i.test(String(err?.message))
            ? "本机 MongoDB 未启动或端口不是 27017。可先执行：brew services start mongodb-community"
            : err?.message?.slice(0, 200),
      }),
    });
  }
}

app.use("/api", ensureDb);

app.post("/api/auth/register", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || "").trim();
  if (!email || !password) {
    res.status(400).json({ error: "邮箱和密码不能为空" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "密码至少 6 位" });
    return;
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409).json({ error: "该邮箱已注册" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, displayName });
  const token = signToken(String(user._id), jwtSecret);
  res.json({ token, user: userPublic(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "邮箱或密码错误" });
    return;
  }
  const token = signToken(String(user._id), jwtSecret);
  res.json({ token, user: userPublic(user) });
});

app.get("/api/me", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: "用户不存在" });
    return;
  }
  res.json({ user: userPublic(user) });
});

app.get("/api/resumes", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const list = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
  res.json({
    resumes: list.map((r) => ({
      id: String(r._id),
      title: r.title,
      templateId: r.templateId,
      sectionOrder: r.sectionOrder,
      updatedAt: r.updatedAt,
      shareId: r.shareId,
    })),
  });
});

app.post("/api/resumes", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const body = req.body || {};
  const doc = await Resume.create({
    userId: req.userId,
    title: body.title || "我的简历",
    templateId: body.templateId || "classic",
    sectionOrder: body.sectionOrder,
    data: body.data || defaultResumeData(),
  });
  res.json({ resume: formatResume(doc) });
});

app.get("/api/resumes/:id", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const doc = await Resume.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) {
    res.status(404).json({ error: "未找到简历" });
    return;
  }
  res.json({ resume: formatResume(doc) });
});

app.put("/api/resumes/:id", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const doc = await Resume.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) {
    res.status(404).json({ error: "未找到简历" });
    return;
  }
  const body = req.body || {};
  if (body.title != null) doc.title = String(body.title);
  if (body.templateId != null) doc.templateId = String(body.templateId);
  if (body.sectionOrder != null) doc.sectionOrder = body.sectionOrder;
  if (body.data != null) doc.data = body.data;
  await doc.save();
  res.json({ resume: formatResume(doc) });
});

app.delete("/api/resumes/:id", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const r = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!r) {
    res.status(404).json({ error: "未找到简历" });
    return;
  }
  res.json({ ok: true });
});

app.post("/api/resumes/:id/share", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const doc = await Resume.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) {
    res.status(404).json({ error: "未找到简历" });
    return;
  }
  if (!doc.shareId) doc.shareId = nanoid(10);
  await doc.save();
  res.json({ shareId: doc.shareId });
});

app.delete("/api/resumes/:id/share", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
  const doc = await Resume.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) {
    res.status(404).json({ error: "未找到简历" });
    return;
  }
  await Resume.updateOne({ _id: doc._id }, { $unset: { shareId: 1 } });
  res.json({ ok: true });
});

/** Public read-only */
app.get("/api/public/resumes/:shareId", async (req, res) => {
  const doc = await Resume.findOne({ shareId: req.params.shareId }).lean();
  if (!doc) {
    res.status(404).json({ error: "分享不存在或已关闭" });
    return;
  }
  res.json({
    resume: {
      title: doc.title,
      templateId: doc.templateId,
      sectionOrder: doc.sectionOrder,
      data: doc.data,
      updatedAt: doc.updatedAt,
    },
  });
});

function formatResume(doc: InstanceType<typeof Resume>) {
  return {
    id: String(doc._id),
    title: doc.title,
    templateId: doc.templateId,
    sectionOrder: doc.sectionOrder,
    data: doc.data,
    shareId: doc.shareId,
    updatedAt: doc.updatedAt,
  };
}

function defaultResumeData() {
  return {
    basics: {
      name: "张三",
      headline: "前端工程师",
      email: "hello@example.com",
      phone: "138-0000-0000",
      location: "上海",
      website: "https://github.com/you",
      summary:
        "热爱 Web 与产品体验，熟悉 React 生态与 Node.js，注重性能与可维护性。",
    },
    experience: [
      {
        id: "e1",
        company: "示例科技",
        role: "高级前端工程师",
        start: "2022-01",
        end: "至今",
        bullets: ["负责核心业务前端架构与性能优化", "推动组件库与设计系统落地"],
      },
    ],
    education: [
      {
        id: "ed1",
        school: "示例大学",
        degree: "本科",
        field: "计算机科学与技术",
        start: "2014-09",
        end: "2018-06",
      },
    ],
    skills: [
      { id: "s1", name: "TypeScript / React", level: "熟练" },
      { id: "s2", name: "Node.js", level: "熟练" },
    ],
    projects: [
      {
        id: "p1",
        name: "在线简历平台",
        description: "多人协作、模板切换、导出 PDF。",
        link: "",
        tech: "React, MongoDB",
      },
    ],
  };
}

export default app;
