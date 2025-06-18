// 管理后台动态渐变背景
class AdminDynamicBackground {
    constructor() {
        this.colors = [
            "#ff3cac", "#784ba0", "#2b86c5", "#42e695", "#ffb300", "#ff6e7f", 
            "#bfe9ff", "#f9d423", "#e65c00", "#00eaff", "#ff00cc", "#3333ff", 
            "#00ffcc", "#ffcc00", "#ff0066", "#00ff99", "#6600ff", "#ff3300"
        ];

        // 优化为更清晰的浅色渐变色组
        this.gradients = [
            // 浅绿色渐变
            [
                {x: 0.3, y: 0.2, color: "#A8E6CF"},
                {x: 0.7, y: 0.8, color: "#88D8C0"},
                {x: 0.1, y: 0.9, color: "#B8F2E6"}
            ],
            // 浅蓝色渐变
            [
                {x: 0.4, y: 0.3, color: "#ADD8E6"},
                {x: 0.8, y: 0.7, color: "#87CEEB"},
                {x: 0.2, y: 0.1, color: "#C7E0F0"}
            ],
            // 浅粉色渐变
            [
                {x: 0.6, y: 0.4, color: "#FFCDD2"},
                {x: 0.1, y: 0.6, color: "#F8BBD9"},
                {x: 0.9, y: 0.2, color: "#FFE0E6"}
            ],
            // 浅紫色渐变
            [
                {x: 0.5, y: 0.5, color: "#E1BEE7"},
                {x: 0.2, y: 0.3, color: "#D1C4E9"},
                {x: 0.8, y: 0.7, color: "#F3E5F5"}
            ],
            // 浅橙色渐变
            [
                {x: 0.3, y: 0.7, color: "#FFE0B2"},
                {x: 0.7, y: 0.2, color: "#FFCC80"},
                {x: 0.5, y: 0.9, color: "#FFF3E0"}
            ]
        ];

        this.bgCanvas = null;
        this.effectCanvas = null;
        this.bgCtx = null;
        this.effectCtx = null;
        this.w = 0;
        this.h = 0;
        
        this.floatShapes = [];
        this.points = [];
        this.POINTS = 40; // 减少粒子数量以提升性能
        
        this.gradIndex = 0;
        this.gradNext = 1;
        this.gradTime = 0;
        this.gradDuration = 6.0;
        
        this.frameCount = 0;
        this.SKIP_CONNECTION_FRAMES = 3; // 跳帧优化
        
        this.lastTime = performance.now();
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.createCanvases();
        this.setupDimensions();
        this.createFloatShapes();
        this.createPoints();
        this.bindEvents();
        this.startAnimation();
    }

    createCanvases() {
        // 创建背景容器
        const backgroundContainer = document.createElement('div');
        backgroundContainer.className = 'dynamic-background';
        
        // 创建背景canvas
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.id = 'admin-bg-canvas';
        this.bgCtx = this.bgCanvas.getContext('2d');
        
        // 创建效果canvas
        this.effectCanvas = document.createElement('canvas');
        this.effectCanvas.id = 'admin-effect-canvas';
        this.effectCtx = this.effectCanvas.getContext('2d');
        
        backgroundContainer.appendChild(this.bgCanvas);
        backgroundContainer.appendChild(this.effectCanvas);
        
        // 插入到body的开头
        document.body.insertBefore(backgroundContainer, document.body.firstChild);
    }

