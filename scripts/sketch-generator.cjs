/**
 * Sketch JSON Generator
 * 生成符合 Sketch 43+ JSON Schema 的图层结构
 * 优化版 - 兼容 Figma 导入，接近 Figma 导出的 Sketch 格式
 */

const path = require('path');

// Sketch 基础常量
const SKETCH_VERSION = "74.1";
const SKETCH_BUILD = 128920;

// 响应式约束值 (整数)
const RESIZING_CONSTRAINTS = {
  NONE: 63,
  FIXED_SIZE: 15,
  FIXED_WIDTH: 47,
  FIXED_HEIGHT: 31,
  PIN_TO_ALL: 30
};



/**
 * 中文字体映射 - 用于 style.textStyle
 * 当文本包含中文时，style.textStyle 使用中文字体确保正确显示
 */
const CHINESE_FONT_MAP = {
  'Roboto-Bold': 'PingFangSC-Regular',
  'Roboto-Regular': 'PingFangSC-Regular',
  'Roboto-Medium': 'PingFangSC-Regular',
  'Roboto-Light': 'PingFangSC-Regular'
};

/**
 * 生成 Sketch 兼容的 UUID
 */
function generateUUID() {
  const hex = '0123456789ABCDEF';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8];
    } else {
      uuid += hex[(Math.random() * 16) | 0];
    }
  }
  return uuid.toUpperCase();
}

/**
 * 创建基础图层框架
 * 符合 abstract-layer.schema.yaml
 */
function createLayerBase(classType, frame, options = {}) {
  return {
    _class: classType,
    do_objectID: generateUUID(),
    frame: {
      _class: "rect",
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      constrainProportions: options.constrainProportions || false
    },
    resizingConstraint: RESIZING_CONSTRAINTS.NONE,
    resizingType: 0,
    rotation: 0,
    shouldBreakMaskChain: false,
    booleanOperation: -1,
    exportOptions: {
      _class: "exportOptions",
      exportFormats: [],
      includedLayerIds: [],
      layerOptions: 0,
      shouldTrim: false
    },
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    isTemplate: false,
    layerListExpandedType: 0,
    nameIsFixed: false
  };
}

/**
 * 创建矩形 - 符合 Sketch 格式
 * 使用 4 个基础角点，保留圆角逻辑
 */
function createRectangle(frame, style = {}, name = "Rectangle") {
  const cornerRadius = style.cornerRadius || 0;
  const layer = createLayerBase("rectangle", frame, { constrainProportions: style.constrainProportions || false });
  layer.name = name;
  layer.edited = false;
  layer.isClosed = true;
  layer.pointRadiusBehaviour = 1;
  layer.hasClippingMask = false;
  layer.clippingMaskMode = 0;
  layer.fixedRadius = cornerRadius;
  layer.hasConvertedToNewRoundCorners = true;
  layer.needsConvertionToNewRoundCorners = false;

  // 使用 4 个基础角点（符合 Sketch 验证）
  layer.points = [
    { _class: "curvePoint", cornerRadius: cornerRadius, curveFrom: "{0, 0}", curveMode: 1, curveTo: "{0, 0}", hasCurveFrom: false, hasCurveTo: false, point: "{0, 0}" },
    { _class: "curvePoint", cornerRadius: cornerRadius, curveFrom: "{1, 0}", curveMode: 1, curveTo: "{1, 0}", hasCurveFrom: false, hasCurveTo: false, point: "{1, 0}" },
    { _class: "curvePoint", cornerRadius: cornerRadius, curveFrom: "{1, 1}", curveMode: 1, curveTo: "{1, 1}", hasCurveFrom: false, hasCurveTo: false, point: "{1, 1}" },
    { _class: "curvePoint", cornerRadius: cornerRadius, curveFrom: "{0, 1}", curveMode: 1, curveTo: "{0, 1}", hasCurveFrom: false, hasCurveTo: false, point: "{0, 1}" }
  ];

  layer.style = createStyle(style);
  return layer;
}

