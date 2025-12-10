# Netflix 验证码转发平台

一个轻量级的邮件转发系统，专门用于接收和查看 Netflix 等服务的验证码邮件。支持 Vercel 一键部署或自建服务器。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lthero-big/netflix-email-forward)

## ✨ 功能特性

- 🔐 **密码保护**：SHA-256 加密存储，保护邮件隐私
- 🎯 **智能过滤**：按来源、主题、内容进行多维度过滤
- ⏰ **自动清理**：邮件过期后自动删除（默认30分钟，可配置）
- 💾 **本地存储**：SQLite 数据库，数据完全掌控
- ☁️ **Cloudflare 集成**：通过 Email Routing + Worker 接收邮件
- 📱 **响应式 UI**：基于 Tailwind CSS，支持移动端
- 🚀 **快速部署**：支持 Vercel 一键部署或服务器部署

## 📧 工作流程

```
Netflix 发送验证码邮件
    ↓
Gmail 接收（可选过滤）
    ↓
Gmail 转发到 Cloudflare 邮箱
    ↓
Cloudflare Email Routing 触发 Worker
    ↓
Worker 转发到你的网站
    ↓
网站保存并展示在仪表板
```

## 🚀 部署方式

选择以下任一方式部署：

### 方式一：Vercel 部署（推荐，最简单）

#### 第一步：部署到 Vercel

1. **点击一键部署按钮**（页面顶部的 "Deploy with Vercel" 按钮）
2. **授权 GitHub 并导入项目**
3. **配置环境变量**（关键步骤！）：

| 环境变量 | 值 | 说明 |
|---------|-----|-----|
| `ADMIN_PASSWORD` | `your-password` | ⚠️ 必填：登录密码（建议使用复杂密码） |
| `WEBHOOK_API_KEY` | `your-api-key` | ⚠️ 必填：API 密钥（建议使用复杂字符串，见下方说明） |
| `EMAIL_EXPIRY_MINUTES` | `30` | 可选：邮件过期时间（分钟） |

4. **设置 API 密钥**（两种方式任选其一）：

   **方式 A：使用命令生成随机密钥（推荐）**
   ```bash
   # 在本地终端执行
   openssl rand -base64 32
   # 示例输出: Jx7kL9mP4qR8sT3vW6yZ2aB5cD1eF0gH
   # 复制输出的密钥，填入 WEBHOOK_API_KEY
   ```

   **方式 B：自定义密钥（需保证复杂度）**
   - 长度至少 16 个字符
   - 包含大小写字母、数字、特殊符号
   - 示例：`MySecure@APIKey2025!`
   - ⚠️ 避免使用简单密码如 `12345678` 或 `password`

5. **点击 Deploy 部署**

6. **记录你的 Vercel 域名**（例如：`https://your-app.vercel.app`）

#### 第二步：配置 Cloudflare Worker

1. **登录 Cloudflare Dashboard**
2. **创建 Worker**：
   - 进入 "Workers & Pages"
   - 点击 "Create application" → "Create Worker"
   - 命名（如：`netflix-email-worker`）

3. **复制 Worker 代码**：
   - 从项目中复制 `cloudflare-worker.js` 的全部内容
   - 粘贴到 Worker 编辑器中

4. **配置 Worker 环境变量**：
   - 点击 "Settings" → "Variables"
   - 添加环境变量：
   
   | 变量名 | 值 | 示例 |
   |--------|-----|------|
   | `WEB_APP_URL` | 你的 Vercel 域名 | `https://your-app.vercel.app` |
   | `WEBHOOK_API_KEY` | 与网站相同的 API 密钥 | （第一步生成的密钥） |

5. **保存并部署 Worker**

#### 第三步：配置 Cloudflare Email Routing

1. **启用 Email Routing**：
   - 在 Cloudflare Dashboard 选择你的域名
   - 进入 "Email" → "Email Routing"
   - 点击 "Enable Email Routing"

2. **添加目标地址**：
   - 点击 "Destination addresses" → "Create address"
   - 输入你的 Gmail 地址（或其他邮箱）
   - 验证邮箱（点击收到的验证邮件链接）

