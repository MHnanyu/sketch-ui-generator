---
name: sketch-ui-generator
description: 根据自然语言UI需求生成Sketch文件(.sketch)。用于用户请求生成Sketch设计文件、UI原型、Sketch文件导出，或任何涉及.sketch文件生成的任务。
---

# Sketch UI 生成器

根据自然语言描述的UI需求生成Sketch文件(.sketch)。

## 快速开始

### 1. 读取设计规范 (重要!)

**在生成Sketch文件前，必须先读取 ux-spec skill 获取最新的设计规范:**

ux-spec 是企业级UX设计规范，提供完整的设计系统支持，包括：
- **样式主题 (Design Tokens)**: 颜色、字体、间距、圆角、阴影、透明度等
- **设计组件**: 按钮、输入框、卡片、表格等组件规范
- **设计模板**: 常用页面模板
- **设计模式**: 布局模式、交互模式等

> 完整设计规范请查阅 [ux-spec skill](../ux-spec/SKILL.md)

### 2. 解析需求

分析用户输入，提取：
- **页面类型**: App首页、落地页、仪表盘、详情页、表单页等
- **核心模块**: Header, Hero, Features, Table, Form, Footer 等
- **风格**: 深色/浅色、配色方案、圆角风格
- **目标平台**: iPhone (393x852), Web (1440x900), iPad (1024x768)

### 3. 生成配置

```javascript
const config = {
  pageName: "页面名称",
  artboardSize: { width: 393, height: 852 },  // 默认iPhone
  theme: "light",  // light/dark
  colors: {
    primary: "#0067D1",        // 品牌主色 (来自 ux-spec)
    primaryHover: "#0057B4",   // 主色悬停
    success: "#00A870",        // 成功状态
    warning: "#FF8800",        // 警告状态
    error: "#F53F3F",          // 错误状态
    textMain: "#1D2129",       // 主要文字
    textSecondary: "#4E5969", // 次要文字
    background: "#FFFFFF",     // 页面背景
    backgroundSecondary: "#F7F8FA", // 卡片背景
    border: "#E5E6EB"         // 边框色
  },
  modules: [
    { type: "header", height: 56, title: "标题" },
    // ... 其他模块
  ]
};
```

### 4. 生成Sketch文件

```javascript
const { exportSketch } = require('./scripts/sketch-api.cjs');

// 正确：使用默认输出目录
const result = await exportSketch(config);
console.log(result.sketchPath);   // sketch-output/xxx.sketch
console.log(result.folderPath);  // sketch-output/xxx/
```

---

## 支持的模块类型

| type | 说明 | 必需字段 |
|------|------|----------|
| `header` | 顶部导航栏 | title |
| `hero` | 主视觉区域 | title, subtitle |
| `features` | 功能列表 | items |
| `productGrid` | 产品网格 | products |
| `bottomNav` | 底部导航栏 | items |
| `collapsePanel` | 折叠面板 | title, fields |
| `dataTable` | 数据表格 | columns, rows |
| `actionButtons` | 操作按钮组 | buttons |

---

## 模块配置示例

### loginForm (登录表单)
```javascript
{
  type: "loginForm",
  height: 440,
  title: "登录",
  buttons: [
    { text: "登录", primary: true },
    { text: "重置", primary: false }
  ]
}
```

### header
```javascript
{ type: "header", height: 56, title: "我的订单" }
```

### hero
```javascript
{ type: "hero", height: 280, title: "精选好物", subtitle: "限时特惠" }
```

### features
```javascript
{ type: "features", items: ["快速配送", "新鲜保证", "最优价格"] }
```

### productGrid
```javascript
{
  type: "productGrid",
  products: [
    { name: "拿铁咖啡", price: "¥25" },
    { name: "美式咖啡", price: "¥20" }
  ]
}
```

### bottomNav
```javascript
{ type: "bottomNav", items: ["首页", "分类", "购物车", "我的"] }
```

### collapsePanel
```javascript
{
  type: "collapsePanel",
  title: "基本信息",
  fields: [
    { label: "运输方式", value: "空运", required: true },
    { label: "备注", value: "这是备注" }
  ]
}
```

### dataTable
```javascript
{
  type: "dataTable",
  columns: [
    { name: "物料编码", width: 120 },
    { name: "物料描述", width: 120 },
    { name: "数量", width: 80 }
  ],
  rows: [
    ["ABC123", "机顶盒", "50"],
    ["DEF456", "路由器", "100"]
  ]
}
```

### actionButtons
```javascript
{
  type: "actionButtons",
  buttons: [
    { text: "提交", primary: true },
    { text: "取消", primary: false }
  ]
}
```

---

## 常用画布尺寸

| 平台 | 尺寸 |
|------|------|
| iPhone | 393x852 |
| Web | 1440x900 |
| iPad | 1024x768 |

---

## 重要约束

### 输出目录
- 必须使用 `exportSketch(config)` 不传第二个参数，使用默认输出目录 `workspace/sketch-output`
- 禁止手动指定其他输出路径

### 输出文件
- 必须同时生成：
  1. `.sketch` 压缩文件（如 `login.sketch`）
  2. 对应的未压缩文件夹（如 `login/`）
- 禁止只生成其中一个

### 返回格式
生成完成后，返回：
```
📁 sketch-output/xxx.sketch (压缩文件)
📁 sketch-output/xxx/ (文件夹)
```