/**
 * 创建文本图层 - 符合 Figma 导出的格式
 * 重要：同时生成 attributedString 和 style.textStyle，确保平台兼容
 */
function createText(text, frame, style = {}) {
  const layer = createLayerBase("text", frame);
  layer.name = text.substring(0, 30) || "Text";

  const color = style.color ? parseColor(style.color) : { _class: "color", red: 0, green: 0, blue: 0, alpha: 1 };
  const fontSize = style.fontSize || 16;
  const fontFamily = style.fontFamily || "Roboto-Regular";

  const alignment = style.alignment === "center" ? 2 : style.alignment === "right" ? 1 : 0;

  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);

  // 获取用于显示的字体（style.textStyle 用）
  let displayFontFamily = fontFamily;
  let displayFontSize = fontSize;
  if (hasChinese) {
    displayFontFamily = CHINESE_FONT_MAP[fontFamily] || 'PingFangSC-Regular';
    displayFontSize = Math.round(fontSize * 1.2); // 中文字体稍大
  }

  layer.attributedString = {
    _class: "attributedString",
    string: text,
    attributes: [
      {
        _class: "stringAttribute",
        location: 0,
        length: text.length,
        attributes: {
          MSAttributedStringFontAttribute: {
            _class: "fontDescriptor",
            attributes: {
              name: fontFamily,
              size: fontSize
            }
          },
          kerning: 0.0,
          MSAttributedStringColorAttribute: color,
          paragraphStyle: {
            _class: "paragraphStyle",
            alignment: alignment,
            maximumLineHeight: fontSize * 1.2,
            minimumLineHeight: fontSize * 1.2,
            paragraphSpacing: 0,
            lineHeightMultiple: 1.2,
            allowsDefaultTighteningForTruncation: 0
          },
          textStyleVerticalAlignmentKey: 2,
          MSAttributedStringTextTransformAttribute: 0,
          underlineStyle: 0,
          strikethroughStyle: 0
        }
      }
    ]
  };

  layer.textBehaviour = 0;
  layer.glyphBounds = "";
  layer.lineSpacingBehaviour = 1;
  layer.automaticallyDrawOnUnderlyingPath = false;
  layer.dontSynchroniseWithSymbol = true;

  // 创建 style，包含 textStyle（平台兼容关键！）
  // style.textStyle.encodeAttributes 会被平台优先读取
  const verticalAlignment = alignment === 2 ? 0 : 0; // 0 = center for verticalAlignment

  const styleOptions = {
    fills: [],
    color: color,
    fontSize: fontSize,
    fontFamily: displayFontFamily,
    displayFontSize: displayFontSize,
    alignment: alignment,
    verticalAlignment: verticalAlignment
  };

  layer.style = createStyle(styleOptions);

  return layer;
}

/**
 * 创建样式对象 - 符合 Figma 导出的格式
 * 支持 textStyle，用于平台兼容
 */
