const fs = require('fs');
const path = require('path');

console.log('开始构建 Pages 项目...');

// 确保 public 目录存在
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
  console.log('创建 public 目录');
}

// 确保 functions 目录存在
if (!fs.existsSync('./functions')) {
  console.error('错误: functions 目录不存在，请确保已经创建了 Pages Functions');
  process.exit(1);
}

// 检查必要的文件
const requiredFiles = [
  './public/index.html',
  './functions/api/messages.js',
  './functions/api/files/upload.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`错误: 缺少必要文件 ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('构建失败: 缺少必要文件');
  process.exit(1);
}

// 复制 functions 到 public 目录（Pages 需要）
const functionsSource = './functions';
const functionsTarget = './public/_functions';

if (fs.existsSync(functionsTarget)) {
  fs.rmSync(functionsTarget, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(functionsSource, functionsTarget);
console.log('已复制 Functions 到 public/_functions');

// 创建 _routes.json 文件来配置路由
const routesConfig = {
  "version": 1,
  "include": [
    "/api/*"
  ],
  "exclude": [
    "/css/*",
    "/js/*",
    "/*.html",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.svg"
  ]
};

fs.writeFileSync('./public/_routes.json', JSON.stringify(routesConfig, null, 2));
console.log('已创建 _routes.json 配置文件');

console.log('Pages 项目构建完成！');
console.log('');
console.log('下一步:');
console.log('1. 运行 npm run pages:dev 进行本地开发');
console.log('2. 运行 npm run pages:deploy 部署到 Cloudflare Pages');