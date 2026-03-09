#!/usr/bin/env node

/**
 * JSHook Reverse Tool - Daemon Process
 * 
 * 后台常驻进程，通过 Unix Socket 接受命令，保持 SkillRouter 状态（浏览器连接、hooks 等）。
 * 由 skill.ts 自动启动和管理，用户无需手动操作。
 */

import * as net from 'node:net';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SkillRouter } from './skill/SkillRouter.js';
import { getConfig, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';

const SOCKET_PATH = path.join(process.env.TMPDIR || '/tmp', 'jshook-daemon.sock');
const PID_FILE = path.join(process.env.TMPDIR || '/tmp', 'jshook-daemon.pid');
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min idle auto-shutdown

let router: SkillRouter;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    logger.info('Idle timeout reached, shutting down daemon...');
    await shutdown();
  }, IDLE_TIMEOUT_MS);
}

async function shutdown() {
  try {
    if (router) await router.cleanup();
  } catch {}
  try { fs.unlinkSync(SOCKET_PATH); } catch {}
  try { fs.unlinkSync(PID_FILE); } catch {}
  process.exit(0);
}

const COMMAND_TIMEOUT_MS = 60_000; // 单条命令最大执行时间 60s

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Command '${label}' timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

async function handleRequest(data: string): Promise<string> {
  try {
    const req = JSON.parse(data);
    const { command, args } = req as { command: string; args: string[] };

    if (command === '__ping') {
      return JSON.stringify({ success: true, result: 'pong' });
    }

    if (command === '__shutdown') {
      setTimeout(() => shutdown(), 100);
      return JSON.stringify({ success: true, result: 'shutting down' });
    }

    logger.info(`Executing: ${command} ${(args || []).join(' ')}`);
    const result = await withTimeout(
      router.execute(command, args || []),
      COMMAND_TIMEOUT_MS,
      command,
    );
    logger.info(`Done: ${command}`);
    return JSON.stringify({ success: true, result });
  } catch (error) {
    const err = error as Error;
    logger.error(`Error: ${err.message}`);
    return JSON.stringify({ success: false, error: err.message });
  }
}

async function main() {
  // 清理残留 socket
  try { fs.unlinkSync(SOCKET_PATH); } catch {}

  // 初始化配置
  const config = getConfig();
  const validation = validateConfig(config);
  if (!validation.valid) {
    logger.error('Config validation failed:', validation.errors.join(', '));
    process.exit(1);
  }

  // 初始化 SkillRouter（常驻）
  router = new SkillRouter(config);
  await router.init();

  // 创建 Unix Socket Server
  const server = net.createServer((conn) => {
    resetIdleTimer();
    let buffer = '';

    conn.on('data', async (chunk) => {
      buffer += chunk.toString();
      // 用换行分隔消息
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const response = await handleRequest(line.trim());
        conn.write(response + '\n');
      }
    });

    conn.on('error', () => {});
  });

  server.listen(SOCKET_PATH, () => {
    // 写 PID 文件
    fs.writeFileSync(PID_FILE, String(process.pid));
    logger.info(`🚀 JSHook Daemon started (pid=${process.pid}, socket=${SOCKET_PATH})`);
    resetIdleTimer();
  });

  server.on('error', (err) => {
    logger.error('Daemon server error:', err.message);
    process.exit(1);
  });

  // 优雅退出
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, async () => {
      logger.info(`Received ${sig}, shutting down daemon...`);
      server.close();
      await shutdown();
    });
  }
}

main().catch((error) => {
  logger.error('Daemon failed to start:', error);
  process.exit(1);
});