function createStyle(options = {}) {
  const style = {
    _class: "style",
    do_objectID: generateUUID(),
    blur: {
      _class: "blur",
      isEnabled: false,
      center: "{0.500000, 0.500000}",
      saturation: 1.0,
      type: 0,
      motionAngle: 0.0,
      radius: 10.0
    },
    borders: [],
    fills: [],
    shadows: [],
    innerShadows: [],
    contextSettings: { _class: "graphicsContextSettings", blendMode: 0, opacity: 1.0 },
    startMarkerType: 0,
    endMarkerType: 0,
    miterLimit: 10,
    windingRule: 1,
    colorControls: {
      _class: "colorControls",
      isEnabled: false,
      brightness: 0.0,
      contrast: 1.0,
      hue: 0.0,
      saturation: 1.0
    },
    borderOptions: {
      _class: "borderOptions",
      isEnabled: true,
      lineCapStyle: 0,
      lineJoinStyle: 0,
      dashPattern: []
    }
  };

  if (options.fills && options.fills.length > 0) {
    style.fills = options.fills.map(color => ({
      _class: "fill",
      isEnabled: true,
      color: parseColor(color),
      fillType: 0,
      noiseIndex: 0,
      noiseIntensity: 0,
      patternFillType: 1,
      patternTileScale: 1.0,
      gradient: {
        _class: "gradient",
        elipseLength: 0.0,
        from: "{0.500000, 0.000000}",
        to: "{0.500000, 1.000000}",
        gradientType: 0,
        stops: []
      },
      contextSettings: { _class: "graphicsContextSettings", blendMode: 0, opacity: 1.0 }
    }));
  }

  if (options.borderColor) {
    style.borders = [{
      _class: "border",
      isEnabled: true,
      color: parseColor(options.borderColor),
      fillType: 0,
      position: options.borderPosition || 1,
      thickness: options.borderWidth || 1.0,
      contextSettings: { _class: "graphicsContextSettings", blendMode: 0, opacity: 1.0 }
    }];
  }

  if (options.shadow) {
    style.shadows = [{
      _class: "shadow",
      color: { _class: "color", red: 0, green: 0, blue: 0, alpha: 0.15 },
      offsetX: 0,
      offsetY: options.shadow.offsetY || 4,
      blurRadius: options.shadow.blur || 12,
      spread: 0
    }];
  }

  // 添加 textStyle（平台兼容关键！）
  // 平台优先读取 layer.style.textStyle.encodeAttributes
  if (options.fontFamily || options.displayFontSize || options.color) {
    const fontSize = options.displayFontSize || options.fontSize || 16;
    const fontFamily = options.fontFamily || 'Roboto-Regular';
    const alignment = options.alignment || 0;
    const verticalAlignment = options.verticalAlignment !== undefined ? options.verticalAlignment : 0;
    const textColor = options.color || { _class: "color", alpha: 1, red: 0, green: 0, blue: 0 };

    style.textStyle = {
      _class: "textStyle",
      verticalAlignment: verticalAlignment,
      encodeAttributes: {
        MSAttributedStringFontAttribute: {
          _class: "fontDescriptor",
          attributes: {
            name: fontFamily,
            size: fontSize
          }
        },
        paragraphStyle: {
          _class: "paragraphStyle",
          alignment: alignment,
          maximumLineHeight: fontSize * 1.2,
          minimumLineHeight: fontSize * 1.2,
          paragraphSpacing: 0
        },
        textStyleVerticalAlignmentKey: verticalAlignment,
        MSAttributedStringColorAttribute: textColor
      }
    };
  }

  return style;
}

/**
 * 创建背景矩形 - Figma 导出格式
 */
function createBackgroundRect(frame, backgroundColor) {
  const layer = createLayerBase("rectangle", frame);
  layer.name = "background";
  layer.edited = false;
  layer.isClosed = true;
  layer.pointRadiusBehaviour = 1;
  layer.hasClippingMask = true;
  layer.clippingMaskMode = 0;
  layer.fixedRadius = 0;
  layer.hasConvertedToNewRoundCorners = true;
  layer.needsConvertionToNewRoundCorners = false;

  layer.points = [
    { _class: "curvePoint", cornerRadius: 0, curveFrom: "{0, 0}", curveMode: 1, curveTo: "{0, 0}", hasCurveFrom: false, hasCurveTo: false, point: "{0, 0}" },
    { _class: "curvePoint", cornerRadius: 0, curveFrom: "{1, 0}", curveMode: 1, curveTo: "{1, 0}", hasCurveFrom: false, hasCurveTo: false, point: "{1, 0}" },
    { _class: "curvePoint", cornerRadius: 0, curveFrom: "{1, 1}", curveMode: 1, curveTo: "{1, 1}", hasCurveFrom: false, hasCurveTo: false, point: "{1, 1}" },
    { _class: "curvePoint", cornerRadius: 0, curveFrom: "{0, 1}", curveMode: 1, curveTo: "{0, 1}", hasCurveFrom: false, hasCurveTo: false, point: "{0, 1}" }
  ];

  layer.style = createStyle({ fills: [backgroundColor] });
  return layer;
}