    setupDimensions() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        
        this.bgCanvas.width = this.effectCanvas.width = this.w;
        this.bgCanvas.height = this.effectCanvas.height = this.h;
    }

    createFloatShapes() {
        this.floatShapes = [];
        for (let i = 0; i < 12; i++) { // 减少浮动形状数量
            this.floatShapes.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: 40 + Math.random() * 80,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                alpha: 0.04 + Math.random() * 0.06, // 降低透明度
                type: Math.random() > 0.5 ? 'ellipse' : 'rect',
                dx: (Math.random() - 0.5) * 0.2,
                dy: (Math.random() - 0.5) * 0.2,
                rot: Math.random() * Math.PI * 2,
                drot: (Math.random() - 0.5) * 0.001
            });
        }
    }

    createPoints() {
        this.points = [];
        for (let i = 0; i < this.POINTS; i++) {
            this.points.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: 1.5 + Math.random() * 2,
                shape: Math.random() < 0.7 ? 'circle' : (Math.random() < 0.5 ? 'triangle' : 'star')
            });
        }
    }

    drawPoint(p) {
        this.effectCtx.save();
        this.effectCtx.beginPath();
        this.effectCtx.fillStyle = p.color;
        this.effectCtx.globalAlpha = 0.8;
        
        if (p.shape === 'circle') {
            this.effectCtx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
            this.effectCtx.fill();
        } else if (p.shape === 'triangle') {
            this.effectCtx.translate(p.x, p.y);
            this.effectCtx.rotate(p.x / 100 + p.y / 100);
            this.effectCtx.moveTo(0, -p.size);
            this.effectCtx.lineTo(p.size, p.size);
            this.effectCtx.lineTo(-p.size, p.size);
            this.effectCtx.closePath();
            this.effectCtx.fill();
        } else if (p.shape === 'star') {
            this.effectCtx.translate(p.x, p.y);
            this.effectCtx.rotate(p.x / 100 - p.y / 100);
            for (let i = 0; i < 5; i++) {
                this.effectCtx.lineTo(
                    Math.cos((18 + i * 72) / 180 * Math.PI) * p.size,
                    -Math.sin((18 + i * 72) / 180 * Math.PI) * p.size
                );
                this.effectCtx.lineTo(
                    Math.cos((54 + i * 72) / 180 * Math.PI) * p.size * 0.5,
                    -Math.sin((54 + i * 72) / 180 * Math.PI) * p.size * 0.5
                );
            }
            this.effectCtx.closePath();
            this.effectCtx.fill();
        }
        
        this.effectCtx.restore();
    }

    drawLine(p1, p2) {
        this.effectCtx.save();
        this.effectCtx.globalAlpha = 0.1;
        this.effectCtx.strokeStyle = "#fff";
        this.effectCtx.lineWidth = 0.6;
        this.effectCtx.beginPath();
        this.effectCtx.moveTo(p1.x, p1.y);
        this.effectCtx.lineTo(p2.x, p2.y);
        this.effectCtx.stroke();
        this.effectCtx.restore();
    }

    drawBgGradient(dt) {
        this.gradTime += dt;
        let t = Math.min(this.gradTime / this.gradDuration, 1);
        
        // 使用更平滑的缓动函数
        t = t * t * t * (t * (t * 6 - 15) + 10);
        
        // 插值渐变
        let g1 = this.gradients[this.gradIndex];
        let g2 = this.gradients[this.gradNext];
        let stops = [];
        
        for (let i = 0; i < g1.length; i++) {
            // 颜色插值
            let c1 = g1[i].color;
            let c2 = g2[i].color;
            let rgb1 = c1.match(/\w\w/g).map(x => parseInt(x, 16));
            let rgb2 = c2.match(/\w\w/g).map(x => parseInt(x, 16));
            let rgb = rgb1.map((v, i) => Math.round(v * (1 - t) + rgb2[i] * t));
            
            stops.push({
                x: g1[i].x * (1 - t) + g2[i].x * t,
                y: g1[i].y * (1 - t) + g2[i].y * t,
                color: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
            });
        }
        
        // 绘制径向渐变
        let centerX = this.w / 2 + Math.sin(this.gradTime * 0.2) * this.w * 0.05;
        let centerY = this.h / 2 + Math.cos(this.gradTime * 0.15) * this.h * 0.05;
        
        let grad = this.bgCtx.createRadialGradient(
            stops[0].x * this.w, stops[0].y * this.h, this.w * 0.01,
            centerX, centerY, Math.max(this.w, this.h) * 1.1
        );
        
        grad.addColorStop(0, stops[0].color);
        grad.addColorStop(0.4, stops[1].color);
        grad.addColorStop(1, stops[2].color);
        
        this.bgCtx.fillStyle = grad;
        this.bgCtx.fillRect(0, 0, this.w, this.h);

        if (this.gradTime >= this.gradDuration) {
            this.gradTime = 0;
            this.gradIndex = this.gradNext;
            this.gradNext = (this.gradNext + 1) % this.gradients.length;
        }
    }

    animate(now) {
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.frameCount++;
        
        // 绘制背景渐变
        this.drawBgGradient(dt);
        
        // 清除效果层
        this.effectCtx.clearRect(0, 0, this.w, this.h);
        
        // 绘制浮动几何体
        for (let s of this.floatShapes) {
            this.effectCtx.save();
            this.effectCtx.globalAlpha = s.alpha;
            this.effectCtx.fillStyle = s.color;
            this.effectCtx.translate(s.x, s.y);
            this.effectCtx.rotate(s.rot);
            
            if (s.type === 'ellipse') {
                this.effectCtx.beginPath();
                this.effectCtx.ellipse(0, 0, s.size * 0.7, s.size, 0, 0, 2 * Math.PI);
                this.effectCtx.fill();
            } else {
                this.effectCtx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
            }
            
            this.effectCtx.restore();
            
            // 更新位置
            s.x += s.dx;
            s.y += s.dy;
            s.rot += s.drot;
            
            // 边界检查
            if (s.x < -150) s.x = this.w + 100;
            if (s.x > this.w + 150) s.x = -100;
            if (s.y < -150) s.y = this.h + 100;
            if (s.y > this.h + 150) s.y = -100;
        }
        
        // 绘制粒子点和连线
        for (let i = 0; i < this.POINTS; i++) {
            let p = this.points[i];
            
            // 绘制点
            this.drawPoint(p);
            
            // 性能优化：跳帧绘制连接线
            if (this.frameCount % this.SKIP_CONNECTION_FRAMES === 0) {
                let connectionCount = 0;
                const maxConnections = 2;
                
                for (let j = i + 1; j < this.POINTS && connectionCount < maxConnections; j++) {
                    let q = this.points[j];
                    let dx = p.x - q.x;
                    let dy = p.y - q.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 120) {
                        this.drawLine(p, q);
                        connectionCount++;
                    }
                }
            }
            
            // 更新位置
            p.x += p.vx;
            p.y += p.vy;
            
            // 边界反弹
            if (p.x < 0 || p.x > this.w) p.vx *= -1;
            if (p.y < 0 || p.y > this.h) p.vy *= -1;
        }
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    startAnimation() {
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.setupDimensions();
            // 重新创建粒子以适应新尺寸
            this.createFloatShapes();
            this.createPoints();
        });
        
        // 页面可见性变化时暂停/恢复动画
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAnimation();
            } else {
                this.lastTime = performance.now();
                this.startAnimation();
            }
        });
    }

    destroy() {
        this.stopAnimation();
        const backgroundContainer = document.querySelector('.dynamic-background');
        if (backgroundContainer) {
            backgroundContainer.remove();
        }
        
        window.removeEventListener('resize', this.bindEvents);
        document.removeEventListener('visibilitychange', this.bindEvents);
    }
}

// 自动初始化
let adminDynamicBg = null;

document.addEventListener('DOMContentLoaded', () => {
    // 检查是否在管理后台页面
    if (document.getElementById('adminApp') || document.querySelector('.admin-header')) {
        adminDynamicBg = new AdminDynamicBackground();
    }
});

// 导出到全局
window.AdminDynamicBackground = AdminDynamicBackground;
window.adminDynamicBg = adminDynamicBg;