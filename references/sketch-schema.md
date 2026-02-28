# Sketch JSON Schema 参考

## 文件结构

```
xxx.sketch (zip 压缩包)
├── document.json    # 主文档对象
├── meta.json        # 版本和元信息
├── pages/
│   └── xxx.json    # 页面文件
├── user.json       # 用户偏好
└── preferences.json # Sketch 设置
```

## document.json 结构

```json
{
  "_class": "document",
  "do_objectID": "UUID",
  "appVersion": "43.0",
  "assets": {
    "_class": "assetCollection",
    "colors": [],
    "images": []
  },
  "layerStyles": {
    "_class": "layerStyleCollection",
    "objects": []
  },
  "layerTextStyles": {
    "_class": "layerTextStyleCollection", 
    "objects": []
  },
  "pages": [
    { /* page 对象 */ }
  ]
}
```

## page.json 结构

```json
{
  "_class": "page",
  "do_objectID": "UUID",
  "name": "Page 1",
  "layers": [
    { /* artboard 对象 */ }
  ]
}
```

## artboard (画板)

```json
{
  "_class": "artboard",
  "do_objectID": "UUID",
  "name": "Home",
  "frame": {
    "_class": "rect",
    "x": 0,
    "y": 0,
    "width": 393,
    "height": 852
  },
  "hasBackgroundColor": true,
  "backgroundColor": {
    "_class": "color",
    "red": 0.95,
    "green": 0.95,
    "blue": 0.97,
    "alpha": 1
  },
  "layers": [
    { /* 图层数组 */ }
  ]
}
```

## 常用图层类型

### rectangle (矩形)

```json
{
  "_class": "rectangle",
  "do_objectID": "UUID",
  "frame": { "_class": "rect", "x": 0, "y": 0, "width": 100, "height": 44 },
  "style": { "_class": "style", "fills": [...], "borders": [...] }
}
```

### text (文本)

```json
{
  "_class": "text",
  "do_objectID": "UUID",
  "name": "Hello",
  "frame": { "_class": "rect", "x": 16, "y": 16, "width": 200, "height": 24 },
  "attributedString": {
    "_class": "attributedString",
    "string": "Hello World",
    "attributes": [
      {
        "_class": "textStyleAttributes",
        "fontDescriptor": {
          "_class": "fontDescriptor",
          "name": "SF Pro Text",
          "size": 16
        },
        "textColor": {
          "_class": "color",
          "red": 0,
          "green": 0,
          "blue": 0,
          "alpha": 1
        }
      }
    ]
  },
  "textBehaviour": 0
}
```

### shapeGroup (形状组)

```json
{
  "_class": "shapeGroup",
  "do_objectID": "UUID",
  "name": "Button",
  "layers": [ { /* 子图层 */ } ],
  "style": { "_class": "style", ... }
}
```

### group (分组)

```json
{
  "_class": "group",
  "do_objectID": "UUID",
  "name": "Card",
  "layers": [ { /* 子图层 */ } ]
}
```

## style (样式) 详解

```json
{
  "_class": "style",
  "fills": [
    {
      "_class": "fill",
      "color": { "_class": "color", "red": 1, "green": 1, "blue": 1, "alpha": 1 },
      "fillType": 0,
      "isEnabled": true
    }
  ],
  "borders": [
    {
      "_class": "border",
      "color": { "_class": "color", "red": 0, "green": 0, "blue": 0, "alpha": 0.1 },
      "fillType": 0,
      "isEnabled": true,
      "position": 1,
      "thickness": 1
    }
  ],
  "shadows": [
    {
      "_class": "shadow",
      "color": { "_class": "color", "red": 0, "green": 0, "blue": 0, "alpha": 0.15 },
      "offsetX": 0,
      "offsetY": 4,
      "blurRadius": 12,
      "spread": 0
    }
  ]
}
```

## 颜色格式

Sketch 使用 0-1 范围的 RGB 值：

```javascript
// Hex to Sketch Color
function hexToSketch(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  return { _class: "color", red: r, green: g, blue: b, alpha: 1 };
}
```

## resizingConstraint (响应式约束)

| 值 | 含义 |
|---|---|
| 0 | 全部固定 |
| 15 | 固定宽度+高度 |
| 31 | 固定左侧+右侧 (宽度自适应) |
| 63 | 全部自由 |

## 字体名称

- macOS: SF Pro Display, SF Pro Text, SF Mono
- Windows: Segoe UI, Segoe UI Semibold, Segoe UI Light, Consolas
