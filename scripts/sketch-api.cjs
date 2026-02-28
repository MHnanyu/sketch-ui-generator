/**
 * Sketch Design API
 * 统一的入口脚本，提供 generate_sketch_json 和 sketch_packer 功能
 * 修复版 - 兼容 Figma 导入，带 Schema 验证
 */

const {
  generateUUID,
  createRectangle,
  createText,
  createArtboard,
  createPage,
  generateSketchDocument,
  parseColor
} = require('./sketch-generator.cjs');

const { packSketch, getFileInfo } = require('./sketch-packer.cjs');

/**
 * 生成 Sketch JSON - 主函数
 * @param {Object} config - 配置对象
 * @returns {Object} 完整的 Sketch 文档 JSON
 */
function generateSketchJSON(config) {
  const {
    pageName = "Design",
    artboardSize = { width: 393, height: 852 },
    theme = "light",
    colors = {},
    modules = []
  } = config;

  // 默认颜色
  const colorPalette = {
    primary: colors.primary || "#007AFF",
    secondary: colors.secondary || "#5856D6",
    background: colors.background || (theme === "dark" ? "#1C1C1E" : "#F2F2F7"),
    surface: colors.surface || (theme === "dark" ? "#2C2C2E" : "#FFFFFF"),
    textPrimary: colors.textPrimary || (theme === "dark" ? "#FFFFFF" : "#1C1C1E"),
    textSecondary: colors.textSecondary || "#8E8E93"
  };

  // 创建主画板
  const artboard = createArtboard(
    pageName,
    artboardSize.width,
    artboardSize.height,
    colorPalette.background
  );

  let currentY = 0;
  const padding = 16;
  const contentWidth = artboardSize.width - (padding * 2);

  // 按模块顺序生成图层
  modules.forEach((module) => {
    const layers = generateModule(module, {
      x: padding,
      y: currentY,
      width: contentWidth,
      colorPalette,
      artboardWidth: artboardSize.width
    });
    
    artboard.layers.push(...layers);
    currentY += module.height || 100;
  });

  // 创建页面
  const page = createPage(pageName, [artboard]);

  // 生成完整文档
  const document = generateSketchDocument([page]);

  return document;
}

/**
 * 生成单个模块的图层
 */