/**
 * 创建 Artboard - 符合 Figma 导出的格式
 */
function createArtboard(name, width, height, backgroundColor) {
  const layer = createLayerBase("artboard", { x: 0, y: 0, width, height });
  layer.name = name;
  layer.hasClickThrough = true;
  layer.groupLayout = {
    _class: "MSImmutableFreeformGroupLayout"
  };

  layer.hasBackgroundColor = false;
  layer.backgroundColor = parseColor(backgroundColor);
  layer.horizontalRulerData = { _class: "rulerData", base: 0, guides: [] };
  layer.verticalRulerData = { _class: "rulerData", base: 0, guides: [] };

  // 添加背景矩形层
  layer.layers = [createBackgroundRect({ x: 0, y: 0, width, height }, backgroundColor)];

  layer.includeBackgroundColorInExport = false;
  layer.includeInCloudUpload = true;
  layer.isFlowHome = false;
  layer.resizesContent = false;

  return layer;
}

/**
 * 创建 Page - 符合 Figma 导出的格式
 */
function createPage(name, layers = []) {
  return {
    _class: "page",
    do_objectID: generateUUID(),
    name: name,
    hasClickThrough: true,
    groupLayout: {
      _class: "MSImmutableFreeformGroupLayout"
    },
    horizontalRulerData: { _class: "rulerData", base: 0, guides: [] },
    verticalRulerData: { _class: "rulerData", base: 0, guides: [] },
    layers: layers,
    resizingConstraint: 63,
    resizingType: 0,
    rotation: 0,
    shouldBreakMaskChain: false,
    exportOptions: {
      _class: "exportOptions",
      exportFormats: [],
      includedLayerIds: [],
      layerOptions: 0,
      shouldTrim: false
    },
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: 0,
    nameIsFixed: false
  };
}

/**
 * 解析颜色字符串为 Sketch 颜色对象
 */
function parseColor(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') {
    return { _class: "color", alpha: 1.0, red: 0, green: 0, blue: 0 };
  }

  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return { _class: "color", alpha: 1.0, red: r || 0, green: g || 0, blue: b || 0 };
  }

  return { _class: "color", alpha: 1.0, red: 0, green: 0, blue: 0 };
}

/**
 * 生成完整 Sketch 文档 - 符合 Figma 导出的格式
 */
function generateSketchDocument(pages) {
  return {
    _class: "document",
    do_objectID: generateUUID(),
    appVersion: SKETCH_VERSION,
    build: SKETCH_BUILD,
    currentPageIndex: 0,
    colorSpace: 1,
    assets: {
      _class: "assetCollection",
      do_objectID: generateUUID(),
      colorAssets: [],
      gradientAssets: [],
      images: [],
      colors: [],
      gradients: []
    },
    foreignLayerStyles: [],
    foreignSymbols: [],
    foreignTextStyles: [],
    foreignSwatches: [],
    layerStyles: {
      _class: "sharedStyleContainer",
      do_objectID: generateUUID(),
      objects: []
    },
    layerSymbols: {
      _class: "symbolContainer",
      do_objectID: generateUUID(),
      objects: []
    },
    layerTextStyles: {
      _class: "sharedTextStyleContainer",
      do_objectID: generateUUID(),
      objects: []
    },
    sharedSwatches: {
      _class: "swatchContainer",
      do_objectID: generateUUID(),
      objects: []
    },
    fontReferences: [],
    documentState: { _class: "documentState" },
    pages: pages
  };
}

module.exports = {
  generateUUID,
  createRectangle,
  createText,
  createArtboard,
  createPage,
  generateSketchDocument,
  parseColor,
  createStyle,
  RESIZING_CONSTRAINTS
};
