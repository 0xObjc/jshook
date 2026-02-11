# JSHook Reverse Tool - Claude Code Skill

AI-powered JavaScript reverse engineering tool for Claude Code.

## 功能特性

### 核心功能
- 🔍 **智能代码收集**: 支持摘要/优先级/增量模式，防止Token溢出
- 🔎 **代码搜索**: 支持正则表达式和上下文搜索
- 🔓 **AI反混淆**: 支持20+种混淆类型，自动还原代码
- 🧠 **代码理解**: AI辅助的代码语义理解和业务逻辑分析
- 🔐 **加密检测**: 自动识别AES/RSA/MD5/SHA和自定义算法
- 🌐 **浏览器控制**: 自动检测和启动Chrome/Edge（支持任意盘符C-Z）
- 📊 **统计信息**: 完善的缓存机制和统计信息

### 技术亮点
- ✅ **CDP连接**: 使用Chrome DevTools Protocol，稳定可靠
- ✅ **自动检测**: 自动扫描所有盘符，找到可用浏览器
- ✅ **反检测技术**: 集成Stealth脚本，绕过WebDriver检测
- ✅ **资源管理**: 完善的CDP会话清理，防止内存泄漏
- ✅ **类型安全**: 严格的TypeScript类型检查
- ✅ **错误处理**: 完善的异常捕获和恢复机制

## 安装

```bash
cd jshook-skill
npm install
npm run build
```

## 配置

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置API密钥：

```env
# OpenAI API配置
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4

# 或使用Anthropic
ANTHROPIC_API_KEY=your-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# 默认LLM提供商
DEFAULT_LLM_PROVIDER=openai
```

## 浏览器设置

### 自动启动模式（推荐）

工具会自动检测并启动Chrome或Edge浏览器：

```bash
# 自动检测所有盘符（C-Z）的Chrome/Edge
# 无需手动配置，直接使用
jshook-reverse browser launch
```

**支持的浏览器：**
- Google Chrome（任意盘符）
- Microsoft Edge（任意盘符）

### 手动启动模式

如果需要使用特定浏览器，可以手动启动并连接：

```bash
# 1. 手动启动浏览器（带远程调试）
chrome.exe --remote-debugging-port=9222

# 2. 配置.env文件
REMOTE_DEBUGGING_URL=http://127.0.0.1:9222

# 3. 使用工具
jshook-reverse collect https://example.com
```

## 使用方法

### 基本命令

```bash
# 收集代码
jshook-reverse collect https://example.com

# 搜索关键词
jshook-reverse search "encrypt"

# 反混淆代码
jshook-reverse deobfuscate "var _0x1234=..."

# 理解代码
jshook-reverse understand "function sign(data) {...}"

# 检测加密
jshook-reverse detect-crypto "function encrypt(data) {...}"

# 浏览器控制
jshook-reverse browser launch
jshook-reverse browser status
jshook-reverse browser close

# 获取统计
jshook-reverse stats

# 清除数据
jshook-reverse clear
```

## 作为Claude Code Skill使用

将此项目配置为Claude Code Skill后，可以直接在Claude Code中使用：

```
/jshook-reverse collect https://example.com
/jshook-reverse search "encrypt"
```

## 项目结构

```
jshook-skill/
├── src/
│   ├── skill/           # Skill特定代码
│   │   └── SkillRouter.ts
│   ├── modules/         # 核心功能模块
│   │   ├── collector/   # 代码收集
│   │   ├── debugger/    # 调试器
│   │   ├── deobfuscator/# 反混淆
│   │   ├── analyzer/    # 代码分析
│   │   └── ...
│   ├── utils/           # 工具类
│   ├── types/           # 类型定义
│   ├── services/        # 服务层
│   └── skill.ts         # 入口文件
├── skill.json           # Skill配置
├── package.json
└── tsconfig.json
```

## 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 格式化代码
npm run format
```

## 更新日志

### v0.1.1 (2025-01)

**重大改进：**
- ✅ 改造为CDP连接模式，移除Puppeteer自动启动
- ✅ 添加浏览器自动检测（支持所有盘符C-Z）
- ✅ 整合完整系统提示词到skill.json

**关键修复（10项）：**
1. 删除死代码StreamingCollector.ts
2. 移除43行重复反检测代码
3. 更新User-Agent (Chrome 120→131)
4. 修复CDP会话资源泄漏（移至finally块）
5. 添加MAX_FILES_CACHE_SIZE防止内存泄漏
6. 移除所有注释引用
7. CDP会话空指针检查（移除危险的非空断言）
8. 元数据类型安全（安全访问originalSize）
9. 缓存大小限制实现（FIFO策略）
10. 正则表达式错误处理（捕获无效模式）

**技术改进：**
- 完善的资源管理和清理机制
- 严格的TypeScript类型检查
- 完善的错误处理和恢复
- 优化的内存使用策略

## 许可证

MIT
