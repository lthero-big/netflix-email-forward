#!/bin/bash

# 快速部署脚本 - 用于服务器部署
# 使用方法：bash deploy.sh

echo "🚀 开始部署 Email Forward 系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未检测到 Node.js${NC}"
    echo -e "${YELLOW}是否需要自动安装 Node.js 20 LTS？(y/n)${NC}"
    read -r INSTALL_NODE
    
    if [[ "$INSTALL_NODE" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}📦 开始安装 Node.js 20 LTS...${NC}"
        
        # 检测操作系统
        if [ -f /etc/debian_version ]; then
            # Debian/Ubuntu
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [ -f /etc/redhat-release ]; then
            # CentOS/RHEL
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        else
            echo -e "${RED}❌ 未识别的操作系统，请手动安装 Node.js 18+${NC}"
            echo -e "${YELLOW}访问: https://nodejs.org/${NC}"
            exit 1
        fi
        
        # 验证安装
        if ! command -v node &> /dev/null; then
            echo -e "${RED}❌ Node.js 安装失败${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Node.js 安装成功: $(node -v)${NC}"
    else
        echo -e "${YELLOW}请手动安装 Node.js 18+ 后重新运行此脚本${NC}"
        echo -e "${YELLOW}访问: https://nodejs.org/${NC}"
        exit 1
    fi
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 版本过低 (当前: $(node -v))，需要 18+${NC}"
    echo -e "${YELLOW}是否需要升级到 Node.js 20 LTS？(y/n)${NC}"
    read -r UPGRADE_NODE
    
    if [[ "$UPGRADE_NODE" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}📦 开始升级 Node.js...${NC}"
        
        # 检测操作系统
        if [ -f /etc/debian_version ]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [ -f /etc/redhat-release ]; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        else
            echo -e "${RED}❌ 未识别的操作系统，请手动升级 Node.js${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✅ Node.js 升级成功: $(node -v)${NC}"
    else
        echo -e "${YELLOW}请手动升级 Node.js 到 18+ 后重新运行此脚本${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Node.js 版本检查通过: $(node -v)${NC}"

# 检查 .env.local 文件
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env.local 文件，正在创建...${NC}"
    cat > .env.local << 'EOF'
# 管理员密码（明文，系统会自动加密）
ADMIN_PASSWORD=admin123

# Webhook API 密钥（与 Cloudflare Worker 保持一致）
WEBHOOK_API_KEY=Gk1NGvD8QhuxOQ//5yNdrmrkg8+2UFweMGY5BYLjGkU=

# 服务器端口
PORT=3303

# Web 应用访问 URL（用于 Cloudflare Worker 配置）
WEB_APP_URL=http://your-server-ip:3303

# 数据库路径
DATABASE_PATH=./emails.db

# 调试模式
DEBUG=false
EOF
    echo -e "${GREEN}✅ .env.local 文件已创建${NC}"
    echo -e "${YELLOW}⚠️  默认密码: admin123，请在 .env.local 中修改 ADMIN_PASSWORD${NC}"
else
    echo -e "${GREEN}✅ .env.local 文件已存在${NC}"
fi

# 从 .env.local 加载环境变量到当前 shell
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
    echo -e "${GREEN}✅ 环境变量已加载 (PORT=${PORT:-3000})${NC}"
fi

# 更新 Cloudflare Worker 配置中的 URL
if [ -f "cloudflare-worker.js" ] && [ -n "${WEB_APP_URL}" ]; then
    echo -e "${YELLOW}🔧 正在更新 Cloudflare Worker 配置...${NC}"
    # 备份原文件
    cp cloudflare-worker.js cloudflare-worker.js.bak 2>/dev/null
    # 替换默认 URL
    sed -i.tmp "s|https://nfcode.lthero.cn|${WEB_APP_URL}|g" cloudflare-worker.js && rm cloudflare-worker.js.tmp 2>/dev/null || true
    echo -e "${GREEN}✅ Worker 配置已更新为: ${WEB_APP_URL}${NC}"
fi

# 安装依赖
echo -e "${YELLOW}📦 正在安装依赖...${NC}"
if npm install; then
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
else
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi

# 初始化数据库
if [ ! -f "emails.db" ]; then
    echo -e "${YELLOW}🗄️  正在初始化数据库...${NC}"
    if node scripts/addRule.js; then
        echo -e "${GREEN}✅ 数据库初始化成功${NC}"
    else
        echo -e "${RED}❌ 数据库初始化失败${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 数据库已存在${NC}"
fi

# 构建项目
echo -e "${YELLOW}🔨 正在构建项目...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ 项目构建成功${NC}"
else
    echo -e "${RED}❌ 项目构建失败${NC}"
    exit 1
fi

# 检查 PM2
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ 检测到 PM2${NC}"
    
    # 停止旧进程
    pm2 stop email-forward 2>/dev/null
    pm2 delete email-forward 2>/dev/null
    
    # 启动新进程
    echo -e "${YELLOW}🚀 正在启动服务 (PM2) 端口: ${PORT:-3000}...${NC}"
    if PORT=${PORT:-3303} pm2 start npm --name "email-forward" --update-env -- start; then
        pm2 save
        echo -e "${GREEN}✅ 服务启动成功！${NC}"
        echo ""
        echo -e "${GREEN}📊 查看状态: pm2 status${NC}"
        echo -e "${GREEN}📝 查看日志: pm2 logs email-forward${NC}"
        echo -e "${GREEN}🔄 重启服务: pm2 restart email-forward${NC}"
        echo ""
        pm2 status
    else
        echo -e "${RED}❌ 服务启动失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  未检测到 PM2，使用 npm start 启动...${NC}"
    echo -e "${YELLOW}💡 建议安装 PM2 以便更好地管理进程: npm install -g pm2${NC}"
    echo ""
    echo -e "${GREEN}🚀 启动服务 (端口: ${PORT:-3000})...${NC}"
    echo -e "${YELLOW}提示: 按 Ctrl+C 停止服务${NC}"
    PORT=${PORT:-3303} npm start
fi

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "${GREEN}📍 访问地址:${NC}"
echo -e "   本地: http://localhost:${PORT:-3303}"

# 获取外网 IP
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "无法获取")
if [ "$EXTERNAL_IP" != "无法获取" ]; then
    echo -e "   外网: http://${EXTERNAL_IP}:${PORT:-3303}"
fi

# 如果配置了自定义域名
if [ -n "${WEB_APP_URL}" ] && [ "${WEB_APP_URL}" != "http://your-server-ip:3303" ]; then
    echo -e "   自定义: ${WEB_APP_URL}"
fi

echo ""
echo -e "${GREEN}🔑 登录密码: ${ADMIN_PASSWORD:-admin123}${NC}"
echo -e "${GREEN}🔐 API 密钥: ${WEBHOOK_API_KEY}${NC}"
echo ""
echo -e "${YELLOW}📝 配置 Cloudflare Worker:${NC}"
echo -e "   1. 复制 cloudflare-worker.js 内容到 Cloudflare Worker"
echo -e "   2. 设置环境变量:"
echo -e "      - WEB_APP_URL: ${WEB_APP_URL:-http://${EXTERNAL_IP}:${PORT:-3303}}"
echo -e "      - WEBHOOK_API_KEY: ${WEBHOOK_API_KEY}"
echo ""
echo -e "${YELLOW}💡 提示: cloudflare-worker.js 中的默认 URL 已更新为你的配置${NC}"
