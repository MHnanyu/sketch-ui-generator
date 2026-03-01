/**
 * Layout Validator - 模块位置与层级验证器
 * 检测各模块的位置和层次关系，避免重叠或覆盖
 */

class LayoutValidator {
  constructor(options = {}) {
    this.artboardWidth = options.artboardWidth || 393;
    this.artboardHeight = options.artboardHeight || 852;
    this.padding = options.padding || 16;
    this.moduleGap = options.moduleGap || 8;
    this.modules = [];
    this.modulePositions = [];
  }

  /**
   * 添加模块并自动计算位置
   * @param {Object} module - 模块配置
   * @param {string} module.id - 模块唯一标识
   * @param {string} module.type - 模块类型
   * @param {number} module.height - 模块高度
   * @param {number} [module.width] - 模块宽度（默认画布宽度）
   * @param {number} [module.y] - 固定Y坐标（可选）
   */
  addModule(module) {
    const width = module.width || this.artboardWidth;
    const y = module.y !== undefined ? module.y : this._calculateY(module.type);
    
    const moduleData = {
      id: module.id,
      type: module.type,
      x: this.padding,
      y: y,
      width: width - this.padding * 2,
      height: module.height,
      originalY: y
    };
    
    this.modules.push(moduleData);
    this.modulePositions.push({
      id: module.id,
      type: module.type,
      x: moduleData.x,
      y: moduleData.y,
      right: moduleData.x + moduleData.width,
      bottom: moduleData.y + moduleData.height
    });
  }

  /**
   * 计算Y坐标（基于之前的模块位置）
   */
  _calculateY(type) {
    if (this.modules.length === 0) {
      return this.padding;
    }
    const lastModule = this.modules[this.modules.length - 1];
    return lastModule.y + lastModule.height + this.moduleGap;
  }

  /**
   * 检测两个矩形是否重叠
   */
  _isOverlapping(a, b) {
    return !(
      a.right <= b.x ||
      a.bottom <= b.y ||
      b.right <= a.x ||
      b.bottom <= a.y
    );
  }

  /**
   * 检测垂直重叠（模块A的底部 > 模块B的顶部，且A在B之前）
   */
  _checkVerticalOverlap(modules) {
    const overlaps = [];
    for (let i = 0; i < modules.length - 1; i++) {
      const current = modules[i];
      for (let j = i + 1; j < modules.length; j++) {
        const next = modules[j];
        // 检查当前模块底部是否超过下一个模块的顶部
        if (current.bottom > next.y && current.y < next.y) {
          overlaps.push({
            type: 'vertical',
            moduleA: current.id,
            moduleB: next.id,
            message: `${current.id} (底部: ${current.bottom}) 与 ${next.id} (顶部: ${next.y}) 垂直重叠`
          });
        }
      }
    }
    return overlaps;
  }

  /**
   * 检测水平重叠
   */
  _checkHorizontalOverlap(modules) {
    const overlaps = [];
    for (let i = 0; i < modules.length - 1; i++) {
      const current = modules[i];
      for (let j = i + 1; j < modules.length; j++) {
        const next = modules[j];
        // 检查Y范围是否有交集
        const yOverlap = !(current.bottom <= next.y || next.bottom <= current.y);
        if (yOverlap) {
          // 检查X范围是否有交集
          const xOverlap = !(current.right <= next.x || next.right <= current.x);
          if (xOverlap) {
            overlaps.push({
              type: 'horizontal',
              moduleA: current.id,
              moduleB: next.id,
              message: `${current.id} 与 ${next.id} 水平重叠`
            });
          }
        }
      }
    }
    return overlaps;
  }

  /**
   * 检测边界溢出
   */
  _checkBoundaryOverflow(modules) {
    const overflows = [];
    for (const module of modules) {
      if (module.x < 0) {
        overflows.push({
          type: 'boundary',
          moduleId: module.id,
          message: `${module.id} 超出左边界 (x: ${module.x})`
        });
      }
      if (module.y < 0) {
        overflows.push({
          type: 'boundary',
          moduleId: module.id,
          message: `${module.id} 超出上边界 (y: ${module.y})`
        });
      }
      if (module.right > this.artboardWidth) {
        overflows.push({
          type: 'boundary',
          moduleId: module.id,
          message: `${module.id} 超出右边界 (right: ${module.right} > ${this.artboardWidth})`
        });
      }
      if (module.bottom > this.artboardHeight) {
        overflows.push({
          type: 'boundary',
          moduleId: module.id,
          message: `${module.id} 超出下边界 (bottom: ${module.bottom} > ${this.artboardHeight})`
        });
      }
    }
    return overflows;
  }