3. **创建路由规则**：
   - 点击 "Routing rules" → "Create route"
   - **Custom address**: 输入 `nfcode@your-domain.com`（自定义前缀）
   - **Action**: 选择 "Send to a Worker"
   - **Worker**: 选择刚才创建的 Worker（如 `netflix-email-worker`）
   - 点击 "Save"

#### 第四步：配置 Gmail 转发

1. **登录 Gmail** → 点击右上角设置图标 ⚙️
2. **查看所有设置** → **过滤器和已阻止的地址**
3. **创建新的过滤器**：
   - **来自**: `info@account.netflix.com`
   - **主题**: `Your temporary access code`（可选，更精确）
   - 点击 "创建过滤器"
4. **选择操作**：
   - ✅ **转发到**: 输入 `nfcode@your-domain.com`（Cloudflare 配置的地址）
   - （可选）✅ **跳过收件箱（归档）**：避免 Gmail 中重复显示
   - 点击 "创建过滤器"

#### 第五步：测试

1. **触发 Netflix 发送验证码**（登录或其他操作）
2. **访问你的 Vercel 域名**（`https://your-app.vercel.app`）
3. **使用密码登录**（你设置的 `ADMIN_PASSWORD`）
4. **查看仪表板**，应该能看到转发的邮件

**常见问题**：
- ❌ **登录失败**：检查 Vercel 环境变量中的 `ADMIN_PASSWORD` 是否正确
- ❌ **收不到邮件**：检查 Worker 环境变量（`WEB_APP_URL` 和 `WEBHOOK_API_KEY`）
- ❌ **500 错误**：检查 Worker 日志（Cloudflare Dashboard → Worker → Logs）

---

### 方式二：服务器部署（完全自主控制）

适合有自己服务器的用户，数据永久保存。

#### 前置要求

- Linux 服务器（Ubuntu/Debian/CentOS）
- 已安装 Git
- 有公网 IP 或域名

#### 第一步：部署网站

```bash
# 1. SSH 连接到服务器
ssh user@your-server-ip

# 2. 克隆项目
cd /var/www  # 或其他目录
git clone https://github.com/lthero-big/netflix-email-forward.git
cd netflix-email-forward

# 3. 配置环境变量
cp .env.example .env.local
nano .env.local  # 编辑配置文件
```

**编辑 `.env.local`**（必须修改）：
```env
# 登录密码（必改！）
ADMIN_PASSWORD=your-strong-password-here

# API 密钥（必改！使用下方命令生成）
WEBHOOK_API_KEY=your-generated-api-key-here

# 网站访问地址（用于 Worker 配置，必填）
WEB_APP_URL=https://your-domain.com
# 或使用 IP:端口： WEB_APP_URL=http://your-server-ip:3303

# 邮件过期时间（分钟，可选）
EMAIL_EXPIRY_MINUTES=30

# 服务器端口（可选）
PORT=3303
```

**生成 API 密钥**：
```bash
openssl rand -base64 32
# 复制输出，填入 WEBHOOK_API_KEY
```

```bash
# 4. 一键部署
bash deploy.sh
```

**deploy.sh 会自动完成**：
- ✅ 检查并安装 Node.js 20 LTS
- ✅ 安装项目依赖
- ✅ 初始化 SQLite 数据库
- ✅ 构建生产版本
- ✅ 使用 PM2 启动服务
- ✅ 自动更新 `cloudflare-worker.js` 配置
- ✅ 显示访问地址和外网 IP

**部署完成后**：
- 🌐 本地访问：`http://localhost:3303`
- 🌐 外网访问：`http://your-server-ip:3303`
- 🌐 域名访问（如已配置）：`https://your-domain.com`

#### 第二步至第五步：同 Vercel 部署

按照上方 **Vercel 部署** 的第二步至第五步配置 Cloudflare 和 Gmail。

**区别**：
- Worker 环境变量 `WEB_APP_URL` 填写你的服务器地址（域名或 IP:端口）
- 数据永久保存在服务器，不会因重新部署而丢失

---

