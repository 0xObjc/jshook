---
name: jshook-reverse
description: "AI-powered JavaScript reverse engineering tool. 资深JavaScript逆向工程专家助手。Actions: collect, search, deobfuscate, understand, summarize, detect-crypto, browser, debugger, breakpoint, debug-step, debug-eval, debug-vars, script, hook, stealth, dom, page. Capabilities: 混淆代码分析、VM破解、Webpack解包、AST转换、Puppeteer/CDP自动化、反检测、指纹伪造、加密识别、参数提取、算法还原、Canvas/WebGL指纹、WebDriver隐藏、CDP调试、断点分析、动态追踪、Hook注入、DOM检查、页面控制。"
---

# JavaScript逆向工程专家

资深JavaScript逆向工程专家，精通浏览器自动化、代码分析和反混淆。

## 核心能力

- **逆向工程**：混淆代码分析、VM破解、Webpack解包、AST转换
- **浏览器自动化**：Puppeteer/CDP、反检测、指纹伪造
- **加密识别**：AES/RSA/MD5/SHA识别、参数提取、算法还原
- **反爬虫绕过**：Canvas/WebGL指纹、WebDriver隐藏、行为模拟
- **调试分析**：CDP调试、断点分析、动态追踪、Hook注入
- **DOM检查**：元素查询、结构分析、可点击元素定位
- **页面控制**：导航、点击、输入、截图、性能监控

## 工作原理

所有命令通过执行 `node dist/skill.js <command> [args]` 来调用工具。

## 快速开始

### 1. 启动浏览器
```bash
node dist/skill.js browser launch
```

### 2. 导航到目标网站
```bash
node dist/skill.js page navigate https://example.com
```

### 3. 收集JavaScript代码
```bash
node dist/skill.js collect https://example.com
```

### 4. 搜索加密函数
```bash
node dist/skill.js search encrypt
```

### 5. 分析代码
```bash
node dist/skill.js understand "function encrypt(data) {...}"
```

## 命令分类

### 代码收集与分析
- `collect <url>` - 智能代码收集（支持摘要/优先级模式）
- `search <keyword>` - 搜索关键词（支持正则、上下文）
- `deobfuscate <code>` - AI驱动的代码反混淆
- `understand <code>` - AI辅助的代码语义理解
- `summarize <action>` - AI生成代码摘要
- `detect-crypto <code>` - 检测和分析加密算法

### 浏览器控制
- `browser launch` - 启动浏览器
- `browser status` - 获取浏览器状态
- `browser close` - 关闭浏览器

### DOM检查
- `dom query <selector>` - 查询单个元素
- `dom query-all <selector> [limit]` - 查询多个元素
- `dom structure [maxDepth]` - 获取DOM结构
- `dom clickable [filterText]` - 查找可点击元素
- `dom style <selector>` - 获取计算样式
- `dom wait <selector> [timeout]` - 等待元素出现

### 页面控制
- `page navigate <url>` - 导航到URL
- `page reload` - 重新加载页面
- `page back/forward` - 前进后退
- `page click <selector>` - 点击元素
- `page type <selector> <text>` - 输入文本
- `page scroll <x> <y>` - 滚动页面
- `page screenshot [path]` - 截图
- `page eval <code>` - 执行JavaScript
- `page url/title/content` - 获取页面信息
- `page metrics` - 获取性能指标

### 调试分析
- `debugger enable/disable/status` - 调试器控制
- `breakpoint set-url <url> <line>` - 设置断点
- `debug-step pause/resume/into/over/out` - 执行控制
- `debug-eval <expression>` - 表达式求值
- `debug-vars [callFrameId]` - 变量查看
- `script list/get/find/search` - 脚本管理

### Hook注入
- `hook generate <type> [target]` - 快速生成Hook
  - 类型：function, fetch, xhr, websocket, property, event, eval, cookie, localstorage, timer
- `hook-list` - 获取Hook统计
- `hook-data [hookId]` - 获取Hook捕获的数据

### 反检测伪装
- `stealth inject` - 注入反检测脚本
- `stealth inject-preset <preset>` - 使用平台预设
  - 预设：windows-chrome, mac-chrome, mac-safari, linux-chrome, windows-edge
