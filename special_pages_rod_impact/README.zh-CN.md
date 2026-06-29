# LS-PrePost 圆柱杆冲击钢板特供版

这个文件夹用于发布 GitHub Pages 静态演示页，并提供完整本地运行包下载。

## 页面内容

`site/` 是可以上传到 GitHub Pages 的静态站点。首页展示 `rod_impact_plate` 场景：实心圆柱杆以初始速度冲击固定钢板。

GitHub Pages 只能展示 HTML、CSS、JavaScript 和下载文件，不能运行 Python，不能启动 MCP Server，也不能调用本机 LS-PrePost。

## 完整功能

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

把整个 `special_pages_rod_impact/` 目录作为 GitHub Pages 上的特供版本目录上传，并访问：

```text
special_pages_rod_impact/site/index.html
```

为了让下载按钮可用，发布时需要同时保留相对路径：

```text
downloads/lsprepost-mcp-special-rod-impact.zip
```

从 `site/index.html` 页面点击下载时，链接会指向：

```text
../downloads/lsprepost-mcp-special-rod-impact.zip
```

如果 GitHub Pages 只允许选择一个发布目录，可以把 `site/index.html`、`site/styles.css` 和 `downloads/` 一起复制到实际 Pages 根目录，并把页面里的下载链接改成 `downloads/lsprepost-mcp-special-rod-impact.zip`。

## 本地校验

在项目根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\special_pages_rod_impact\verify_special_pages.ps1
```

看到 `Special Pages verification passed.` 表示静态页、README 和下载包路径一致。
