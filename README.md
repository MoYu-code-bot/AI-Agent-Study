# AI大模型应用开发学习平台

一个纯 HTML、CSS、JavaScript 实现的可搜索课程阅读网站。课程正文由 `course.json` 动态加载，学习进度和主题偏好保存在浏览器 `localStorage`。当前课程按照《AI大模型应用开发学习路线》整理为 8 章、34 节，每节包含正文、小结、练习题和实战任务。

## 如何运行

浏览器出于安全策略通常不允许直接从本地文件读取 JSON，请在项目目录启动静态服务器：

```powershell
cd "C:\Users\123\Documents\Codex\2026-08-05\product-design-plugin-product-design-openai-2\outputs\ai-learning-platform"
python -m http.server 8000
```

然后访问 `http://localhost:8000`。代码高亮和图标字体通过 CDN 加载，首次使用需要联网。

## 如何添加章节

在 `course.json` 顶层数组中增加一个章节对象：

```json
{
  "chapter": "阶段六：部署与运维",
  "sections": [
    {
      "id": "deployment",
      "title": "应用部署基础",
      "content": "# 应用部署基础\n这里填写 Markdown 内容。",
      "summary": ["小结一", "小结二"],
      "quiz": [{"question": "问题？", "options": ["A. 选项", "B. 选项"]}],
      "practice": {"title": "实战标题", "description": "任务说明"}
    }
  ]
}
```

每个 `id` 必须唯一，否则学习进度会互相覆盖。`content` 支持标题、段落、无序列表、表格、行内代码和围栏代码块。

## 如何扩展

- 修改 `style.css` 中的颜色变量可以更换视觉主题。
- 在 `app.js` 的 `markdown()` 中扩展需要的 Markdown 语法。
- 为 `course.json` 增加字段后，可在 `extras()` 中渲染新的学习模块。
- 若课程内容持续增大，可按章节拆分 JSON，并在加载时按需请求。

## 数据与隐私

学习进度只保存在当前浏览器，不会上传服务器。清除浏览器站点数据会同时清除学习记录。