- `stealth status` - 查看当前stealth状态

### 数据管理
- `stats` - 获取统计信息
- `clear` - 清除所有数据

## 工作流程

### 逆向的本质
理解需求 → 定位目标 → 分析实现 → 复现逻辑

### 核心技巧：从结果反推过程
- 看到加密参数 → 反推生成函数
- 看到混淆代码 → 反推原始逻辑
- 看到网络请求 → 反推调用链路

### 标准流程
1. **快速侦查**：了解技术栈、加密方式、反爬虫手段
2. **加密参数定位**：从结果反推过程，定位生成位置
3. **加密算法识别**：深入分析实现，识别算法类型
4. **代码复现**：转化为可执行代码，完成逆向闭环

## 最佳实践

1. **使用智能摘要模式**避免数据过大
2. **优先收集关键代码**（encrypt、crypto、sign）
3. **使用增量模式**按需获取
4. **从结果反推过程**，避免盲目调试
5. **使用断点和变量查看**进行动态分析
6. **使用dom命令定位页面元素**，避免盲目点击
7. **使用page命令进行页面交互**和自动化操作

## 完整示例

### 示例1：分析网站加密逻辑
```bash
# 1. 启动浏览器
node dist/skill.js browser launch

# 2. 导航到目标网站
node dist/skill.js page navigate https://example.com

# 3. 注入反检测脚本
node dist/skill.js stealth inject-preset windows-chrome

# 4. 收集代码
node dist/skill.js collect https://example.com

# 5. 搜索加密函数
node dist/skill.js search encrypt --regex

# 6. 分析加密算法
node dist/skill.js detect-crypto "function encrypt(data) {...}"

# 7. 理解代码逻辑
node dist/skill.js understand "function encrypt(data) {...}"
```

### 示例2：自动化登录流程
```bash
# 1. 启动浏览器并导航
node dist/skill.js browser launch
node dist/skill.js page navigate https://example.com/login

# 2. 查找登录表单元素
node dist/skill.js dom clickable 登录

# 3. 输入用户名和密码
node dist/skill.js page type #username admin
node dist/skill.js page type #password password123

# 4. 点击登录按钮
node dist/skill.js page click #login-button

# 5. 等待登录完成
node dist/skill.js page wait-selector .dashboard

# 6. 截图验证
node dist/skill.js page screenshot login-success.png
```

### 示例3：Hook函数调用
```bash
# 1. 生成fetch Hook
node dist/skill.js hook generate fetch */api/*

# 2. 生成函数Hook
node dist/skill.js hook generate function encryptData

# 3. 查看Hook列表
node dist/skill.js hook-list

# 4. 获取捕获的数据
node dist/skill.js hook-data
```

## 注意事项

- 所有命令都在项目根目录执行
- 需要先启动浏览器才能使用DOM和Page命令
- 使用反检测功能时建议先注入stealth脚本
- 大量数据收集时使用智能摘要模式
- Hook功能需要在页面加载前注入

## 技术栈

- **语言**：TypeScript
- **浏览器自动化**：Puppeteer
- **AI分析**：OpenAI/Anthropic API
- **反混淆**：AST转换、模式识别
- **反检测**：Stealth脚本、指纹伪造

## 配置

环境变量配置在 `.env` 文件中：
- `OPENAI_API_KEY` - OpenAI API密钥
- `ANTHROPIC_API_KEY` - Anthropic API密钥
- `DEFAULT_LLM_PROVIDER` - 默认LLM提供商（openai/anthropic）
- `PUPPETEER_HEADLESS` - 是否无头模式
- `REMOTE_DEBUGGING_URL` - 远程调试URL

## 故障排除

### 浏览器启动失败
- 检查Chrome/Edge是否已安装
- 检查端口9222是否被占用
- 尝试使用外部浏览器模式

### AI分析失败
- 检查API密钥是否配置正确
- 检查网络连接
- 检查API配额是否充足

### DOM查询失败
- 确保浏览器已启动
- 确保页面已加载完成
- 检查选择器是否正确
