# 答题助手

一款基于 Chromium 内核浏览器的智能答题助手插件，使用 AI 模型帮助用户搜索问题答案。

## 功能特点

- 🎯 智能答题：使用 AI 模型快速获取问题答案
- 📋 文本选择：支持在网页上直接选择问题文本
- 🔧 灵活配置：支持自定义 API 地址、密钥和模型名称
- 🌐 全站兼容：适用于所有 Chromium 内核浏览器（Chrome、Edge、Brave 等）
- 💾 本地存储：配置信息安全保存在本地

## 安装方法

### 1. 准备图标文件

在安装插件前，需要先将 `icons/icon.svg` 转换为 PNG 格式：

- **icon16.png** (16x16 像素)
- **icon48.png** (48x48 像素)
- **icon128.png** (128x128 像素)

可以使用以下方法转换：
- 在线工具：https://cloudconvert.com/svg-to-png
- 使用 ImageMagick：
  ```bash
  convert icons/icon.svg -resize 16x16 icons/icon16.png
  convert icons/icon.svg -resize 48x48 icons/icon48.png
  convert icons/icon.svg -resize 128x128 icons/icon128.png
  ```

### 2. 加载插件

1. 打开浏览器，访问 `chrome://extensions/` 或 `edge://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本项目文件夹
5. 插件安装完成！

## 使用方法

### 配置 API

1. 点击浏览器工具栏中的插件图标
2. 在弹窗中填写以下信息：
   - **API 地址**：你的 AI API 地址（如：https://api.openai.com/v1/chat/completions）
   - **API 密钥**：你的 API 密钥
   - **模型名称**：使用的模型名称（如：gpt-3.5-turbo）
3. 点击"保存配置"按钮

### 搜索答案

有两种方式使用插件：

**方式一：选中文本**
1. 在网页上选中问题文本
2. 点击插件图标
3. 选中的文本会自动填充到问题输入框
4. 点击"搜索答案"按钮

**方式二：右键菜单**
1. 在网页上选中问题文本
2. 右键点击，选择"使用答题助手搜索答案"
3. 插件弹窗会自动打开并填充选中的文本

## 项目结构

```
Answer-Assistant/
├── manifest.json          # 插件配置文件（Manifest V3）
├── popup/                 # 弹窗界面
│   ├── popup.html        # 弹窗 HTML
│   ├── popup.js          # 弹窗逻辑
│   └── popup.css         # 弹窗样式
├── content/              # 内容脚本
│   └── content.js        # 页面文本选择监听
├── background/           # 后台服务
│   └── background.js     # 消息处理和 API 调用
├── icons/               # 插件图标
│   ├── icon.svg          # SVG 图标（需转换为 PNG）
│   └── README.md         # 图标说明
├── config/              # 配置文件
│   └── config.js        # 配置常量和工具函数
└── README.md            # 项目说明文档
```

## 技术栈

- **Manifest V3**：最新的 Chrome 扩展标准
- **Vanilla JavaScript**：原生 JavaScript，无依赖
- **Chrome Storage API**：本地配置存储
- **Chrome Context Menus API**：右键菜单集成
- **Fetch API**：HTTP 请求处理

## API 兼容性

插件兼容以下 API 格式：

```json
{
  "model": "模型名称",
  "messages": [
    {
      "role": "system",
      "content": "系统提示词"
    },
    {
      "role": "user",
      "content": "用户问题"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

支持的 API 提供商包括：
- OpenAI API
- Azure OpenAI
- 其他兼容 OpenAI 格式的 API

## 注意事项

- API 密钥仅保存在浏览器本地存储中，不会上传到任何服务器
- 请妥善保管你的 API 密钥
- 使用前请确保已正确配置 API 地址和密钥
- 插件需要网络连接才能正常工作

## 开发说明

### 换行符规范

所有代码文件统一使用 `\n` 换行符（LF），不使用 `\r\n`（CRLF）。

### 最小可用原则

本项目遵循 YAGNI（You Aren't Gonna Need It）和 KISS（Keep It Simple, Stupid）原则，仅实现当前所需的最少功能。

## 许可证

MIT License

## 版本历史

### v1.0.0
- 初始版本发布
- 支持基本的 AI 答题功能
- 支持文本选择和右键菜单
- 支持自定义 API 配置
