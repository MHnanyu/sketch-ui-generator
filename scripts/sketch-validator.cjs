/**
 * Sketch Schema Validator
 * 基于 sketch-document-main 的 schema 验证生成的 JSON 文件
 */

const fs = require('fs');
const path = require('path');

// Schema 路径（相对于 skill 目录）
const SCHEMA_DIR = path.join(__dirname, '..', 'schema');

/**
 * 验证 UUID 格式
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 验证颜色对象
 */
function validateColor(color, path = 'color') {
  const errors = [];
  if (!color || typeof color !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (color._class !== 'color') {
    errors.push(`${path}._class must be "color"`);
  }
  ['red', 'green', 'blue', 'alpha'].forEach(prop => {
    if (typeof color[prop] !== 'number' || color[prop] < 0 || color[prop] > 1) {
      errors.push(`${path}.${prop} must be a number between 0 and 1`);
    }
  });
  return errors;
}

/**
 * 验证 rect 对象
 */
function validateRect(rect, path = 'rect') {
  const errors = [];
  if (!rect || typeof rect !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (rect._class !== 'rect') {
    errors.push(`${path}._class must be "rect"`);
  }
  ['x', 'y', 'width', 'height'].forEach(prop => {
    if (typeof rect[prop] !== 'number') {
      errors.push(`${path}.${prop} must be a number`);
    }
  });
  return errors;
}

/**
 * 验证 rulerData 对象
 */
function validateRulerData(data, path = 'rulerData') {
  const errors = [];
  if (!data || typeof data !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (data._class !== 'rulerData') {
    errors.push(`${path}._class must be "rulerData"`);
  }
  if (typeof data.base !== 'number') {
    errors.push(`${path}.base must be a number`);
  }
  if (!Array.isArray(data.guides)) {
    errors.push(`${path}.guides must be an array`);
  }
  return errors;
}

/**
 * 验证 exportOptions 对象
 */
function validateExportOptions(options, path = 'exportOptions') {
  const errors = [];
  if (!options || typeof options !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (options._class !== 'exportOptions') {
    errors.push(`${path}._class must be "exportOptions"`);
  }
  if (!Array.isArray(options.exportFormats)) {
    errors.push(`${path}.exportFormats must be an array`);
  }
  if (!Array.isArray(options.includedLayerIds)) {
    errors.push(`${path}.includedLayerIds must be an array`);
  }
  if (typeof options.layerOptions !== 'number') {
    errors.push(`${path}.layerOptions must be a number`);
  }
  if (typeof options.shouldTrim !== 'boolean') {
    errors.push(`${path}.shouldTrim must be a boolean`);
  }
  return errors;
}

/**
 * 验证 curvePoint 对象
 */
function validateCurvePoint(point, path = 'curvePoint') {
  const errors = [];
  if (!point || typeof point !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (point._class !== 'curvePoint') {
    errors.push(`${path}._class must be "curvePoint"`);
  }
  if (typeof point.cornerRadius !== 'number') {
    errors.push(`${path}.cornerRadius must be a number`);
  }
  if (typeof point.curveMode !== 'number') {
    errors.push(`${path}.curveMode must be a number`);
  }
  if (typeof point.hasCurveFrom !== 'boolean') {
    errors.push(`${path}.hasCurveFrom must be a boolean`);
  }
  if (typeof point.hasCurveTo !== 'boolean') {
    errors.push(`${path}.hasCurveTo must be a boolean`);
  }
  // point, curveFrom, curveTo 应该是字符串格式 "{x, y}"
  const pointPattern = /^\{-?\d+(\.\d+)?, -?\d+(\.\d+)?\}$/;
  ['point', 'curveFrom', 'curveTo'].forEach(prop => {
    if (typeof point[prop] !== 'string' || !pointPattern.test(point[prop])) {
      errors.push(`${path}.${prop} must be a point string like "{0, 0}"`);
    }
  });
  return errors;
}

/**
 * 验证 fill 对象
 */
function validateFill(fill, path = 'fill') {
  const errors = [];
  if (!fill || typeof fill !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (fill._class !== 'fill') {
    errors.push(`${path}._class must be "fill"`);
  }
  if (typeof fill.fillType !== 'number') {
    errors.push(`${path}.fillType must be a number`);
  }
  if (typeof fill.isEnabled !== 'boolean') {
    errors.push(`${path}.isEnabled must be a boolean`);
  }
  if (fill.color) {
    errors.push(...validateColor(fill.color, `${path}.color`));
  }
  return errors;
}

/**
 * 验证 style 对象
 */
function validateStyle(style, path = 'style') {
  const errors = [];
  if (!style || typeof style !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (style._class !== 'style') {
    errors.push(`${path}._class must be "style"`);
  }
  if (style.do_objectID && !isValidUUID(style.do_objectID)) {
    errors.push(`${path}.do_objectID must be a valid UUID`);
  }
  if (!Array.isArray(style.fills)) {
    errors.push(`${path}.fills must be an array`);
  } else {
    style.fills.forEach((fill, i) => {
      errors.push(...validateFill(fill, `${path}.fills[${i}]`));
    });
  }
  if (!Array.isArray(style.borders)) {
    errors.push(`${path}.borders must be an array`);
  }
  if (!Array.isArray(style.shadows)) {
    errors.push(`${path}.shadows must be an array`);
  }
  if (!Array.isArray(style.innerShadows)) {
    errors.push(`${path}.innerShadows must be an array`);
  }
  return errors;
}

/**
 * 验证 rectangle 图层
 */
function validateRectangle(rect, path = 'rectangle') {
  const errors = [];
  if (!rect || typeof rect !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (rect._class !== 'rectangle') {
    errors.push(`${path}._class must be "rectangle"`);
  }
  if (!isValidUUID(rect.do_objectID)) {
    errors.push(`${path}.do_objectID must be a valid UUID`);
  }
  if (typeof rect.name !== 'string') {
    errors.push(`${path}.name must be a string`);
  }
  errors.push(...validateRect(rect.frame, `${path}.frame`));
  if (typeof rect.resizingConstraint !== 'number') {
    errors.push(`${path}.resizingConstraint must be a number`);
  }
  if (typeof rect.booleanOperation !== 'number') {
    errors.push(`${path}.booleanOperation must be a number`);
  }
  errors.push(...validateExportOptions(rect.exportOptions, `${path}.exportOptions`));
  if (typeof rect.isVisible !== 'boolean') {
    errors.push(`${path}.isVisible must be a boolean`);
  }
  if (typeof rect.isLocked !== 'boolean') {
    errors.push(`${path}.isLocked must be a boolean`);
  }
  if (typeof rect.edited !== 'boolean') {
    errors.push(`${path}.edited must be a boolean`);
  }
  if (typeof rect.isClosed !== 'boolean') {
    errors.push(`${path}.isClosed must be a boolean`);
  }
  if (typeof rect.pointRadiusBehaviour !== 'number') {
    errors.push(`${path}.pointRadiusBehaviour must be a number`);
  }
  if (typeof rect.fixedRadius !== 'number') {
    errors.push(`${path}.fixedRadius must be a number`);
  }
  if (!Array.isArray(rect.points)) {
    errors.push(`${path}.points must be an array`);
  } else if (rect.points.length !== 4) {
    errors.push(`${path}.points must have exactly 4 points`);
  } else {
    rect.points.forEach((point, i) => {
      errors.push(...validateCurvePoint(point, `${path}.points[${i}]`));
    });
  }
  if (rect.style) {
    errors.push(...validateStyle(rect.style, `${path}.style`));
  }
  return errors;
}

/**
 * 验证 text 图层
 */
function validateText(text, path = 'text') {
  const errors = [];
  if (!text || typeof text !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (text._class !== 'text') {
    errors.push(`${path}._class must be "text"`);
  }
  if (!isValidUUID(text.do_objectID)) {
    errors.push(`${path}.do_objectID must be a valid UUID`);
  }
  if (typeof text.name !== 'string') {
    errors.push(`${path}.name must be a string`);
  }
  errors.push(...validateRect(text.frame, `${path}.frame`));
  if (typeof text.resizingConstraint !== 'number') {
    errors.push(`${path}.resizingConstraint must be a number`);
  }
  if (typeof text.booleanOperation !== 'number') {
    errors.push(`${path}.booleanOperation must be a number`);
  }
  errors.push(...validateExportOptions(text.exportOptions, `${path}.exportOptions`));
  if (typeof text.isVisible !== 'boolean') {
    errors.push(`${path}.isVisible must be a boolean`);
  }
  
  // 验证 attributedString
  if (!text.attributedString || typeof text.attributedString !== 'object') {
    errors.push(`${path}.attributedString must be an object`);
  } else {
    if (text.attributedString._class !== 'attributedString') {
      errors.push(`${path}.attributedString._class must be "attributedString"`);
    }
    if (typeof text.attributedString.string !== 'string') {
      errors.push(`${path}.attributedString.string must be a string`);
    }
    if (!Array.isArray(text.attributedString.attributes)) {
      errors.push(`${path}.attributedString.attributes must be an array`);
    } else {
      text.attributedString.attributes.forEach((attr, i) => {
        if (attr._class !== 'stringAttribute') {
          errors.push(`${path}.attributedString.attributes[${i}]._class must be "stringAttribute"`);
        }
        if (typeof attr.location !== 'number') {
          errors.push(`${path}.attributedString.attributes[${i}].location must be a number`);
        }
        if (typeof attr.length !== 'number') {
          errors.push(`${path}.attributedString.attributes[${i}].length must be a number`);
        }
        // 验证 fontDescriptor 结构
        if (attr.attributes?.MSAttributedStringFontAttribute) {
          const fontDesc = attr.attributes.MSAttributedStringFontAttribute;
          if (fontDesc._class !== 'fontDescriptor') {
            errors.push(`${path}.attributedString.attributes[${i}].MSAttributedStringFontAttribute._class must be "fontDescriptor"`);
          }
          // Figma 兼容性：检查 fontDescriptor 是否有 attributes 包装
          if (!fontDesc.attributes || typeof fontDesc.attributes !== 'object') {
            errors.push(`${path}.attributedString.attributes[${i}].MSAttributedStringFontAttribute.attributes is required (Figma compatibility)`);
          } else {
            if (typeof fontDesc.attributes.name !== 'string') {
              errors.push(`${path}.attributedString.attributes[${i}].MSAttributedStringFontAttribute.attributes.name must be a string`);
            }
            if (typeof fontDesc.attributes.size !== 'number') {
              errors.push(`${path}.attributedString.attributes[${i}].MSAttributedStringFontAttribute.attributes.size must be a number`);
            }
          }
        }
      });
    }
  }
  
  if (text.style) {
    errors.push(...validateStyle(text.style, `${path}.style`));
  }
  return errors;
}

/**
 * 验证 artboard 图层
 */
function validateArtboard(artboard, path = 'artboard') {
  const errors = [];
  if (!artboard || typeof artboard !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (artboard._class !== 'artboard') {
    errors.push(`${path}._class must be "artboard"`);
  }
  if (!isValidUUID(artboard.do_objectID)) {
    errors.push(`${path}.do_objectID must be a valid UUID`);
  }
  if (typeof artboard.name !== 'string') {
    errors.push(`${path}.name must be a string`);
  }
  
  // Figma 兼容性：检查 groupLayout
  if (!artboard.groupLayout || typeof artboard.groupLayout !== 'object') {
    errors.push(`${path}.groupLayout is required for Figma compatibility`);
  } else if (artboard.groupLayout._class !== 'MSImmutableFreeformGroupLayout') {
    errors.push(`${path}.groupLayout._class must be "MSImmutableFreeformGroupLayout"`);
  }
  
  errors.push(...validateRect(artboard.frame, `${path}.frame`));
  if (typeof artboard.resizingConstraint !== 'number') {
    errors.push(`${path}.resizingConstraint must be a number`);
  }
  if (typeof artboard.booleanOperation !== 'number') {
    errors.push(`${path}.booleanOperation must be a number`);
  }
  errors.push(...validateExportOptions(artboard.exportOptions, `${path}.exportOptions`));
  if (typeof artboard.isVisible !== 'boolean') {
    errors.push(`${path}.isVisible must be a boolean`);
  }
  if (typeof artboard.hasBackgroundColor !== 'boolean') {
    errors.push(`${path}.hasBackgroundColor must be a boolean`);
  }
  if (artboard.backgroundColor) {
    errors.push(...validateColor(artboard.backgroundColor, `${path}.backgroundColor`));
  }
  errors.push(...validateRulerData(artboard.horizontalRulerData, `${path}.horizontalRulerData`));
  errors.push(...validateRulerData(artboard.verticalRulerData, `${path}.verticalRulerData`));
  if (typeof artboard.hasClickThrough !== 'boolean') {
    errors.push(`${path}.hasClickThrough must be a boolean`);
  }
  if (!Array.isArray(artboard.layers)) {
    errors.push(`${path}.layers must be an array`);
  } else {
    artboard.layers.forEach((layer, i) => {
      if (layer._class === 'rectangle') {
        errors.push(...validateRectangle(layer, `${path}.layers[${i}]`));
      } else if (layer._class === 'text') {
        errors.push(...validateText(layer, `${path}.layers[${i}]`));
      }
      // TODO: 添加其他图层类型的验证
    });
  }
  return errors;
}

/**
 * 验证 page 文件
 */
function validatePage(page, path = 'page') {
  const errors = [];
  if (!page || typeof page !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (page._class !== 'page') {
    errors.push(`${path}._class must be "page"`);
  }
  if (!isValidUUID(page.do_objectID)) {
    errors.push(`${path}.do_objectID must be a valid UUID`);
  }
  if (typeof page.name !== 'string') {
    errors.push(`${path}.name must be a string`);
  }
  
  // Figma 兼容性：检查 groupLayout
  if (!page.groupLayout || typeof page.groupLayout !== 'object') {
    errors.push(`${path}.groupLayout is required for Figma compatibility`);
  } else if (page.groupLayout._class !== 'MSImmutableFreeformGroupLayout') {
    errors.push(`${path}.groupLayout._class must be "MSImmutableFreeformGroupLayout"`);
  }
  
  errors.push(...validateRulerData(page.horizontalRulerData, `${path}.horizontalRulerData`));
  errors.push(...validateRulerData(page.verticalRulerData, `${path}.verticalRulerData`));
  if (typeof page.hasClickThrough !== 'boolean') {
    errors.push(`${path}.hasClickThrough must be a boolean`);
  }
  errors.push(...validateExportOptions(page.exportOptions, `${path}.exportOptions`));
  if (!Array.isArray(page.layers)) {
    errors.push(`${path}.layers must be an array`);
  } else {
    page.layers.forEach((layer, i) => {
      if (layer._class === 'artboard') {
        errors.push(...validateArtboard(layer, `${path}.layers[${i}]`));
      }
    });
  }
  return errors;
}

/**
 * 验证 document.json
 */
function validateDocument(doc, path = 'document') {
  const errors = [];
  if (!doc || typeof doc !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (doc._class !== 'document') {
    errors.push(`${path}._class must be "document"`);
  }
  if (!isValidUUID(doc.do_objectID)) {
    errors.push(`${path}.do_objectID must be a valid UUID`);
  }
  if (typeof doc.appVersion !== 'string') {
    errors.push(`${path}.appVersion must be a string`);
  }
  if (typeof doc.build !== 'number') {
    errors.push(`${path}.build must be a number`);
  }
  if (typeof doc.currentPageIndex !== 'number') {
    errors.push(`${path}.currentPageIndex must be a number`);
  }
  if (typeof doc.colorSpace !== 'number') {
    errors.push(`${path}.colorSpace must be a number`);
  }
  if (!Array.isArray(doc.pages)) {
    errors.push(`${path}.pages must be an array`);
  } else {
    doc.pages.forEach((pageRef, i) => {
      if (pageRef._class !== 'MSJSONFileReference') {
        errors.push(`${path}.pages[${i}]._class must be "MSJSONFileReference"`);
      }
      if (pageRef._ref_class !== 'MSImmutablePage') {
        errors.push(`${path}.pages[${i}]._ref_class must be "MSImmutablePage"`);
      }
      if (typeof pageRef._ref !== 'string') {
        errors.push(`${path}.pages[${i}]._ref must be a string`);
      }
    });
  }
  // 验证 assets
  if (!doc.assets || doc.assets._class !== 'assetCollection') {
    errors.push(`${path}.assets must have _class "assetCollection"`);
  }
  // 验证 layerStyles
  if (!doc.layerStyles || doc.layerStyles._class !== 'sharedStyleContainer') {
    errors.push(`${path}.layerStyles must have _class "sharedStyleContainer"`);
  }
  // 验证 layerSymbols
  if (!doc.layerSymbols || doc.layerSymbols._class !== 'symbolContainer') {
    errors.push(`${path}.layerSymbols must have _class "symbolContainer"`);
  }
  // 验证 layerTextStyles
  if (!doc.layerTextStyles || doc.layerTextStyles._class !== 'sharedTextStyleContainer') {
    errors.push(`${path}.layerTextStyles must have _class "sharedTextStyleContainer"`);
  }
  return errors;
}

/**
 * 验证 meta.json
 */
function validateMeta(meta, path = 'meta') {
  const errors = [];
  if (!meta || typeof meta !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (typeof meta.commit !== 'string') {
    errors.push(`${path}.commit must be a string`);
  }
  if (typeof meta.version !== 'number') {
    errors.push(`${path}.version must be a number (121-146)`);
  }
  if (meta.compatibilityVersion !== 99) {
    errors.push(`${path}.compatibilityVersion must be 99`);
  }
  if (typeof meta.app !== 'string') {
    errors.push(`${path}.app must be a string`);
  }
  if (typeof meta.build !== 'number') {
    errors.push(`${path}.build must be a number`);
  }
  if (typeof meta.appVersion !== 'string') {
    errors.push(`${path}.appVersion must be a string`);
  }
  if (typeof meta.autosaved !== 'number') {
    errors.push(`${path}.autosaved must be a number (0 or 1)`);
  }
  if (!meta.pagesAndArtboards || typeof meta.pagesAndArtboards !== 'object') {
    errors.push(`${path}.pagesAndArtboards must be an object`);
  } else {
    Object.entries(meta.pagesAndArtboards).forEach(([pageId, pageData]) => {
      if (!isValidUUID(pageId)) {
        errors.push(`${path}.pagesAndArtboards has invalid UUID key: ${pageId}`);
      }
      if (typeof pageData.name !== 'string') {
        errors.push(`${path}.pagesAndArtboards[${pageId}].name must be a string`);
      }
      if (!pageData.artboards || typeof pageData.artboards !== 'object') {
        errors.push(`${path}.pagesAndArtboards[${pageId}].artboards must be an object`);
      } else {
        Object.entries(pageData.artboards).forEach(([artboardId, artboardData]) => {
          if (!isValidUUID(artboardId)) {
            errors.push(`${path}.pagesAndArtboards[${pageId}].artboards has invalid UUID key: ${artboardId}`);
          }
          if (typeof artboardData.name !== 'string') {
            errors.push(`${path}.pagesAndArtboards[${pageId}].artboards[${artboardId}].name must be a string`);
          }
        });
      }
    });
  }
  return errors;
}

/**
 * 验证 user.json
 */
function validateUser(user, pageIds = [], path = 'user') {
  const errors = [];
  if (!user || typeof user !== 'object') {
    errors.push(`${path} must be an object`);
    return errors;
  }
  if (!user.document || typeof user.document !== 'object') {
    errors.push(`${path}.document must be an object`);
  } else {
    if (typeof user.document.pageListHeight !== 'number') {
      errors.push(`${path}.document.pageListHeight must be a number`);
    }
    if (typeof user.document.pageListCollapsed !== 'number') {
      errors.push(`${path}.document.pageListCollapsed must be a number`);
    }
  }
  // 验证每个 page 的 user 数据
  pageIds.forEach(pageId => {
    if (!user[pageId]) {
      errors.push(`${path} missing data for page ${pageId}`);
    } else {
      if (typeof user[pageId].scrollOrigin !== 'string') {
        errors.push(`${path}[${pageId}].scrollOrigin must be a string`);
      }
      if (typeof user[pageId].zoomValue !== 'number') {
        errors.push(`${path}[${pageId}].zoomValue must be a number`);
      }
    }
  });
  return errors;
}

/**
 * 验证完整的 Sketch 文件夹结构
 * @param {string} sketchDir - 解压后的 sketch 文件夹路径
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validateSketchDirectory(sketchDir) {
  const errors = [];
  
  // 检查必需文件
  const requiredFiles = ['document.json', 'meta.json', 'user.json'];
  for (const file of requiredFiles) {
    const filePath = path.join(sketchDir, file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing required file: ${file}`);
    }
  }
  
  // 检查 pages 目录
  const pagesDir = path.join(sketchDir, 'pages');
  if (!fs.existsSync(pagesDir)) {
    errors.push(`Missing pages directory`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // 验证 document.json
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(sketchDir, 'document.json'), 'utf8'));
    errors.push(...validateDocument(doc));
    
    // 验证 pages
    if (doc.pages && Array.isArray(doc.pages)) {
      for (const pageRef of doc.pages) {
        const pageId = pageRef._ref?.replace('pages/', '');
        if (pageId) {
          const pagePath = path.join(pagesDir, `${pageId}.json`);
          if (!fs.existsSync(pagePath)) {
            errors.push(`Missing page file: pages/${pageId}.json`);
          } else {
            const page = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
            errors.push(...validatePage(page));
          }
        }
      }
    }
    
    // 验证 meta.json
    const meta = JSON.parse(fs.readFileSync(path.join(sketchDir, 'meta.json'), 'utf8'));
    errors.push(...validateMeta(meta));
    
    // 验证 user.json
    const user = JSON.parse(fs.readFileSync(path.join(sketchDir, 'user.json'), 'utf8'));
    const pageIds = doc.pages?.map(p => p._ref?.replace('pages/', '')).filter(Boolean) || [];
    errors.push(...validateUser(user, pageIds));
    
  } catch (e) {
    errors.push(`Error parsing JSON: ${e.message}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateSketchDirectory,
  validateDocument,
  validatePage,
  validateMeta,
  validateUser,
  validateArtboard,
  validateRectangle,
  validateText,
  isValidUUID
};