/**
 * Sketch Packer
 * 将 Sketch JSON 打包为 .sketch 文件
 * 优化版 - 接近 Figma 导出的 Sketch 格式
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const OPENCLAW_NODE_MODULES = path.join(OPENCLAW_DIR, 'node_modules');

// Sketch 版本常量
const SKETCH_VERSION = "74.1";
const SKETCH_BUILD = 128920;

/**
 * 确保 adm-zip 依赖可用
 */
function ensureAdmZip() {
  try {
    if (fs.existsSync(OPENCLAW_NODE_MODULES)) {
      const admZipPath = path.join(OPENCLAW_NODE_MODULES, 'adm-zip');
      if (fs.existsSync(admZipPath)) {
        return require(admZipPath);
      }
    }
    
    try {
      return require('adm-zip');
    } catch (e) {
      // 需要安装
    }
    
    console.log('adm-zip not found, installing to ' + OPENCLAW_DIR + '...');
    
    if (!fs.existsSync(OPENCLAW_DIR)) {
      fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
    }
    
    const packageJsonPath = path.join(OPENCLAW_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      fs.writeFileSync(packageJsonPath, JSON.stringify({
        name: "openclaw-dependencies",
        version: "1.0.0",
        description: "OpenClaw shared dependencies",
        private: true
      }, null, 2), 'utf8');
    }
    
    execSync('npm install adm-zip --save', {
      cwd: OPENCLAW_DIR,
      stdio: 'pipe'
    });
    
    console.log('adm-zip installed successfully');
    
    return require(path.join(OPENCLAW_NODE_MODULES, 'adm-zip'));
    
  } catch (error) {
    throw new Error('Failed to install/load adm-zip: ' + error.message);
  }
}

const AdmZip = ensureAdmZip();
const { validateSketchDirectory } = require('./sketch-validator.cjs');

const DEFAULT_OUTPUT_DIR = path.join(os.homedir(), '.openclaw', 'workspace', 'sketch-output');

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

function generateUniqueFilename(baseName) {
  return baseName + '_' + Date.now();
}

function ensureOutputDir(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

function writeJSON(dir, filename, data) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return filePath;
}

function createZipWithAdmZip(sourceDir, outputPath) {
  const zip = new AdmZip();
  
  function addEntries(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      const zipPath = basePath ? basePath + '/' + item : item;
      
      if (stat.isDirectory()) {
        zip.addFile(zipPath + '/', Buffer.alloc(0));
        addEntries(fullPath, zipPath);
      } else {
        const content = fs.readFileSync(fullPath);
        zip.addFile(zipPath, content);
      }
    }
  }
  
  addEntries(sourceDir);
  zip.writeZip(outputPath);
}