## 🔧 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/lthero-big/netflix-email-forward.git
cd netflix-email-forward

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，至少修改密码

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`，密码：`admin123`（或你配置的密码）

## 📁 项目结构

```
netflix-email-forward/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # 首页（自动跳转登录）
│   │   ├── login/page.tsx                # 登录页面
│   │   ├── dashboard/page.tsx            # 邮件仪表板
│   │   └── api/
│   │       ├── webhook/email/route.ts    # 邮件接收 API
│   │       ├── auth/login/route.ts       # 登录验证 API
│   │       ├── emails/route.ts           # 邮件列表 API
│   │       ├── emails/[id]/route.ts      # 删除邮件 API
│   │       └── config/route.ts           # 配置信息 API
│   └── lib/
│       ├── db/
│       │   ├── init.ts                   # 数据库初始化
│       │   └── queries.ts                # 数据库查询
│       ├── emailFilter.ts                # 邮件过滤规则
│       └── auth.ts                       # 密码验证
├── scripts/
│   ├── addRule.js                        # 添加转发规则
│   ├── testWorkerUpload.js              # 测试 Worker 转发
│   └── testApiKey.js                     # 测试 API Key
├── cloudflare-worker.js                  # Cloudflare Worker 代码
├── deploy.sh                             # 一键部署脚本
├── emails.db                             # SQLite 数据库（自动创建）
├── .env.example                          # 环境变量示例
└── README.md
```

## 🧪 测试验证

### 测试邮件接收

```bash
# 使用测试脚本（自动读取 .env.local）
node scripts/testWorkerUpload.js

# 或手动测试
curl -X POST http://localhost:3000/api/webhook/email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "from": "info@account.netflix.com",
    "to": "test@example.com",
    "subject": "Your temporary access code",
    "body": "Your code is: 123456"
  }'
```

### 测试 Worker 健康状态

访问 Worker URL：`https://your-worker.workers.dev/health`

应该返回：
```json
{
  "status": "ok",
  "message": "Email Worker is running",
  "timestamp": "2025-12-10T..."
}
```

## 🔧 高级配置

### 自定义转发规则

默认接收所有邮件。如需自定义，编辑 `scripts/addRule.js`：

```javascript
stmt.run(
  'Netflix OTP Only',          // 规则名称
  1,                           // 启用状态（1=启用，0=禁用）
  '*@account.netflix.com',     // 发件人（支持通配符 *）
  'Your temporary access code',// 主题包含
  null,                        // 邮件内容包含（null=不限制）
  '',                          // 转发地址（空=仅保存本地）
  'Only accept Netflix OTP'    // 规则描述
);
```

运行脚本添加：`node scripts/addRule.js`

### 调整邮件过期时间

在 `.env.local` 或 Vercel 环境变量中修改：
```env
EMAIL_EXPIRY_MINUTES=60  # 1小时后过期
EMAIL_EXPIRY_MINUTES=1440  # 24小时后过期
```

## 🗄️ 数据管理与维护

### 数据持久性对比

| 部署方式 | 存储位置 | 数据持久性 | 备份方案 | 适用场景 |
|---------|---------|----------|---------|---------|
| **Vercel** | `/tmp/emails.db` | ❌ 函数重启会丢失 | 定期导出重要邮件 | 临时验证码转发 |
| **服务器** | `项目目录/emails.db` | ✅ 永久保存 | 定期备份数据库文件 | 长期邮件存档 |

### 邮件自动清理

系统会在以下时机自动清理过期邮件：
- 每次接收新邮件时
- 每次查询邮件列表时
- 前端实时过滤过期邮件

### 数据库管理（服务器部署）

```bash
# 查看数据库
sqlite3 emails.db

# 常用查询
SELECT * FROM forwarded_emails ORDER BY created_at DESC LIMIT 10;
SELECT COUNT(*) FROM forwarded_emails WHERE expires_at > datetime('now');

# 手动备份
cp emails.db emails.backup.$(date +%Y%m%d_%H%M%S).db

# 恢复数据库
cp emails.backup.20250610_120000.db emails.db
```

### 使用 PM2 管理（服务器部署）

```bash
# 启动应用
pm2 start npm --name "email-forward" -- start

# 常用命令
pm2 status                  # 查看状态
pm2 logs email-forward      # 查看日志
pm2 restart email-forward   # 重启应用
pm2 stop email-forward      # 停止应用
pm2 delete email-forward    # 删除应用

# 开机自启动
pm2 startup
pm2 save
```

