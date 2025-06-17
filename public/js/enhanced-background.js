// 增强的动态背景动画控制器
class EnhancedBackgroundAnimation {
    constructor() {
        this.container = document.querySelector('.animated-background');
        this.spheres = [];
        this.particles = [];
        this.rays = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        this.setupMouseTracking();
        this.createInteractiveElements();
        this.startAnimationLoop();
        this.handleVisibility();
        this.handleResize();
    }

    // 鼠标跟踪
    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX / window.innerWidth;
            this.mouseY = e.clientY / window.innerHeight;
            this.updateMouseEffects();
        });
    }

    // 根据鼠标位置更新效果
    updateMouseEffects() {
        // 更新渐变球体位置
        const spheres = document.querySelectorAll('.gradient-sphere');
        spheres.forEach((sphere, index) => {
            const factor = (index + 1) * 0.1;
            const offsetX = (this.mouseX - 0.5) * 50 * factor;
            const offsetY = (this.mouseY - 0.5) * 50 * factor;
            
            sphere.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });

        // 更新背景渐变
        const hue1 = 220 + (this.mouseX * 60);
        const hue2 = 280 + (this.mouseY * 60);
        const hue3 = 320 + (this.mouseX * this.mouseY * 40);
        
        this.container.style.background = `
            linear-gradient(135deg, 
                hsl(${hue1}, 70%, 60%) 0%, 
                hsl(${hue2}, 65%, 55%) 25%, 
                hsl(${hue3}, 75%, 65%) 50%, 
                hsl(${hue1 + 40}, 70%, 60%) 75%, 
                hsl(${hue2 + 20}, 65%, 55%) 100%)
        `;
    }

    // 创建交互元素
    createInteractiveElements() {
        this.createFloatingOrbs();
        this.createSparkles();
        this.createWaveEffect();
    }

    // 创建浮动光球
    createFloatingOrbs() {
        for (let i = 0; i < 8; i++) {
            const orb = document.createElement('div');
            orb.className = 'floating-orb';
            orb.style.cssText = `
                position: absolute;
                width: ${Math.random() * 20 + 10}px;
                height: ${Math.random() * 20 + 10}px;
                border-radius: 50%;
                background: radial-gradient(circle, 
                    rgba(255, 255, 255, 0.8) 0%, 
                    rgba(255, 255, 255, 0.2) 70%);
                filter: blur(2px);
                pointer-events: none;
                animation: orbFloat ${Math.random() * 10 + 15}s infinite ease-in-out;
                animation-delay: ${Math.random() * 5}s;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            this.container.appendChild(orb);
        }
    }

    // 创建闪烁星光
    createSparkles() {
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: white;
                border-radius: 50%;
                pointer-events: none;
                animation: sparkleAnimation ${Math.random() * 3 + 2}s infinite ease-in-out;
                animation-delay: ${Math.random() * 3}s;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
            `;
            this.container.appendChild(sparkle);
        }
    }

    // 创建波浪效果
    createWaveEffect() {
        const wave = document.createElement('div');
        wave.className = 'wave-effect';
        wave.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100px;
            background: linear-gradient(to top, 
                rgba(255, 255, 255, 0.1) 0%, 
                rgba(255, 255, 255, 0.05) 50%, 
                transparent 100%);
            animation: waveMove 8s infinite ease-in-out;
        `;
        this.container.appendChild(wave);
    }

    // 动画循环
    startAnimationLoop() {
        const animate = () => {
            this.updateParticlePositions();
            this.updateSphereRotations();
            requestAnimationFrame(animate);
        };
        animate();
    }

    // 更新粒子位置
    updateParticlePositions() {
        const particles = document.querySelectorAll('.floating-particles .particle');
        particles.forEach((particle, index) => {
            const time = Date.now() * 0.001;
            const offsetX = Math.sin(time + index) * 10;
            const offsetY = Math.cos(time + index * 0.5) * 5;
            
            particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });
    }

    // 更新球体旋转
    updateSphereRotations() {
        const spheres = document.querySelectorAll('.gradient-sphere');
        spheres.forEach((sphere, index) => {
            const time = Date.now() * 0.0005;
            const rotation = time * (index + 1) * 10;
            const scale = 1 + Math.sin(time + index) * 0.1;
            
            sphere.style.transform += ` rotate(${rotation}deg) scale(${scale})`;
        });
    }

    // 处理页面可见性
    handleVisibility() {
        document.addEventListener('visibilitychange', () => {
            const spheres = document.querySelectorAll('.gradient-sphere');
            const particles = document.querySelectorAll('.particle');
            
            if (document.hidden) {
                spheres.forEach(sphere => {
                    sphere.style.animationPlayState = 'paused';
                });
                particles.forEach(particle => {
                    particle.style.animationPlayState = 'paused';
                });
            } else {
                spheres.forEach(sphere => {
                    sphere.style.animationPlayState = 'running';
                });
                particles.forEach(particle => {
                    particle.style.animationPlayState = 'running';
                });
            }
        });
    }

    // 处理窗口大小变化
    handleResize() {
        window.addEventListener('resize', () => {
            // 重新计算元素位置
            const orbs = document.querySelectorAll('.floating-orb');
            orbs.forEach(orb => {
                orb.style.left = Math.random() * 100 + '%';
                orb.style.top = Math.random() * 100 + '%';
            });
        });
    }
}

// 添加CSS动画
const enhancedStyles = `
@keyframes orbFloat {
    0%, 100% {
        transform: translateY(0px) translateX(0px);
        opacity: 0.7;
    }
    25% {
        transform: translateY(-30px) translateX(20px);
        opacity: 1;
    }
    50% {
        transform: translateY(-10px) translateX(-25px);
        opacity: 0.8;
    }
    75% {
        transform: translateY(-40px) translateX(15px);
        opacity: 0.9;
    }
}

@keyframes sparkleAnimation {
    0%, 100% {
        opacity: 0;
        transform: scale(0);
    }
    50% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes waveMove {
    0%, 100% {
        transform: translateX(0px);
    }
    50% {
        transform: translateX(-50px);
    }
}

/* 鼠标悬停效果 */
.window-container:hover .gradient-sphere {
    animation-duration: 15s;
}

.window-container:hover .floating-particles .particle {
    animation-duration: 20s;
}

/* 性能优化 */
.gradient-sphere,
.floating-orb,
.sparkle {
    will-change: transform;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .floating-orb,
    .sparkle {
        display: none;
    }
    
    .gradient-sphere {
        filter: blur(30px);
    }
}

/* 减少动画强度选项 */
@media (prefers-reduced-motion: reduce) {
    .gradient-sphere,
    .floating-orb,
    .sparkle,
    .particle {
        animation-duration: 30s !important;
    }
}
`;

// 添加样式到页面
const enhancedStyleSheet = document.createElement('style');
enhancedStyleSheet.textContent = enhancedStyles;
document.head.appendChild(enhancedStyleSheet);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const enhancedBg = new EnhancedBackgroundAnimation();
    
    // 导出到全局作用域以供调试
    window.EnhancedBackgroundAnimation = enhancedBg;
});

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedBackgroundAnimation;
}