#!/usr/bin/env node

/**
 * JSHook Reverse Tool - MCP Server 入口
 * 
 * 常驻进程模式：通过 stdio JSON-RPC 与 Cascade 通信
 * 所有状态（浏览器连接、hooks、收集数据）在会话期间完全保持
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getConfig, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { SkillRouter } from './skill/SkillRouter.js';

let router: SkillRouter;

async function main() {
  // 加载配置
  const config = getConfig();
  const validation = validateConfig(config);
  if (!validation.valid) {
    logger.error('Configuration validation failed:');
    validation.errors.forEach((error) => logger.error(`  - ${error}`));
    process.exit(1);
  }

  // 创建 SkillRouter（常驻，不会 cleanup）
  router = new SkillRouter(config);
  await router.init();

  // 创建 MCP Server
  const server = new McpServer(
    {
      name: 'jshook-reverse',
      version: '0.1.1',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ==================== 浏览器控制 ====================

  server.tool(
    'browser',
    '浏览器控制：启动/关闭/状态查询',
    {
      action: z.enum(['launch', 'close', 'status']).describe('操作类型'),
    },
    async ({ action }) => {
      const result = await router.execute('browser', [action]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 代码收集 ====================

  server.tool(
    'collect',
    '收集目标网页的JavaScript代码（支持智能模式：摘要/优先级/增量）',
    {
      url: z.string().describe('目标网页URL'),
      smartMode: z.enum(['summary', 'priority']).optional().describe('智能收集模式'),
      priorities: z.string().optional().describe('优先级关键词，逗号分隔，如: encrypt,crypto,sign'),
    },
    async ({ url, smartMode, priorities }) => {
      const args = [url];
      if (smartMode) args.push(`--smart-mode=${smartMode}`);
      if (priorities) args.push(`--priorities=${priorities}`);
      const result = await router.execute('collect', args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 搜索 ====================

  server.tool(
    'search',
    '在收集的脚本中搜索关键词（支持正则表达式和上下文）',
    {
      keyword: z.string().describe('搜索关键词或正则表达式'),
      regex: z.boolean().optional().describe('是否启用正则模式'),
      context: z.number().optional().describe('上下文行数'),
      maxMatches: z.number().optional().describe('最大匹配数'),
    },
    async ({ keyword, regex, context, maxMatches }) => {
      const args = [keyword];
      if (regex) args.push('--regex');
      if (context) args.push(`--context=${context}`);
      if (maxMatches) args.push(`--max-matches=${maxMatches}`);
      const result = await router.execute('search', args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 反混淆 ====================

  server.tool(
    'deobfuscate',
    'AI驱动的代码反混淆，支持20+种混淆类型',
    {
      code: z.string().describe('需要反混淆的代码'),
    },
    async ({ code }) => {
      const result = await router.execute('deobfuscate', [code]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 代码理解 ====================

  server.tool(
    'understand',
    'AI辅助的代码语义理解和业务逻辑分析',
    {
      code: z.string().describe('需要理解的代码'),
    },
    async ({ code }) => {
      const result = await router.execute('understand', [code]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 代码摘要 ====================

  server.tool(
    'summarize',
    'AI生成代码摘要（单文件/批量/项目级）',
    {
      code: z.string().describe('需要摘要的代码'),
    },
    async ({ code }) => {
      const result = await router.execute('summarize', [code]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 加密检测 ====================

  server.tool(
    'detect_crypto',
    '检测和分析代码中的加密算法（AES/RSA/MD5/SHA等）',
    {
      code: z.string().describe('需要检测加密的代码'),
    },
    async ({ code }) => {
      const result = await router.execute('detect-crypto', [code]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== Hook 管理 ====================

  server.tool(
    'hook',
    'Hook注入：函数拦截、网络监控、属性劫持、事件追踪',
    {
      action: z.string().describe('操作：create/remove/clear/list/data 或 Hook类型如 fetch/xhr/function/property/event/timer/cookie/eval/websocket/localstorage/custom/object-method'),
      args: z.string().optional().describe('额外参数，JSON格式。create时传入Hook配置'),
    },
    async ({ action, args: extraArgs }) => {
      const cmdArgs = [action];
      if (extraArgs) cmdArgs.push(extraArgs);
      const result = await router.execute('hook', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'hook_list',
    '列出所有已注入的Hooks',
    {},
    async () => {
      const result = await router.execute('hook-list', []);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'hook_data',
    '获取Hook捕获的数据',
    {
      hookId: z.string().optional().describe('Hook ID，不传则获取所有'),
    },
    async ({ hookId }) => {
      const args = hookId ? [hookId] : [];
      const result = await router.execute('hook-data', args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'hook_types',
    '列出所有支持的Hook类型',
    {},
    async () => {
      const result = await router.execute('hook-types', []);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 调试器 ====================

  server.tool(
    'debugger_control',
    'CDP调试器控制：启用/禁用/状态',
    {
      action: z.enum(['enable', 'disable', 'status']).describe('操作类型'),
    },
    async ({ action }) => {
      const result = await router.execute('debugger', [action]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'breakpoint',
    '断点管理：设置/删除/列表/清除',
    {
      action: z.string().describe('操作：set/remove/list/clear'),
      args: z.string().optional().describe('断点参数，JSON格式'),
    },
    async ({ action, args: extraArgs }) => {
      const cmdArgs = [action];
      if (extraArgs) cmdArgs.push(extraArgs);
      const result = await router.execute('breakpoint', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'debug_step',
    '执行控制：暂停/恢复/单步执行',
    {
      action: z.enum(['pause', 'resume', 'step-over', 'step-into', 'step-out']).describe('执行操作'),
    },
    async ({ action }) => {
      const result = await router.execute('debug-step', [action]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'debug_eval',
    '在调试上下文中求值表达式',
    {
      expression: z.string().describe('要求值的JavaScript表达式'),
    },
    async ({ expression }) => {
      const result = await router.execute('debug-eval', [expression]);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'debug_vars',
    '查看作用域变量',
    {
      action: z.string().optional().describe('操作：scope/all，默认scope'),
    },
    async ({ action }) => {
      const result = await router.execute('debug-vars', action ? [action] : []);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 脚本管理 ====================

  server.tool(
    'script',
    '脚本管理：列表/获取源码/搜索',
    {
      action: z.string().describe('操作：list/source/search'),
      args: z.string().optional().describe('参数（scriptId或搜索关键词）'),
    },
    async ({ action, args: extraArgs }) => {
      const cmdArgs = [action];
      if (extraArgs) cmdArgs.push(extraArgs);
      const result = await router.execute('script', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== Watch ====================

  server.tool(
    'watch',
    '变量监视：添加/删除/列表/求值/清除',
    {
      action: z.string().describe('操作：add/remove/list/evaluate/clear'),
      expression: z.string().optional().describe('监视表达式'),
    },
    async ({ action, expression }) => {
      const cmdArgs = [action];
      if (expression) cmdArgs.push(expression);
      const result = await router.execute('watch', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== XHR 断点 ====================

  server.tool(
    'xhr_breakpoint',
    'XHR/Fetch 断点：按URL模式拦截网络请求',
    {
      action: z.string().describe('操作：set/remove/list/clear'),
      urlPattern: z.string().optional().describe('URL匹配模式'),
    },
    async ({ action, urlPattern }) => {
      const cmdArgs = [action];
      if (urlPattern) cmdArgs.push(urlPattern);
      const result = await router.execute('xhr-breakpoint', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== Event 断点 ====================

  server.tool(
    'event_breakpoint',
    '事件断点：监听特定DOM事件',
    {
      action: z.string().describe('操作：set/remove/list/clear'),
      eventName: z.string().optional().describe('事件名称，如click/keydown/submit'),
    },
    async ({ action, eventName }) => {
      const cmdArgs = [action];
      if (eventName) cmdArgs.push(eventName);
      const result = await router.execute('event-breakpoint', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== Blackbox ====================

  server.tool(
    'blackbox',
    '黑盒脚本：跳过指定脚本的调试',
    {
      action: z.string().describe('操作：add/remove/list/clear'),
      pattern: z.string().optional().describe('脚本URL模式'),
    },
    async ({ action, pattern }) => {
      const cmdArgs = [action];
      if (pattern) cmdArgs.push(pattern);
      const result = await router.execute('blackbox', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== Stealth ====================

  server.tool(
    'stealth',
    '反检测伪装：注入/状态/预设/功能列表',
    {
      action: z.string().describe('操作：inject/status/presets/features'),
      preset: z.string().optional().describe('预设：windows-chrome/mac-chrome/mac-safari/linux-chrome/windows-edge'),
    },
    async ({ action, preset }) => {
      const cmdArgs = [action];
      if (preset) cmdArgs.push(`--preset=${preset}`);
      const result = await router.execute('stealth', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== DOM 检查 ====================

  server.tool(
    'dom',
    'DOM检查：查询元素、分析结构、定位可点击元素',
    {
      action: z.string().describe('操作：query/structure/clickable/text/attrs/html'),
      selector: z.string().optional().describe('CSS选择器'),
    },
    async ({ action, selector }) => {
      const cmdArgs = [action];
      if (selector) cmdArgs.push(selector);
      const result = await router.execute('dom', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 页面控制 ====================

  server.tool(
    'page',
    '页面控制：导航/点击/输入/截图/滚动/等待/性能/cookies',
    {
      action: z.string().describe('操作：navigate/click/type/screenshot/scroll/wait/performance/cookies/back/forward/reload'),
      args: z.string().optional().describe('操作参数（URL/选择器/文本等）'),
      extra: z.string().optional().describe('额外参数'),
    },
    async ({ action, args: arg1, extra }) => {
      const cmdArgs = [action];
      if (arg1) cmdArgs.push(arg1);
      if (extra) cmdArgs.push(extra);
      const result = await router.execute('page', cmdArgs);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 统计 ====================

  server.tool(
    'stats',
    '获取缓存和收集统计信息',
    {},
    async () => {
      const result = await router.execute('stats', []);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 清除 ====================

  server.tool(
    'clear',
    '清除所有收集的数据和缓存',
    {},
    async () => {
      const result = await router.execute('clear', []);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ==================== 启动 Server ====================

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('🚀 JSHook MCP Server started (persistent mode)');

  // 优雅退出
  process.on('SIGINT', async () => {
    logger.info('Shutting down MCP Server...');
    await router.cleanup();
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down MCP Server...');
    await router.cleanup();
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('MCP Server failed to start:', error);
  process.exit(1);
});
