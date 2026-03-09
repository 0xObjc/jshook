#!/usr/bin/env node

/**
 * JSHook Reverse Tool - Skill Entry Point (Thin Client)
 *
 * 通过 Unix Socket 连接后台 Daemon 进程执行命令。
 * 如果 Daemon 未运行，自动在后台启动。
 * 所有状态（浏览器连接、hooks、收集数据）由 Daemon 持久保持。
 */

import * as net from 'node:net';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOCKET_PATH = path.join(process.env.TMPDIR || '/tmp', 'jshook-daemon.sock');
const PID_FILE = path.join(process.env.TMPDIR || '/tmp', 'jshook-daemon.pid');
const DAEMON_SCRIPT = path.join(__dirname, 'daemon.js');
const DAEMON_READY_TIMEOUT_MS = 10_000;
const DAEMON_POLL_INTERVAL_MS = 200;

interface DaemonResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

/** 尝试连接 daemon，发送命令并返回结果 */
function sendCommand(command: string, args: string[]): Promise<DaemonResponse> {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(SOCKET_PATH, () => {
      const payload = JSON.stringify({ command, args }) + '\n';
      client.write(payload);
    });

    let buffer = '';
    client.on('data', (chunk) => {
      buffer += chunk.toString();
      const idx = buffer.indexOf('\n');
      if (idx !== -1) {
        const line = buffer.slice(0, idx);
        client.end();
        try {
          resolve(JSON.parse(line));
        } catch {
          reject(new Error('Invalid daemon response'));
        }
      }
    });

    client.on('error', (err) => reject(err));
    client.setTimeout(120_000, () => {
      client.destroy();
      reject(new Error('Daemon request timed out'));
    });
  });
}

/** 检查 daemon 是否存活 */
async function isDaemonAlive(): Promise<boolean> {
  try {
    const resp = await sendCommand('__ping', []);
    return resp.success === true;
  } catch {
    return false;
  }
}

/** 启动 daemon 并等待就绪 */
async function ensureDaemon(): Promise<void> {
  if (await isDaemonAlive()) return;

  // 清理残留
  try { fs.unlinkSync(SOCKET_PATH); } catch {}
  try { fs.unlinkSync(PID_FILE); } catch {}

  // 后台启动 daemon（detached + stdio ignore）
  const child = spawn(process.execPath, [DAEMON_SCRIPT], {
    detached: true,
    stdio: 'ignore',
    cwd: path.dirname(DAEMON_SCRIPT),
    env: { ...process.env },
  });
  child.unref();

  // 轮询等待 daemon 就绪
  const deadline = Date.now() + DAEMON_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, DAEMON_POLL_INTERVAL_MS));
    if (await isDaemonAlive()) return;
  }

  throw new Error('Daemon failed to start within timeout');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  try {
    await ensureDaemon();

    const command = args[0];
    const commandArgs = args.slice(1);

    const resp = await sendCommand(command, commandArgs);

    if (resp.success) {
      console.log(JSON.stringify(resp.result, null, 2));
    } else {
      console.log(JSON.stringify({
        success: false,
        error: resp.error || 'Unknown daemon error',
        code: 'DAEMON_ERROR',
      }, null, 2));
      process.exit(1);
    }
  } catch (error) {
    const err = error as Error;
    console.log(JSON.stringify({
      success: false,
      error: err.message,
      code: 'CLIENT_ERROR',
    }, null, 2));
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
JSHook Reverse Tool - AI-powered JavaScript Reverse Engineering

USAGE:
  jshook-reverse <command> [options]

COMMANDS:
  collect <url>              Collect JavaScript code from target website
  search <keyword>           Search for keywords in collected scripts
  deobfuscate <code>         AI-driven code deobfuscation
  understand <code>          AI-assisted code understanding
  detect-crypto <code>       Detect encryption algorithms
  browser <action>           Browser control (launch/close/status)
  stats                      Get statistics
  clear                      Clear collected data

DAEMON COMMANDS:
  __ping                     Check if daemon is running
  __shutdown                 Shutdown the daemon

OPTIONS:
  -h, --help                 Show this help message

EXAMPLES:
  jshook-reverse collect https://example.com
  jshook-reverse search "encrypt"
  jshook-reverse browser launch
  jshook-reverse stats
`);
}

main();
