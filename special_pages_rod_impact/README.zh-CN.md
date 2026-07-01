# lsprepost-mcp 特供建模工作台

这个文件夹用于发布 GitHub Pages 静态版工作台。页面融合本地 Web App 的工作台布局，默认展示 `rod_impact_plate` 场景，并在右侧提供阿里千问对话智能体。

## 页面内容

```text
site/index.html
site/styles.css
site/agent.js
```

页面包含：

- 左侧：LS-PrePost 状态、`rod_impact_plate` 场景参数、完整本地版下载入口。
- 中间：圆柱杆冲击固定钢板的静态视窗展示。
- 右侧：千问建模智能体，默认模型为 `qwen-plus`。

## 千问 API Key

用户需要在页面右侧输入自己的阿里千问 API Key。API Key 只保存在当前浏览器会话的 `sessionStorage` 中，不应写入代码，也不应提交到 GitHub。

页面会从浏览器直接请求：

```text
https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

如果浏览器或阿里云接口策略拦截跨域请求，静态 GitHub Pages 页面无法自行解决，需要改用本地版或配置自己的代理服务。

## 完整功能

GitHub Pages 只能托管静态 HTML、CSS、JavaScript 和下载文件。它不能运行 Python，不能启动 MCP Server，不能写入 workspace，也不能调用本机 LS-PrePost。

完整功能在下载包中运行：

```text
downloads/lsprepost-mcp-special-rod-impact.zip
```

用户下载并解压后，在 Windows 上双击：

```text
start_web_app.cmd
```

然后按页面提示设置本机 `lsprepost*.exe` 路径。模型生成、静态校验、workspace 文件写入、MCP 工具和 LS-PrePost 预览都在用户本机完成。

## 发布方式

把整个 `special_pages_rod_impact/` 目录上传到 GitHub Pages 仓库根目录，并访问：

```text
special_pages_rod_impact/site/index.html
```

下载按钮使用相对路径：

```text
../downloads/lsprepost-mcp-special-rod-impact.zip
```

所以发布时必须保留：

```text
special_pages_rod_impact/downloads/lsprepost-mcp-special-rod-impact.zip
```

## 本地校验

在项目根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\special_pages_rod_impact\verify_special_pages.ps1
```

看到 `Special workbench verification passed.` 表示静态工作台、智能体脚本、README 和下载包路径一致。