  /**
   * 自动修复重叠（堆叠策略）
   */
  _autoFixStack(modules) {
    const fixed = [];
    let currentY = this.padding;
    
    for (const module of modules) {
      // 如果模块有固定Y坐标，保持原位置
      if (module.originalY !== undefined && module.originalY !== currentY) {
        fixed.push({
          ...module,
          y: module.originalY,
          bottom: module.originalY + module.height
        });
        currentY = module.originalY + module.height + this.moduleGap;
      } else {
        fixed.push({
          ...module,
          y: currentY,
          bottom: currentY + module.height
        });
        currentY += module.height + this.moduleGap;
      }
    }
    
    return fixed;
  }

  /**
   * 自动修复重叠（网格策略）
   */
  _autoFixGrid(modules) {
    const fixed = [];
    const cols = 2;
    const colWidth = (this.artboardWidth - this.padding * (cols + 1)) / cols;
    const colHeights = new Array(cols).fill(this.padding);
    
    for (const module of modules) {
      // 找到最短的列
      let minCol = 0;
      for (let i = 1; i < cols; i++) {
        if (colHeights[i] < colHeights[minCol]) {
          minCol = i;
        }
      }
      
      const x = this.padding + minCol * (colWidth + this.padding);
      const y = colHeights[minCol];
      
      fixed.push({
        ...module,
        x: x,
        y: y,
        width: colWidth,
        right: x + colWidth,
        bottom: y + module.height
      });
      
      colHeights[minCol] += module.height + this.moduleGap;
    }
    
    return fixed;
  }

  /**
   * 验证布局
   * @param {Object} options - 验证选项
   * @param {boolean} [options.autoFix=false] - 是否自动修复
   * @param {string} [options.fixStrategy='stack'] - 修复策略：stack/grid
   * @returns {Object} 验证结果
   */
  validate(options = {}) {
    const { autoFix = false, fixStrategy = 'stack' } = options;
    
    // 检测重叠
    const verticalOverlaps = this._checkVerticalOverlap(this.modulePositions);
    const horizontalOverlaps = this._checkHorizontalOverlap(this.modulePositions);
    const boundaryOverflows = this._checkBoundaryOverflow(this.modulePositions);
    
    const allOverlaps = [...verticalOverlaps, ...horizontalOverlaps];
    const hasOverlaps = allOverlaps.length > 0;
    const hasOverflows = boundaryOverflows.length > 0;
    
    let resultModules = this.modulePositions;
    
    // 如果启用自动修复
    if (autoFix && (hasOverlaps || hasOverflows)) {
      if (fixStrategy === 'grid') {
        resultModules = this._autoFixGrid(this.modulePositions);
      } else {
        resultModules = this._autoFixStack(this.modulePositions);
      }
      
      // 重新验证修复后的布局
      const fixedVertical = this._checkVerticalOverlap(resultModules);
      const fixedHorizontal = this._checkHorizontalOverlap(resultModules);
      const fixedOverflows = this._checkBoundaryOverflow(resultModules);
      
      return {
        hasOverlaps: fixedVertical.length > 0 || fixedHorizontal.length > 0,
        hasOverflows: fixedOverflows.length > 0,
        overlaps: [...fixedVertical, ...fixedHorizontal],
        overflows: fixedOverflows,
        modules: resultModules,
        wasAutoFixed: true,
        layoutReport: this._generateReport(resultModules)
      };
    }
    
    return {
      hasOverlaps,
      hasOverflows,
      overlaps: allOverlaps,
      overflows: boundaryOverflows,
      modules: resultModules,
      wasAutoFixed: false,
      layoutReport: this._generateReport(this.modulePositions)
    };
  }

  /**
   * 生成布局报告
   */
  _generateReport(modules) {
    const lines = [
      `📊 布局分析:`,
      `  ✓ 画布尺寸: ${this.artboardWidth}x${this.artboardHeight}`,
      `  ✓ 模块数量: ${modules.length}`
    ];
    
    if (this.hasOverlaps || this.hasOverflows) {
      lines.push(`  ✗ 检测到布局问题`);
    } else {
      lines.push(`  ✓ 无重叠/溢出`);
    }
    
    lines.push(`  📐 模块位置:`);
    for (const m of modules) {
      lines.push(`     - ${m.id}: (${m.x}, ${m.y}) - ${m.width}x${m.height}`);
    }
    
    return lines.join('\n');
  }

  /**
   * 获取布局报告字符串
   */
  getLayoutReport() {
    return this._generateReport(this.modulePositions);
  }
}

module.exports = LayoutValidator;
