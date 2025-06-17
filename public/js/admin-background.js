// 后台管理界面简约清新渐变背景
// 基于提供的动态背景代码，去掉粒子效果，只保留纯净渐变

// 优化为更清晰的浅绿色到浅蓝色到浅粉色渐变色组
const gradients = [
  // 浅绿色渐变
  [
    {x:0.3, y:0.2, color:"#A8E6CF"},
    {x:0.7, y:0.8, color:"#88D8C0"},
    {x:0.1, y:0.9, color:"#B8F2E6"}
  ],
  // 浅蓝色渐变
  [
    {x:0.4, y:0.3, color:"#ADD8E6"},
    {x:0.8, y:0.7, color:"#87CEEB"},
    {x:0.2, y:0.1, color:"#C7E0F0"}
  ],
  // 浅粉色渐变
  [
    {x:0.6, y:0.4, color:"#FFCDD2"},
    {x:0.1, y:0.6, color:"#F8BBD9"},
    {x:0.9, y:0.2, color:"#FFE0E6"}
  ],
  // 浅紫色渐变
  [
    {x:0.2, y:0.3, color:"#E1BEE7"},
    {x:0.8, y:0.6, color:"#CE93D8"},
    {x:0.5, y:0.9, color:"#F3E5F5"}
  ],
  // 浅黄色渐变
  [
    {x:0.7, y:0.2, color:"#FFF9C4"},
    {x:0.3, y:0.7, color:"#F0F4C3"},
    {x:0.9, y:0.8, color:"#F9FBE7"}
  ]
];

let bg, bgCtx;
let w, h;

function initAdminBackground() {
  // 创建canvas元素
  bg = document.createElement('canvas');
  bg.id = 'admin-bg';
  
  // 设置样式
  bg.style.position = 'fixed';
  bg.style.top = '0';
  bg.style.left = '0';
  bg.style.width = '100vw';
  bg.style.height = '100vh';
  bg.style.display = 'block';
  bg.style.pointerEvents = 'none';
  bg.style.zIndex = '-1';
  
  // 添加到body
  document.body.appendChild(bg);
  
  bgCtx = bg.getContext('2d');
  
  updateCanvasSize();
  
  // 动态渐变背景 - 更慢更平滑的过渡
  let gradIndex = 0;
  let gradNext = 1;
  let gradTime = 0;
  const gradDuration = 8.0; // 更长的渐变切换时间，更加平缓
  
  function drawBgGradient(dt){
    gradTime += dt;
    let t = Math.min(gradTime/gradDuration,1);
    // 使用更平滑的缓动函数
    t = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep函数
    
    // 插值渐变
    let g1 = gradients[gradIndex], g2 = gradients[gradNext];
    let stops = [];
    for(let i=0;i<g1.length;i++){
      // 颜色插值
      let c1 = g1[i].color, c2 = g2[i].color;
      let rgb1 = c1.match(/\w\w/g).map(x=>parseInt(x,16));
      let rgb2 = c2.match(/\w\w/g).map(x=>parseInt(x,16));
      let rgb = rgb1.map((v,i)=>Math.round(v*(1-t)+rgb2[i]*t));
      stops.push({
        x: g1[i].x*(1-t)+g2[i].x*t, 
        y: g1[i].y*(1-t)+g2[i].y*t, 
        color: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
      });
    }
    
    // 绘制更大范围的径向渐变，非常缓慢的移动
    let centerX = w/2 + Math.sin(gradTime * 0.1) * w * 0.05;
    let centerY = h/2 + Math.cos(gradTime * 0.08) * h * 0.05;
    
    let grad = bgCtx.createRadialGradient(
      stops[0].x*w, stops[0].y*h, w*0.01,
      centerX, centerY, Math.max(w,h)*1.2
    );
    grad.addColorStop(0, stops[0].color);
    grad.addColorStop(0.5, stops[1].color);
    grad.addColorStop(1, stops[2].color);
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0,0,w,h);

    if(gradTime>=gradDuration){
      gradTime = 0;
      gradIndex = gradNext;
      gradNext = (gradNext+1)%gradients.length;
    }
  }

  // 动画循环
  let lastTime = performance.now();
  function animate(now){
    let dt = (now-lastTime)/1000;
    lastTime = now;
    
    drawBgGradient(dt);
    requestAnimationFrame(animate);
  }
  
  animate(performance.now());
}

function updateCanvasSize() {
  w = window.innerWidth;
  h = window.innerHeight;
  if (bg) {
    bg.width = w;
    bg.height = h;
  }
}

// 窗口大小改变时更新canvas尺寸
window.addEventListener('resize', updateCanvasSize);

// 页面加载完成后初始化背景
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminBackground);
} else {
  initAdminBackground();
}