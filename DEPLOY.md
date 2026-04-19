# 一键部署：Vercel + MongoDB Atlas

本文说明如何把 **Resume Studio**（本仓库）部署到公网，让你和朋友都能通过浏览器访问：前端静态资源与 API 由 **Vercel** 托管，数据在 **MongoDB Atlas**。

## 1. MongoDB Atlas（数据库）

1. 打开 [MongoDB Atlas](https://www.mongodb.com/products/platform/cloud-atlas/register)，注册并登录。
2. 创建一个 **Free** 集群（任意云厂商/区域即可）。
3. 左侧 **Database Access** → **Add New Database User**：
   - 认证方式选 **Password**，记下用户名与密码。
   - 权限选 **Read and write to any database**（开发阶段足够）。
4. 左侧 **Network Access** → **Add IP Address**：
   - 点 **Allow Access from Anywhere**，填入 `0.0.0.0/0`（Vercel Serverless 的出口 IP 不固定，开发/演示阶段常用；生产可再收紧为 [Vercel 官方 IP 段](https://vercel.com/docs/security/deployment-ip-addresses) 或使用 Private Link 等方案）。
5. 左侧 **Database** → 集群上点 **Connect** → **Drivers**，复制连接串，把 `<password>` 换成你的数据库用户密码，例如：

   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/resume-studio?retryWrites=true&w=majority`

   其中 `resume-studio` 为数据库名，可按需修改。

## 2. Git 仓库

1. 在本机项目根目录初始化并推送（GitHub / GitLab / Bitbucket 均可）：

   ```bash
   git init
   git add .
   git commit -m "Initial Resume Studio"
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

## 3. Vercel 项目

1. 打开 [Vercel](https://vercel.com/) 并登录，**Add New Project** → 导入上一步的 Git 仓库。
2. **Root Directory** 保持仓库根目录（包含 `client/`、`server/`、`api/`、`vercel.json`）。
3. **Build & Output**（若界面可编辑）与仓库内 `vercel.json` 一致即可：
   - Install：`npm install`
   - Build：`npm run build -w client`
   - Output Directory：`client/dist`
4. 打开 **Environment Variables**，新增：

   | Name | Value |
   |------|--------|
   | `MONGODB_URI` | 上一步 Atlas 连接串（完整 URL） |
   | `JWT_SECRET` | 随机长字符串（用于签发登录 Token，勿泄露） |
   | `CLIENT_ORIGIN` | 先填 `https://你的项目名.vercel.app`，部署成功后再改成最终生产域名（与浏览器访问地址一致即可，用于 CORS） |

5. 点击 **Deploy**。首次构建完成后，用浏览器打开 Vercel 提供的域名（如 `https://resume-studio-xxx.vercel.app`）。

## 4. 部署后自检

1. 打开首页，**注册**一个账号，应能进入工作台并**新建简历**。
2. 编辑后刷新页面，内容仍在（说明读写 MongoDB 正常）。
3. 浏览器访问 `https://你的域名/api/health`，应返回 JSON：`{ "ok": true, ... }`。
4. **分享链接**：在编辑器里点「生成分享链接」，用无痕窗口打开 `/share/xxxx`，应能看到只读简历。

## 5. 与朋友一起使用

- 每位用户各自 **注册账号**，数据按用户隔离存储在 MongoDB。
- 把 **Vercel 生产域名** 发给朋友即可；若绑定自定义域名，在 Vercel **Domains** 里添加，并把 `CLIENT_ORIGIN` 更新为该域名（含 `https://`）。

## 6. 本地开发（可选）

在项目根目录：

```bash
npm install
cp env.example .env
# 编辑 .env：填入 MONGODB_URI、JWT_SECRET，CLIENT_ORIGIN=http://localhost:5173
npm run dev
```

- 前端：<http://localhost:5173>  
- API：<http://localhost:3001>（Vite 会把 `/api` 代理到 3001）

## 7. 常见问题

- **CORS 错误**：检查 `CLIENT_ORIGIN` 是否与浏览器地址栏完全一致（协议 + 域名，不要尾斜杠）。
- **数据库连接失败**：Atlas **Network Access** 是否包含 `0.0.0.0/0` 或 Vercel IP；用户名密码是否已 URL 编码（密码含 `@` 等特殊字符时需编码）。
- **白屏 / 404**：确认 `vercel.json` 中 `outputDirectory` 为 `client/dist`，且 Build 成功生成了 `dist`。

完成以上步骤后，你和朋友们即可使用同一套线上环境管理各自的简历。