async function packSketch(documentData, filename, outputDir, options) {
  filename = filename || 'design';
  options = options || {};
  const validate = options.validate !== false;
  const baseDir = outputDir ? ensureOutputDir(outputDir) : ensureOutputDir(DEFAULT_OUTPUT_DIR);
  const uniqueFilename = generateUniqueFilename(filename);
  const sketchDir = path.join(baseDir, uniqueFilename);
  
  if (fs.existsSync(sketchDir)) {
    fs.rmSync(sketchDir, { recursive: true });
  }
  fs.mkdirSync(sketchDir, { recursive: true });
  
  const pagesDir = path.join(sketchDir, 'pages');
  fs.mkdirSync(pagesDir, { recursive: true });
  
  const pages = documentData.pages || [];
  const pageIds = pages.map(p => p.do_objectID);
  
  // Figma 导出的 document.json 格式
  const document = {
    _class: "document",
    do_objectID: documentData.do_objectID || generateUUID(),
    appVersion: SKETCH_VERSION,
    build: SKETCH_BUILD,
    currentPageIndex: documentData.currentPageIndex || 0,
    assets: documentData.assets || {
      _class: "assetCollection",
      do_objectID: generateUUID(),
      colorAssets: [],
      gradientAssets: [],
      images: [],
      colors: [],
      gradients: []
    },
    // colorSpace = 1 (Display P3) - Figma 导出格式
    colorSpace: documentData.colorSpace !== undefined ? documentData.colorSpace : 1,
    foreignLayerStyles: [],
    foreignSymbols: [],
    foreignTextStyles: [],
    foreignSwatches: [],
    layerStyles: documentData.layerStyles || { _class: "sharedStyleContainer", do_objectID: generateUUID(), objects: [] },
    layerSymbols: documentData.layerSymbols || { _class: "symbolContainer", do_objectID: generateUUID(), objects: [] },
    layerTextStyles: documentData.layerTextStyles || { _class: "sharedTextStyleContainer", do_objectID: generateUUID(), objects: [] },
    sharedSwatches: {
      _class: "swatchContainer",
      do_objectID: generateUUID(),
      objects: []
    },
    fontReferences: [],
    documentState: { _class: "documentState" },
    pages: pageIds.map(id => ({ 
      _class: "MSJSONFileReference",
      _ref_class: "MSImmutablePage",
      _ref: 'pages/' + id
    }))
  };
  writeJSON(sketchDir, 'document.json', document);
  
  pages.forEach(page => {
    const pageId = page.do_objectID;
    if (!page.hasClickThrough) page.hasClickThrough = true;
    if (page.layers) {
      page.layers.forEach(layer => {
        if (layer._class === 'artboard' && !layer.hasClickThrough) layer.hasClickThrough = true;
      });
    }
    writeJSON(pagesDir, pageId + '.json', page);
  });
  
  const pageId = (pages[0] && pages[0].do_objectID) || generateUUID();
  const artboardId = (pages[0] && pages[0].layers && pages[0].layers[0] && pages[0].layers[0].do_objectID) || generateUUID();
  const artboardName = (pages[0] && pages[0].layers && pages[0].layers[0] && pages[0].layers[0].name) || "Artboard";
  
  // Figma 导出的 meta.json 格式
  const meta = {
    commit: "eec98fa25f4692ad75f1a3b955a6293b4a93836e",
    version: 136,
    compatibilityVersion: 99,
    app: "com.bohemiancoding.sketch3",
    autosaved: 0,
    pagesAndArtboards: {}
  };
  meta.pagesAndArtboards[pageId] = {
    name: (pages[0] && pages[0].name) || "Page 1",
    artboards: {}
  };
  meta.pagesAndArtboards[pageId].artboards[artboardId] = { name: artboardName };
  // Figma 导出的额外字段
  meta.variant = "NONAPPSTORE";
  meta.fonts = [];
  meta.created = {
    commit: "238f363ed3de77eb1d86e03176f8a10f7928ed51",
    appVersion: SKETCH_VERSION,
    build: SKETCH_BUILD,
    app: "com.bohemiancoding.sketch3",
    compatibilityVersion: 99,
    coeditCompatibilityVersion: 99,
    version: 136,
    variant: "NONAPPSTORE"
  };
  meta.appVersion = SKETCH_VERSION;
  meta.build = SKETCH_BUILD;
  writeJSON(sketchDir, 'meta.json', meta);
  
  // Figma 导出的 user.json 格式
  const user = {
    document: { pageListHeight: 85, pageListCollapsed: 0 }
  };
  pageIds.forEach(id => {
    user[id] = { scrollOrigin: "{-0.000000, -0.000000}", zoomValue: 0.796296238899231 };
  });
  writeJSON(sketchDir, 'user.json', user);

  if (validate) {
    const validation = validateSketchDirectory(sketchDir);
    if (!validation.valid) {
      throw new Error('Sketch validation failed');
    }
    console.log('Sketch validation passed');
  }
  
  const sketchPath = path.join(baseDir, uniqueFilename + '.sketch');
  createZipWithAdmZip(sketchDir, sketchPath);
  
  const stats = fs.statSync(sketchPath);
  return {
    sketchPath: sketchPath,
    sketchPathRelative: path.relative(process.cwd(), sketchPath),
    folderPath: sketchDir,
    uncompressedPath: sketchDir,
    uncompressedPathRelative: path.relative(process.cwd(), sketchDir),
    outputDir: baseDir,
    baseDir: baseDir,
    baseDirRelative: path.relative(process.cwd(), baseDir),
    uniqueFilename: uniqueFilename,
    size: stats.size,
    sizeFormatted: (stats.size / 1024).toFixed(2) + ' KB'
  };
}

module.exports = {
  packSketch: packSketch,
  generateUUID: generateUUID,
  writeJSON: writeJSON,
  getFileInfo: function(filePath) {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
      sizeFormatted: (stats.size / 1024).toFixed(2) + ' KB',
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
};
