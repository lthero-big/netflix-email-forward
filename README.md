# 简化邮件转发系统

一个轻量级的邮件转发系统，专门用于接收和查看 Netflix 等服务的验证码邮件。基于 Next.js + TypeScript + SQLite，支持智能过滤和自动清理。

## ✨ 功能特性

- **密码保护**：SHA-256 加密存储，保护邮件隐私
- **智能过滤**：按来源、主题、内容进行多维度过滤
- **自动清理**：邮件过期后自动删除（默认30分钟，可配置）
- **本地存储**：SQLite 数据库，数据完全掌控
- **Cloudflare 集成**：通过 Email Routing + Worker 接收邮件
- **响应式 UI**：基于 Tailwind CSS，支持移动端

## 📧 邮件流程

```
Netflix → Gmail → Cloudflare Email Routing → Worker → 本地应用 → 仪表板查看
```

## 🚀 快速开始

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/lthero-big/netflix-email-forward.git
cd netflix-email-forward

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# .env.example 已包含默认配置（密码：admin123）
# 生产环境建议修改密码和 API 密钥

# 4. 初始化数据库和添加规则
node scripts/addRule.js

# 5. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`，密码：`admin123`

### 服务器部署

```bash
# 1. SSH 到服务器
ssh user@your-server

# 2. 克隆项目
cd /var/www
git clone https://github.com/lthero-big/netflix-email-forward.git
cd netflix-email-forward

# 3. 配置环境变量
cp .env.example .env.local
nano .env.local  # 修改密码和 API 密钥

# 修改配置：
# ADMIN_PASSWORD=your-strong-password        # 修改默认密码
# WEBHOOK_API_KEY=$(openssl rand -base64 32) # 生成随机密钥
# WEB_APP_URL=https://your-domain.com        # 配置访问地址（域名或 IP:端口）
# PORT=3303                                  # 修改端口（可选）
# EMAIL_EXPIRY_MINUTES=30                    # 邮件过期时间（分钟，默认30）

# 4. 运行一键部署脚本
bash deploy.sh

# 脚本会自动完成：
# - 检查并安装 Node.js 20 LTS（如需要）
# - 加载 .env.local 环境变量
# - 安装依赖
# - 初始化数据库
# - 构建项目
# - 使用 PM2 启动服务
# - 自动更新 cloudflare-worker.js 配置（WEB_APP_URL 和 WEBHOOK_API_KEY）
# - 显示访问地址和外网 IP
```

**重要**：生产环境请务必修改默认密码和 API 密钥！

## 🌐 Cloudflare 配置

### 1. 创建 Email Worker

在 Cloudflare Dashboard 创建 Worker，复制 `cloudflare-worker.js` 内容。

### 2. 设置环境变量

在 Worker Settings → Variables 添加：
- `WEB_APP_URL`: `https://your-domain.com` 或 `http://your-server-ip:3303`
- `WEBHOOK_API_KEY`: 与 `.env.local` 中的 `WEBHOOK_API_KEY` 保持一致

### 3. 配置 Email Routing

1. **Email** → **Email Routing** → 启用
2. 创建地址：`netflix@your-domain.com`
3. 路由规则：Send to Worker → 选择刚创建的 Worker

### 4. Gmail 转发设置

Gmail → 设置 → 过滤器：
- 来自：`info@account.netflix.com`
- 主题：`Your temporary access code`
- 操作：转发到 `netflix@your-domain.com`

## 📁 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页
│   ├── login/page.tsx        # 登录
│   ├── dashboard/page.tsx    # 仪表板
│   └── api/
│       ├── webhook/email/route.ts    # 邮件接收
│       ├── auth/login/route.ts       # 登录 API
│       └── emails/route.ts           # 邮件列表
└── lib/
    ├── db/                   # 数据库
    ├── emailFilter.ts        # 邮件过滤
    └── auth.ts               # 认证