function generateModule(module, context) {
  const { x, y, width, colorPalette } = context;
  const layers = [];

  switch (module.type) {
    case 'header':
      // 顶部导航栏背景
      const header = createRectangle(
        { x, y, width, height: module.height || 56 },
        { fills: [colorPalette.surface] },
        "Header"
      );
      layers.push(header);
      
      // 标题文字
      if (module.title) {
        const titleText = createText(module.title, {
          x: x + 16,
          y: y + 16,
          width: width - 32,
          height: 24
        }, {
          fontSize: 18,
          fontFamily: "Roboto-Bold",
          color: colorPalette.textPrimary,
          alignment: "center"
        });
        layers.push(titleText);
      }
      break;

    case 'hero':
      // Hero 区域背景
      const heroBg = createRectangle(
        { x, y, width, height: module.height || 280 },
        { fills: [colorPalette.primary] },
        "Hero Background"
      );
      layers.push(heroBg);
      
      // 主标题
      if (module.title) {
        const heroTitle = createText(module.title, {
          x: x + 24,
          y: y + 40,
          width: width - 48,
          height: 36
        }, {
          fontSize: 28,
          fontFamily: "Roboto-Bold",
          color: "#FFFFFF",
          alignment: "center"
        });
        layers.push(heroTitle);
      }
      
      // 副标题
      if (module.subtitle) {
        const heroSubtitle = createText(module.subtitle, {
          x: x + 24,
          y: y + 84,
          width: width - 48,
          height: 20
        }, {
          fontSize: 15,
          fontFamily: "Roboto-Regular",
          color: "#FFFFFF",
          alignment: "center"
        });
        layers.push(heroSubtitle);
      }
      
      // CTA 按钮
      if (module.cta) {
        const ctaButton = createRectangle(
          { x: x + width/2 - 70, y: y + 140, width: 140, height: 44 },
          { fills: ["#FFFFFF"], cornerRadius: 22 },
          "CTA Button"
        );
        layers.push(ctaButton);
        
        const ctaText = createText(module.cta, {
          x: x + width/2 - 70,
          y: y + 152,
          width: 140,
          height: 20
        }, {
          fontSize: 16,
          fontFamily: "Roboto-Medium",
          color: colorPalette.primary,
          alignment: "center"
        });
        layers.push(ctaText);
      }
      break;

    case 'features':
      // 功能区背景
      const featuresBg = createRectangle(
        { x, y, width, height: module.height || 200 },
        { fills: [colorPalette.surface] },
        "Features"
      );
      layers.push(featuresBg);
      
      // 标题
      if (module.sectionTitle) {
        const sectionTitle = createText(module.sectionTitle, {
          x: x + 16,
          y: y + 20,
          width: width - 32,
          height: 24
        }, {
          fontSize: 20,
          fontFamily: "Roboto-Medium",
          color: colorPalette.textPrimary,
          alignment: "left"
        });
        layers.push(sectionTitle);
      }
      
      // 功能项
      if (module.items && Array.isArray(module.items)) {
        module.items.forEach((item, index) => {
          const itemY = y + 60 + (index * 48);
          const featureItem = createText(`• ${item}`, {
            x: x + 16,
            y: itemY,
            width: width - 32,
            height: 20
          }, {
            fontSize: 16,
            fontFamily: "Roboto-Regular",
            color: colorPalette.textPrimary,
            alignment: "left"
          });
          layers.push(featureItem);
        });
      }
      break;

    case 'productGrid':
      // 产品网格区域
      const gridBg = createRectangle(
        { x, y, width, height: module.height || 300 },
        { fills: [colorPalette.background] },
        "Product Grid"
      );
      layers.push(gridBg);
      
      // 标题
      if (module.sectionTitle) {
        const gridTitle = createText(module.sectionTitle, {
          x: x + 16,
          y: y + 16,
          width: width - 32,
          height: 24
        }, {
          fontSize: 20,
          fontFamily: "Roboto-Medium",
          color: colorPalette.textPrimary
        });
        layers.push(gridTitle);
      }
      
      // 产品卡片
      if (module.products) {
        const cardWidth = (width - 48) / 2;
        module.products.forEach((product, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          const cardX = x + 16 + (col * (cardWidth + 16));
          const cardY = y + 56 + (row * (cardWidth + 80));
          
          const card = createRectangle(
            { x: cardX, y: cardY, width: cardWidth, height: cardWidth + 60 },
            { fills: [colorPalette.surface], cornerRadius: 12 },
            `Product ${index + 1}`
          );
          layers.push(card);
          
          const productName = createText(product.name || "Product", {
            x: cardX + 12,
            y: cardY + cardWidth + 8,
            width: cardWidth - 24,
            height: 18
          }, {
            fontSize: 14,
            fontFamily: "Roboto-Medium",
            color: colorPalette.textPrimary
          });
          layers.push(productName);
          
          const productPrice = createText(product.price || "$99", {
            x: cardX + 12,
            y: cardY + cardWidth + 28,
            width: cardWidth - 24,
            height: 16
          }, {
            fontSize: 14,
            fontFamily: "Roboto-Regular",
            color: colorPalette.primary
          });
          layers.push(productPrice);
        });
      }
      break;

    case 'bottomNav':
      // 底部导航
      const bottomNav = createRectangle(
        { x, y, width, height: module.height || 80 },
        { fills: [colorPalette.surface] },
        "Bottom Navigation"
      );
      layers.push(bottomNav);
      
      // 导航项
      if (module.items) {
        const itemWidth = width / module.items.length;
        module.items.forEach((item, index) => {
          const navText = createText(item, {
            x: x + index * itemWidth,
            y: y + 28,
            width: itemWidth,
            height: 24
          }, {
            fontSize: 12,
            fontFamily: "Roboto-Regular",
            color: index === 0 ? colorPalette.primary : colorPalette.textSecondary,
            alignment: "center"
          });
          layers.push(navText);
        });
      }
      break;

    case 'loginForm':
      // 登录表单容器
      const loginContainer = createRectangle(
        { x: x + width/2 - 200, y: y + 60, width: 400, height: 320 },
        { fills: [colorPalette.surface], cornerRadius: 12 },
        "Login Form"
      );
      layers.push(loginContainer);
      
      // 标题
      if (module.title) {
        const formTitle = createText(module.title, {
          x: x + width/2 - 200,
          y: y + 80,
          width: 400,
          height: 32
        }, {
          fontSize: 24,
          fontFamily: "Roboto-Bold",
          color: colorPalette.textPrimary,
          alignment: "center"
        });
        layers.push(formTitle);
      }
      
      // 账号输入框
      const emailLabel = createText("Email", {
        x: x + width/2 - 170,
        y: y + 140,
        width: 340,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(emailLabel);
      
      const emailInput = createRectangle(
        { x: x + width/2 - 170, y: y + 165, width: 340, height: 44 },
        { fills: [colorPalette.background], cornerRadius: 8 },
        "Email Input"
      );
      layers.push(emailInput);
      
      const emailPlaceholder = createText("Enter your email", {
        x: x + width/2 - 155,
        y: y + 179,
        width: 310,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(emailPlaceholder);
      
      // 密码输入框
      const passwordLabel = createText("Password", {
        x: x + width/2 - 170,
        y: y + 225,
        width: 340,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(passwordLabel);
      
      const passwordInput = createRectangle(
        { x: x + width/2 - 170, y: y + 250, width: 340, height: 44 },
        { fills: [colorPalette.background], cornerRadius: 8 },
        "Password Input"
      );
      layers.push(passwordInput);
      
      const passwordPlaceholder = createText("Enter your password", {
        x: x + width/2 - 155,
        y: y + 264,
        width: 310,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(passwordPlaceholder);
      
      // 按钮组
      if (module.buttons) {
        // 登录按钮
        const loginBtn = createRectangle(
          { x: x + width/2 - 170, y: y + 310, width: 160, height: 44 },
          { fills: [colorPalette.primary], cornerRadius: 8 },
          "Login Button"
        );
        layers.push(loginBtn);
        
        const loginBtnText = createText("Sign In", {
          x: x + width/2 - 170,
          y: y + 322,
          width: 160,
          height: 20
        }, {
          fontSize: 16,
          fontFamily: "Roboto-Medium",
          color: "#FFFFFF",
          alignment: "center"
        });
        layers.push(loginBtnText);
        
        // 重置按钮
        const resetBtn = createRectangle(
          { x: x + width/2 + 10, y: y + 310, width: 160, height: 44 },
          { fills: [colorPalette.background], cornerRadius: 8, borderColor: colorPalette.textSecondary },
          "Reset Button"
        );
        layers.push(resetBtn);
        
        const resetBtnText = createText("Reset", {
          x: x + width/2 + 10,
          y: y + 322,
          width: 160,
          height: 20
        }, {
          fontSize: 16,
          fontFamily: "Roboto-Medium",
          color: colorPalette.textSecondary,
          alignment: "center"
        });
        layers.push(resetBtnText);
      }
      break;


    case 'customLoginForm':
      // 自定义登录表单 - 包含验证码
      const customFormContainer = createRectangle(
        { x: x + width/2 - 160, y: y + 40, width: 320, height: 380 },
        { fills: [colorPalette.surface], cornerRadius: 12 },
        "Login Form"
      );
      layers.push(customFormContainer);
      
      // 标题
      if (module.title) {
        const customFormTitle = createText(module.title, {
          x: x + width/2 - 160,
          y: y + 60,
          width: 320,
          height: 32
        }, {
          fontSize: 24,
          fontFamily: "Roboto-Bold",
          color: colorPalette.textPrimary,
          alignment: "center"
        });
        layers.push(customFormTitle);
      }
      
      // 账号名字段
      const usernameLabel = createText("账号名", {
        x: x + width/2 - 140,
        y: y + 110,
        width: 280,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(usernameLabel);
      
      const usernameInput = createRectangle(
        { x: x + width/2 - 140, y: y + 135, width: 280, height: 44 },
        { fills: [colorPalette.background], cornerRadius: 8 },
        "Username Input"
      );
      layers.push(usernameInput);
      
      const usernamePlaceholder = createText(module.usernamePlaceholder || "请输入账号名", {
        x: x + width/2 - 125,
        y: y + 149,
        width: 250,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(usernamePlaceholder);
      
      // 密码字段
      const customPasswordLabel = createText("密码", {
        x: x + width/2 - 140,
        y: y + 195,
        width: 280,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(customPasswordLabel);
      
      const customPasswordInput = createRectangle(
        { x: x + width/2 - 140, y: y + 220, width: 280, height: 44 },
        { fills: [colorPalette.background], cornerRadius: 8 },
        "Password Input"
      );
      layers.push(customPasswordInput);
      
      const customPasswordPlaceholder = createText(module.passwordPlaceholder || "请输入密码", {
        x: x + width/2 - 125,
        y: y + 234,
        width: 250,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(customPasswordPlaceholder);
      
      // 验证码字段
      const verifyCodeLabel = createText("验证码", {
        x: x + width/2 - 140,
        y: y + 280,
        width: 280,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Medium",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(verifyCodeLabel);
      
      // 验证码输入框 (2/3 宽度)
      const verifyCodeInput = createRectangle(
        { x: x + width/2 - 140, y: y + 305, width: 180, height: 44 },
        { fills: [colorPalette.background], cornerRadius: 8 },
        "Verify Code Input"
      );
      layers.push(verifyCodeInput);
      
      const verifyCodePlaceholder = createText(module.verifyCodePlaceholder || "请输入验证码", {
        x: x + width/2 - 125,
        y: y + 319,
        width: 150,
        height: 18
      }, {
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        color: colorPalette.textSecondary,
        alignment: "left"
      });
      layers.push(verifyCodePlaceholder);
      
      // 验证码图片占位 (1/3 宽度)
      const verifyCodeImage = createRectangle(
        { x: x + width/2 + 50, y: y + 305, width: 90, height: 44 },
        { fills: [colorPalette.background], cornerRadius: 8 },
        "Verify Code Image"
      );
      layers.push(verifyCodeImage);
      
      const verifyCodeText = createText("1234", {
        x: x + width/2 + 65,
        y: y + 319,
        width: 60,
        height: 18
      }, {
        fontSize: 16,
        fontFamily: "Roboto-Bold",
        color: colorPalette.textPrimary,
        alignment: "center"
      });
      layers.push(verifyCodeText);
      
      // 按钮组
      const btnY = y + 365;
      
      // 登录按钮
      const customLoginBtn = createRectangle(
        { x: x + width/2 - 140, y: btnY, width: 130, height: 44 },
        { fills: [colorPalette.primary], cornerRadius: 8 },
        "Login Button"
      );
      layers.push(customLoginBtn);
      
      const customLoginBtnText = createText(module.loginText || "登录", {
        x: x + width/2 - 140,
        y: btnY + 12,
        width: 130,
        height: 20
      }, {
        fontSize: 16,
        fontFamily: "Roboto-Medium",
        color: "#FFFFFF",
        alignment: "center"
      });
      layers.push(customLoginBtnText);
      
      // 重置按钮
      const customResetBtn = createRectangle(
        { x: x + width/2 + 10, y: btnY, width: 130, height: 44 },
        { fills: [colorPalette.background], cornerRadius: 8 },
        "Reset Button"
      );
      layers.push(customResetBtn);
      
      const customResetBtnText = createText(module.resetText || "重置", {
        x: x + width/2 + 10,
        y: btnY + 12,
        width: 130,
        height: 20
      }, {
        fontSize: 16,
        fontFamily: "Roboto-Medium",
        color: colorPalette.textSecondary,
        alignment: "center"
      });
      layers.push(customResetBtnText);
      break;
    case 'orderHeader':
      // 顶部详情卡片
      const headerBg = createRectangle(
        { x, y, width, height: module.height || 120 },
        { fills: [colorPalette.surface] },
        "Order Header"
      );
      layers.push(headerBg);
      
      // 主标题
      if (module.title) {
        const mainTitle = createText(module.title, {
          x: x + 24,
          y: y + 20,
          width: 400,
          height: 28
        }, {
          fontSize: 22,
          fontFamily: "Roboto-Bold",
          color: colorPalette.textPrimary,
          alignment: "left"
        });
        layers.push(mainTitle);
      }
      
      // 副标题
      if (module.subtitle) {
        const subTitle = createText(module.subtitle, {
          x: x + 24,
          y: y + 52,
          width: 400,
          height: 20
        }, {
          fontSize: 14,
          fontFamily: "Roboto-Regular",
          color: colorPalette.textSecondary,
          alignment: "left"
        });
        layers.push(subTitle);
      }
      
      // 图标文字
      if (module.icon) {
        const iconText = createText(module.icon, {
          x: x + 24,
          y: y + 80,
          width: 100,
          height: 18
        }, {
          fontSize: 13,
          fontFamily: "Roboto-Medium",
          color: colorPalette.textSecondary,
          alignment: "left"
        });
        layers.push(iconText);
      }
      
      // 状态标签
      if (module.status) {
        const statusBg = createRectangle(
          { x: x + width - 120, y: y + 20, width: 80, height: 28 },
          { fills: [module.statusColor || colorPalette.primary], cornerRadius: 4 },
          "Status Tag"
        );
        layers.push(statusBg);
        
        const statusText = createText(module.status, {
          x: x + width - 120,
          y: y + 26,
          width: 80,
          height: 16
        }, {
          fontSize: 12,
          fontFamily: "Roboto-Medium",
          color: "#FFFFFF",
          alignment: "center"
        });
        layers.push(statusText);
      }
      break;

    case 'collapsiblePanel':
    case 'collapsePanel':
      // 折叠面板容器
      const panelBg = createRectangle(
        { x, y, width, height: module.height || 300 },
        { fills: [colorPalette.surface], cornerRadius: 8 },
        "Collapsible Panel"
      );
      layers.push(panelBg);
      
      // 面板标题
      if (module.title) {
        const panelTitle = createText(module.title, {
          x: x + 16,
          y: y + 16,
          width: width - 32,
          height: 24
        }, {
          fontSize: 16,
          fontFamily: "Roboto-Bold",
          color: colorPalette.textPrimary,
          alignment: "left"
        });
        layers.push(panelTitle);
      }
      
      // 表单字段
      if (module.fields && Array.isArray(module.fields)) {
        const cols = 2;
        const fieldWidth = (width - 48) / cols;
        const fieldHeight = 36;
        
        module.fields.forEach((field, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const fieldX = x + 16 + (col * (fieldWidth + 16));
          const fieldY = y + 52 + (row * (fieldHeight + 16));
          
          // 字段标签
          const fieldLabel = createText(field.label, {
            x: fieldX,
            y: fieldY,
            width: fieldWidth,
            height: 16
          }, {
            fontSize: 13,
            fontFamily: "Roboto-Medium",
            color: colorPalette.textSecondary,
            alignment: "left"
          });
          layers.push(fieldLabel);
          
          // 字段值/输入框
          const fieldInput = createRectangle(
            { x: fieldX, y: fieldY + 18, width: fieldWidth, height: 32 },
            { fills: [colorPalette.background], cornerRadius: 4 },
            field.label
          );
          layers.push(fieldInput);
          
          // 值文字
          const fieldValue = createText(field.value || "", {
            x: fieldX + 8,
            y: fieldY + 24,
            width: fieldWidth - 16,
            height: 18
          }, {
            fontSize: 13,
            fontFamily: "Roboto-Regular",
            color: field.value ? colorPalette.textPrimary : colorPalette.textSecondary,
            alignment: "left"
          });
          layers.push(fieldValue);
        });
      }
      break;

    case 'dataTable':
      // 数据表格容器
      const tableBg = createRectangle(
        { x, y, width, height: module.height || 300 },
        { fills: [colorPalette.surface], cornerRadius: 8 },
        "Data Table"
      );
      layers.push(tableBg);
      
      // 表格标题
      if (module.title) {
        const tableTitle = createText(module.title, {
          x: x + 16,
          y: y + 16,
          width: width - 32,
          height: 24
        }, {
          fontSize: 16,
          fontFamily: "Roboto-Bold",
          color: colorPalette.textPrimary,
          alignment: "left"
        });
        layers.push(tableTitle);
      }
      
      // 新增按钮
      const addBtn = createRectangle(
        { x: x + width - 100, y: y + 12, width: 80, height: 32 },
        { fills: [colorPalette.primary], cornerRadius: 4 },
        "Add Button"
      );
      layers.push(addBtn);
      
      const addBtnText = createText("新增", {
        x: x + width - 100,
        y: y + 18,
        width: 80,
        height: 20
      }, {
        fontSize: 13,
        fontFamily: "Roboto-Medium",
        color: "#FFFFFF",
        alignment: "center"
      });
      layers.push(addBtnText);
      
      // 表头背景
      const theadBg = createRectangle(
        { x: x + 16, y: y + 52, width: width - 32, height: 40 },
        { fills: [colorPalette.background] },
        "Table Header"
      );
      layers.push(theadBg);
      
      // 表头列
      if (module.columns && Array.isArray(module.columns)) {
        let colX = x + 20;
        module.columns.forEach((col) => {
          const colHeader = createText(col.name, {
            x: colX,
            y: y + 62,
            width: col.width,
            height: 20
          }, {
            fontSize: 13,
            fontFamily: "Roboto-Medium",
            color: colorPalette.textSecondary,
            alignment: "left"
          });
          layers.push(colHeader);
          colX += col.width;
        });
      }
      
      // 表格行
      if (module.rows && Array.isArray(module.rows)) {
        module.rows.forEach((row, rowIndex) => {
          const rowY = y + 92 + (rowIndex * 44);
          const rowBg = rowIndex % 2 === 0 ? colorPalette.surface : colorPalette.background;
          
          const tableRow = createRectangle(
            { x: x + 16, y: rowY, width: width - 32, height: 44 },
            { fills: [rowBg] },
            `Row ${rowIndex + 1}`
          );
          layers.push(tableRow);
          
          // 单元格
          let cellX = x + 20;
          if (module.hasCheckbox) {
            const checkbox = createRectangle(
              { x: cellX, y: rowY + 14, width: 16, height: 16 },
              { fills: [colorPalette.border], cornerRadius: 2 },
              "Checkbox"
            );
            layers.push(checkbox);
            cellX += 30;
          }
          
          if (module.hasActions) {
            // 操作列放最后
            row.pop();
          }
          
          row.forEach((cell, colIndex) => {
            const cellText = createText(String(cell), {
              x: cellX,
              y: rowY + 12,
              width: module.columns[colIndex]?.width || 80,
              height: 20
            }, {
              fontSize: 13,
              fontFamily: "Roboto-Regular",
              color: colorPalette.textPrimary,
              alignment: "left"
            });
            layers.push(cellText);
            cellX += module.columns[colIndex]?.width || 80;
          });
        });
      }
      break;

    case 'actionButtons':
      // 底部操作按钮
      const actionBg = createRectangle(
        { x, y, width, height: module.height || 64 },
        { fills: [colorPalette.surface] },
        "Action Buttons"
      );
      layers.push(actionBg);
      
      if (module.buttons && Array.isArray(module.buttons)) {
        const btnWidth = 100;
        const btnHeight = 40;
        const startX = x + width - (module.buttons.length * btnWidth) - 16;
        
        module.buttons.forEach((btn, index) => {
          const btnX = startX + (index * (btnWidth + 12));
          
          const actionBtn = createRectangle(
            { x: btnX, y: y + 12, width: btnWidth, height: btnHeight },
            { 
              fills: [btn.primary ? colorPalette.primary : colorPalette.background], 
              cornerRadius: 6,
              borderColor: btn.primary ? colorPalette.primary : colorPalette.border
            },
            btn.text
          );
          layers.push(actionBtn);
          
          const btnText = createText(btn.text, {
            x: btnX,
            y: y + 20,
            width: btnWidth,
            height: 24
          }, {
            fontSize: 14,
            fontFamily: "Roboto-Medium",
            color: btn.primary ? "#FFFFFF" : colorPalette.textPrimary,
            alignment: "center"
          });
          layers.push(btnText);
        });
      }
      break;

    default:
      // 通用矩形
      const genericLayer = createRectangle(
        { x, y, width, height: module.height || 100 },
        { fills: [colorPalette.surface], cornerRadius: 8 },
        module.type
      );
      layers.push(genericLayer);
  }

  return layers;
}

/**
 * 打包并导出 Sketch 文件
 * @param {Object} config - 设计配置
 * @param {string} outputDir - 输出目录（默认 workspace/sketch-output）
 * @param {Object} options - 选项
 * @returns {Object} 包含文件路径和下载信息
 */
async function exportSketch(config, outputDir = null, options = {}) {
  // 生成 JSON
  const sketchJSON = generateSketchJSON(config);
  
  // 打包文件
  const filename = config.filename || 'ai-design';
  const result = await packSketch(sketchJSON, filename, outputDir, options);
  
  // 获取 sketch 文件信息
  const sketchFile = getFileInfo(result.sketchPath);
  
  return {
    success: true,
    uniqueFilename: result.uniqueFilename,
    // Sketch 文件夹（未压缩）
    folderPath: result.uncompressedPath,
    folderPathRelative: result.uncompressedPathRelative,
    // Sketch 压缩文件
    sketchPath: result.sketchPath,
    sketchPathRelative: result.sketchPathRelative,
    // 输出目录
    outputDir: result.baseDir,
    outputDirRelative: result.baseDirRelative,
    // 文件信息
    sketchFile: sketchFile,
    preview: {
      pageName: config.pageName || "Design",
      artboardSize: config.artboardSize || { width: 393, height: 852 },
      moduleCount: config.modules?.length || 0
    }
  };
}

// 导出主要函数
module.exports = {
  generateSketchJSON,
  exportSketch,
  generateUUID
};