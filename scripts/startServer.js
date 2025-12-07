#!/usr/bin/env node

/**
 * 智能端口启动脚本
 * 如果端口被占用，自动尝试下一个端口
 */

const net = require('net');
const { spawn } = require('child_process');

// 从环境变量或 .env.local 获取初始端口
const dotenv = require('dotenv');
const fs = require('fs');

// 加载 .env.local
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

const startPort = parseInt(process.env.PORT || '3000', 10);
const maxAttempts = 10; // 最多尝试 10 个端口

/**
 * 检查端口是否可用
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // 端口被占用
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // 端口可用
    });
    
    server.listen(port);
  });
}

/**
 * 查找可用端口
 */
async function findAvailablePort(startPort, maxAttempts) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const isAvailable = await checkPort(port);
    
    if (isAvailable) {
      return port;
    }
    
    console.log(`⚠️  端口 ${port} 已被占用，尝试下一个...`);
  }
  
  return null;
}

/**
 * 启动 Next.js 服务器
 */
async function startServer() {
  console.log('🚀 正在查找可用端口...\n');
  
  const availablePort = await findAvailablePort(startPort, maxAttempts);
  
  if (!availablePort) {
    console.error(`❌ 未找到可用端口 (尝试范围: ${startPort}-${startPort + maxAttempts - 1})`);
    process.exit(1);
  }
  
  if (availablePort !== startPort) {
    console.log(`✅ 找到可用端口: ${availablePort} (原端口 ${startPort} 被占用)\n`);
  } else {
    console.log(`✅ 使用端口: ${availablePort}\n`);
  }
  
  // 确定运行模式
  const mode = process.argv[2] || 'dev'; // dev 或 start
  const command = mode === 'start' ? 'next' : 'next';
  const args = mode === 'start' ? ['start', '-p', availablePort.toString()] : ['dev', '-p', availablePort.toString()];
  
  console.log(`📍 启动命令: ${command} ${args.join(' ')}\n`);
  console.log(`🌐 访问地址: http://localhost:${availablePort}\n`);
  
  // 启动 Next.js
  const nextProcess = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: availablePort.toString(),
    },
  });
  
  nextProcess.on('error', (err) => {
    console.error('❌ 启动失败:', err.message);
    process.exit(1);
  });
  
  nextProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n\n👋 正在停止服务...');
    nextProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n👋 正在停止服务...');
    nextProcess.kill('SIGTERM');
  });
}

// 启动服务器
startServer().catch((err) => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});