scripts/
├── addRule.js               # 添加规则
├── hashPassword.js          # 生成密码哈希
└── testEmail.js             # 测试邮件
```

## 项目结构

```
simple-email-forward/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 首页
│   │   ├── login/
│   │   │   └── page.tsx          # 登录页面
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 邮件仪表板
│   │   └── api/
│   │       ├── webhook/
│   │       │   └── email/
│   │       │       └── route.ts  # 邮件接收 Webhook
│   │       ├── auth/
│   │       │   └── login/
│   │       │       └── route.ts  # 登录 API
│   │       └── emails/
│   │           └── route.ts      # 邮件列表 API
│   └── lib/
│       ├── db/
│       │   ├── init.ts           # 数据库初始化
│       │   └── queries.ts        # 数据库查询函数
│       ├── emailFilter.ts        # 邮件过滤逻辑
│       └── auth.ts               # 认证工具
├── emails.db                     # SQLite 数据库（自动创建）
├── .env.example                  # 环境变量示例
├── package.json
└── README.md
```

## 📝 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm start                # 启动生产服务器

# 工具
npm run add-rule         # 添加转发规则
npm run test-email       # 测试邮件接收

# 数据库
npm run db:backup        # 备份数据库
npm run db:restore       # 恢复数据库
```

## 🔧 管理转发规则

编辑 `scripts/addRule.js` 添加新规则：

```javascript
stmt.run(
  'Netflix OTP',           // 规则名称
  1,                       // 启用（1=是，0=否）
  '*@account.netflix.com', // 发件人（支持通配符 *）
  'Your temporary access code', // 主题包含
  null,                    // 邮件内容包含
  '',                      // 留空=仅保存本地，不转发
  'Save Netflix OTP locally'
);
```

然后运行：`node scripts/addRule.js`

## 🧪 测试

```bash
# 测试邮件接收（使用测试脚本，自动读取 .env.local）
node scripts/testWorkerUpload.js

# 或手动测试（需替换为实际的 API Key）
curl -X POST http://localhost:3000/api/webhook/email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-webhook-api-key-here" \
  -d '{
    "from": "info@account.netflix.com",
    "to": "test@example.com",
    "subject": "Your temporary access code",
    "body": "Your code is: 123456"
  }'

# 访问仪表板查看
# http://localhost:3000/login (密码: admin123)
```

## 🛠️ 维护

### 邮件自动清理

系统会在以下情况自动清理过期邮件：
- 每次接收新邮件时
- 每次查询邮件列表时
- 前端自动过滤已过期邮件

过期时间可通过 `.env.local` 配置：
```bash
# 邮件过期时间（分钟），默认 30 分钟
EMAIL_EXPIRY_MINUTES=30
```

手动触发清理：
```bash
curl -X GET "http://localhost:3303/api/webhook/email?action=cleanup"
```

### 数据库管理

```bash
# 查看数据库
sqlite3 emails.db

# 常用 SQL
SELECT * FROM forwarded_emails ORDER BY created_at DESC LIMIT 10;
SELECT COUNT(*) FROM forwarded_emails WHERE expires_at > datetime('now');
UPDATE forward_rules SET enabled = 0 WHERE id = 1;  # 禁用规则
```

### 使用 PM2 管理

```bash
pm2 start npm --name "email-forward" -- start
pm2 status
pm2 logs email-forward
pm2 restart email-forward
pm2 stop email-forward
```

## 🔒 安全建议

1. **修改默认密码**：编辑 `.env.local` 中的 `ADMIN_PASSWORD`（系统自动加密）
2. **保护 API 密钥**：使用 `openssl rand -base64 32` 生成随机密钥
3. **使用 HTTPS**：生产环境必须使用 SSL 证书
4. **限制访问**：使用防火墙限制端口访问
5. **定期备份**：`npm run db:backup`

## 🐛 故障排除

### 数据库错误
```bash
chmod 755 .
chmod 664 emails.db
```

### 邮件未接收
1. 检查 Worker 日志（Cloudflare Dashboard）
2. 检查应用日志：`pm2 logs email-forward`
3. 测试 API 端点
4. 验证规则匹配

### 登录失败
1. 确认 `.env.local` 中的 `ADMIN_PASSWORD` 已配置
2. 清除浏览器缓存和 localStorage
3. 检查服务器日志：`pm2 logs email-forward`

## 📄 许可证

AGPL-3.0 License

本项目采用 GNU Affero General Public License v3.0 许可证：

- ✅ 允许自由使用、修改和分发
- ✅ 开源代码，保障用户自由
- ⚠️ **商用必须开源**：如果您修改并在网络服务中使用本软件，必须公开修改后的源代码
- 🔒 保护开源社区的利益

详细许可证内容请查看 [LICENSE](LICENSE) 文件或访问 [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)。

---

**祝你使用愉快！** 🎉