## 🔒 安全建议

### 必须配置

1. **强密码**：修改 `.env.local` 中的 `ADMIN_PASSWORD` 为复杂密码（系统自动 SHA-256 加密）
2. **强 API Key**：使用 `openssl rand -base64 32` 生成随机密钥，或自定义复杂字符串（至少16位，包含大小写字母、数字、符号）
3. **HTTPS**：生产环境必须启用 HTTPS（Vercel 自动提供，服务器部署需配置 Nginx/Caddy）

### 推荐配置

4. **防火墙**：服务器部署时限制端口访问（仅允许 Cloudflare IP 段）
5. **定期更新**：保持 Node.js 和依赖包为最新稳定版本
6. **环境变量保护**：切勿将 `.env.local` 提交到 Git（已添加到 `.gitignore`）

### 许可证须知

本项目采用 **AGPL-3.0** 开源协议：

- ✅ **个人使用**：完全免费，无任何限制
- ✅ **商业使用**：允许，但必须开源修改后的代码
- ⚠️ **网络服务**：如果您修改本软件并提供网络服务，必须公开源代码
- 🔒 **闭源商用**：如需闭源商业使用，请联系作者获取商业许可

详见 [LICENSE](LICENSE) 或 [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

## 🐛 常见问题

### 登录失败

**症状**：输入密码后提示"密码错误"

**解决方案**：
1. 确认 `.env.local`（或 Vercel 环境变量）中已设置 `ADMIN_PASSWORD`
2. 重新部署应用（Vercel 需重新部署，服务器需 `pm2 restart`）
3. 清除浏览器缓存和 localStorage
4. 检查日志：Vercel 查看 Functions 日志，服务器执行 `pm2 logs email-forward`

### 收不到邮件

**症状**：Gmail 转发后，Dashboard 没有新邮件

**排查步骤**：
1. **检查 Worker 健康状态**：访问 `https://your-worker.workers.dev/health`
2. **查看 Worker 日志**：Cloudflare Dashboard → Workers & Pages → 你的 Worker → Logs
3. **验证 Gmail 过滤器**：Gmail 设置 → 过滤器和屏蔽的地址 → 确认已生效
4. **测试 API 端点**：使用 `node scripts/testWorkerUpload.js` 手动测试
5. **检查 API Key**：确认 Worker 和应用的 `WEBHOOK_API_KEY` 一致

### Vercel 部署 500 错误

**症状**：部署成功但访问报 500 错误

**解决方案**：
1. 检查环境变量是否都已配置（尤其是 `ADMIN_PASSWORD` 和 `WEBHOOK_API_KEY`）
2. 查看 Vercel Functions 日志：Dashboard → Deployment → Functions
3. 确认使用 Node.js 20.x 运行时
4. 重新部署（Vercel Dashboard → Deployments → Redeploy）

### 服务器部署端口占用

**症状**：启动时提示端口已被占用

**解决方案**：
```bash
# 查找占用进程
lsof -i :3000

# 结束进程
kill -9 <PID>

# 或使用项目内置的端口检测（自动尝试 3000-3009）
npm start
```

### 数据库权限错误（服务器部署）

**症状**：无法写入数据库

**解决方案**：
```bash
# 设置正确的权限
chmod 755 .
chmod 664 emails.db
```

## 📖 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: SQLite (better-sqlite3)
- **邮件解析**: mailparser
- **样式**: Tailwind CSS 4.0
- **部署**: Vercel / 自托管服务器
- **邮件路由**: Cloudflare Email Routing + Workers

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果觉得项目有用，请给个 ⭐️ Star 支持一下！

## 📄 许可证

本项目采用 [AGPL-3.0](LICENSE) 开源协议。

**简单说明**：
- ✅ 个人使用、学习、修改：完全免费
- ✅ 商业使用：允许，但修改后必须开源
- ⚠️ 网络服务：如果您修改并提供网络服务，必须公开源代码
- 🔒 闭源商用：需获取商业许可

详见 [LICENSE](LICENSE) 或 [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)

---

**祝你使用愉快！** 🎉

如有问题，欢迎提交 [Issue](https://github.com/lthero-big/netflix-email-forward/issues)
