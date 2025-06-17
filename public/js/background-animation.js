// 动态背景动画控制器
class BackgroundAnimation {
    constructor() {
        this.container = document.querySelector('.animated-background');
        this.particles = [];
        this.maxParticles = 15;
        this.init();
    }

    init() {
        this.createAdditionalParticles();
        this.createFloatingElements();
        this.startAnimation();
    }

    // 创建额外的粒子
    createAdditionalParticles() {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle dynamic-particle';
            
            // 随机大小和颜色
            const size = Math.random() * 8 + 4;
            const colors = [
                'rgba(102, 126, 234, 0.7)',
                'rgba(118, 75, 162, 0.7)',
                'rgba(7, 193, 96, 0.7)',
                'rgba(255, 167, 38, 0.7)',
                'rgba(255, 99, 132, 0.7)'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = `radial-gradient(circle, ${color} 0%, ${color.replace('0.7', '0.2')} 100%)`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 10 + 20}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            this.container.appendChild(particle);
            this.particles.push(particle);
        }
    }

    // 创建浮动元素
    createFloatingElements() {
        // 创建更多光点
        for (let i = 0; i < 8; i++) {
            const dot = document.createElement('div');
            dot.className = 'light-dot dynamic-dot';
            dot.style.top = `${Math.random() * 100}%`;
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.animationDelay = `${Math.random() * 3}s`;
            this.container.appendChild(dot);
        }

        // 创建更多几何图形
        const shapes = ['triangle', 'square', 'circle'];
        for (let i = 0; i < 3; i++) {
            const shape = document.createElement('div');
            const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
            shape.className = `geometric-shape ${shapeType} dynamic-shape`;
            shape.style.top = `${Math.random() * 80}%`;
            shape.style.left = `${Math.random() * 80}%`;
            shape.style.animationDuration = `${Math.random() * 10 + 20}s`;
            shape.style.animationDelay = `${Math.random() * 5}s`;
            this.container.appendChild(shape);
        }
    }

    // 开始动画循环
    startAnimation() {
        this.animateElements();
        setInterval(() => {
            this.animateElements();
        }, 30000); // 每30秒重新动画
    }

    // 动画元素
    animateElements() {
        // 随机改变一些粒子的位置
        this.particles.forEach(particle => {
            if (Math.random() < 0.3) {
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.animationDuration = `${Math.random() * 10 + 20}s`;
            }
        });
    }

    // 鼠标交互效果
    addMouseInteraction() {
        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth;
            mouseY = e.clientY / window.innerHeight;

            // 根据鼠标位置调整背景渐变
            const gradient = `linear-gradient(${mouseX * 360}deg, 
                rgba(102, 126, 234, ${0.1 + mouseY * 0.1}) 0%, 
                rgba(118, 75, 162, ${0.1 + mouseX * 0.1}) 25%,
                rgba(255, 255, 255, 0.9) 50%,
                rgba(102, 126, 234, ${0.1 + mouseY * 0.1}) 75%,
                rgba(118, 75, 162, ${0.1 + mouseX * 0.1}) 100%
            )`;
            
            this.container.style.background = gradient;
        });
    }

    // 响应式调整
    handleResize() {
        window.addEventListener('resize', () => {
            // 重新计算粒子位置
            this.particles.forEach(particle => {
                if (window.innerWidth < 768) {
                    particle.style.transform = 'scale(0.7)';
                } else {
                    particle.style.transform = 'scale(1)';
                }
            });
        });
    }

    // 性能优化：减少动画在不可见时的运行
    handleVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.container.style.animationPlayState = 'paused';
                this.particles.forEach(particle => {
                    particle.style.animationPlayState = 'paused';
                });
            } else {
                this.container.style.animationPlayState = 'running';
                this.particles.forEach(particle => {
                    particle.style.animationPlayState = 'running';
                });
            }
        });
    }

    // 初始化所有功能
    initializeAll() {
        this.addMouseInteraction();
        this.handleResize();
        this.handleVisibility();
    }
}

// 添加动态粒子的CSS样式
const dynamicStyles = `
.dynamic-particle {
    animation: float 20s infinite linear;
}

.dynamic-dot {
    animation: twinkle 3s ease-in-out infinite;
}

.dynamic-shape {
    animation: rotate 20s linear infinite;
}

/* 鼠标悬停效果 */
.app:hover .animated-background {
    animation-duration: 10s;
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
    .animated-background {
        animation-duration: 20s;
    }
    
    .particle {
        animation-duration: 30s !important;
    }
}
`;

// 添加样式到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// 页面加载完成后初始化背景动画
document.addEventListener('DOMContentLoaded', () => {
    const bgAnimation = new BackgroundAnimation();
    bgAnimation.initializeAll();
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundAnimation;
}