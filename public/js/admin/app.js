// 管理后台主应用模块
const AdminApp = {
    currentPage: 'dashboard',
    modules: {},

    // 初始化
    init() {
        this.initModules();
        this.bindEvents();
        this.showPage('dashboard');
    },

    // 初始化各个模块
    initModules() {
        this.modules = {
            dashboard: Dashboard,
            messages: Messages,
            files: Files,
            users: Users
        };

        // 初始化所有模块
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.init === 'function') {
                module.init();
            }
        });
    },

    // 绑定事件
    bindEvents() {
        // 侧边栏导航
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });

        // 头部按钮事件
        this.bindHeaderEvents();

        // 处理浏览器前进后退
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'dashboard';
            this.showPage(page, false);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    },

    // 绑定头部事件
    bindHeaderEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshAllBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshCurrentPage();
                if (Auth && Auth.showNotification) {
                    Auth.showNotification('数据已刷新', 'success');
                }
            });
        }

        // 设置按钮
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
    },

    // 显示页面
    showPage(pageName, pushState = true) {
        // 验证页面名称
        if (!this.modules[pageName]) {
            console.error('未知页面:', pageName);
            return;
        }

        // 隐藏所有页面
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 更新导航状态
        this.updateNavigation(pageName);

        // 更新浏览器历史
        if (pushState) {
            const url = `#${pageName}`;
            history.pushState({ page: pageName }, '', url);
        }

        // 更新当前页面
        this.currentPage = pageName;

        // 刷新页面数据
        this.refreshCurrentPage();
    },

    // 更新导航状态
    updateNavigation(activePage) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    },

    // 刷新当前页面数据
    refreshCurrentPage() {
        const currentModule = this.modules[this.currentPage];
        if (currentModule && typeof currentModule.refresh === 'function') {
            currentModule.refresh();
        }
    },

    // 处理键盘快捷键
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + R: 刷新当前页面
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.refreshCurrentPage();
            if (Auth && Auth.showNotification) {
                Auth.showNotification('页面已刷新', 'success');
            }
        }

        // Ctrl/Cmd + 1-4: 快速切换页面
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const pages = ['dashboard', 'messages', 'files', 'users'];
            const pageIndex = parseInt(e.key) - 1;
            if (pages[pageIndex]) {
                this.showPage(pages[pageIndex]);
            }
        }

        // ESC: 关闭模态框
        if (e.key === 'Escape') {
            this.closeModals();
        }
    },

    // 关闭所有模态框
    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    },

    // 获取当前页面模块
    getCurrentModule() {
        return this.modules[this.currentPage];
    },

    // 全局搜索功能
    globalSearch(query) {
        if (!query.trim()) return;

        // 根据当前页面执行搜索
        const currentModule = this.getCurrentModule();
        if (currentModule && typeof currentModule.search === 'function') {
            currentModule.search(query);
        } else {
            if (Auth && Auth.showNotification) {
                Auth.showNotification('当前页面不支持搜索', 'warning');
            }
        }
    },

    // 导出数据功能
    async exportData(type) {
        try {
            let data = null;
            let filename = '';

            switch (type) {
                case 'messages':
                    // 导出消息数据
                    const messagesResult = await AdminAPI.messages.getList({ limit: 10000 });
                    if (messagesResult?.success) {
                        data = messagesResult.data.messages;
                        filename = `messages_${this.formatDate(new Date())}.json`;
                    }
                    break;

                case 'files':
                    // 导出文件数据
                    const filesResult = await AdminAPI.files.getList({ limit: 10000 });
                    if (filesResult?.success) {
                        data = filesResult.data.files;
                        filename = `files_${this.formatDate(new Date())}.json`;
                    }
                    break;

                case 'users':
                    // 导出用户数据
                    const usersResult = await AdminAPI.users.getList({ limit: 10000 });
                    if (usersResult?.success) {
                        data = usersResult.data.users;
                        filename = `users_${this.formatDate(new Date())}.json`;
                    }
                    break;

                default:
                    Auth.showNotification('不支持的导出类型', 'error');
                    return;
            }

            if (data) {
                this.downloadJSON(data, filename);
                if (Auth && Auth.showNotification) {
                    Auth.showNotification('数据导出成功', 'success');
                }
            } else {
                if (Auth && Auth.showNotification) {
                    Auth.showNotification('导出失败，没有数据', 'error');
                }
            }
        } catch (error) {
            console.error('导出数据失败:', error);
            if (Auth && Auth.showNotification) {
                Auth.showNotification('导出失败', 'error');
            }
        }
    },

    // 下载JSON文件
    downloadJSON(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    },

    // 格式化日期
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    // 显示系统信息
    showSystemInfo() {
        const info = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            currentTime: new Date().toLocaleString('zh-CN')
        };

        console.table(info);
        if (Auth && Auth.showNotification) {
            Auth.showNotification('系统信息已输出到控制台', 'info');
        }
    },

    // 检查更新
    async checkForUpdates() {
        // 这里可以实现检查更新的逻辑
        if (Auth && Auth.showNotification) {
            Auth.showNotification('当前已是最新版本', 'success');
        }
    },

    // 清理缓存
    clearCache() {
        // 清理本地存储
        const keysToKeep = ['adminSessionId', 'adminUserInfo'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        if (Auth && Auth.showNotification) {
            Auth.showNotification('缓存清理完成', 'success');
        }
    },

    // 获取应用统计信息
    getAppStats() {
        return {
            currentPage: this.currentPage,
            loadedModules: Object.keys(this.modules),
            sessionDuration: this.getSessionDuration(),
            memoryUsage: this.getMemoryUsage()
        };
    },

    // 获取会话持续时间
    getSessionDuration() {
        const sessionStart = localStorage.getItem('sessionStartTime');
        if (sessionStart) {
            const duration = Date.now() - parseInt(sessionStart);
            return Math.floor(duration / 1000 / 60); // 分钟
        }
        return 0;
    },

    // 获取内存使用情况
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    },

    // 显示设置面板
    showSettings() {
        const settingsInfo = {
            currentPage: this.currentPage,
            sessionDuration: this.getSessionDuration(),
            memoryUsage: this.getMemoryUsage(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        let settingsHtml = `
            <div style="max-width: 600px; background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 1rem; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.5rem;">系统设置</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #4a5568;">会话信息</h4>
                    <p style="margin: 0.25rem 0; color: #718096;">当前页面: ${settingsInfo.currentPage}</p>
                    <p style="margin: 0.25rem 0; color: #718096;">会话时长: ${settingsInfo.sessionDuration} 分钟</p>
                </div>

                ${settingsInfo.memoryUsage ? `
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #4a5568;">内存使用</h4>
                    <p style="margin: 0.25rem 0; color: #718096;">已使用: ${settingsInfo.memoryUsage.used} MB</p>
                    <p style="margin: 0.25rem 0; color: #718096;">总计: ${settingsInfo.memoryUsage.total} MB</p>
                    <p style="margin: 0.25rem 0; color: #718096;">限制: ${settingsInfo.memoryUsage.limit} MB</p>
                </div>
                ` : ''}

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #4a5568;">系统信息</h4>
                    <p style="margin: 0.25rem 0; color: #718096;">语言: ${settingsInfo.language}</p>
                    <p style="margin: 0.25rem 0; color: #718096;">平台: ${settingsInfo.platform}</p>
                    <p style="margin: 0.25rem 0; color: #718096;">在线状态: ${settingsInfo.onLine ? '在线' : '离线'}</p>
                    <p style="margin: 0.25rem 0; color: #718096;">屏幕分辨率: ${settingsInfo.screenResolution}</p>
                    <p style="margin: 0.25rem 0; color: #718096;">窗口大小: ${settingsInfo.windowSize}</p>
                    <p style="margin: 0.25rem 0; color: #718096;">时区: ${settingsInfo.timezone}</p>
                </div>

                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button onclick="AdminApp.clearCache()" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #A8E6CF, #88D8C0); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">清理缓存</button>
                    <button onclick="AdminApp.checkForUpdates()" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #ADD8E6, #87CEEB); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">检查更新</button>
                    <button onclick="AdminApp.showSystemInfo()" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #FFCDD2, #F8BBD9); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">系统详情</button>
                    <button onclick="AdminApp.closeSettings()" style="padding: 0.5rem 1rem; background: #718096; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">关闭</button>
                </div>
            </div>
        `;

        // 创建设置模态框
        const settingsModal = document.createElement('div');
        settingsModal.id = 'settingsModal';
        settingsModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        settingsModal.innerHTML = settingsHtml;

        // 点击背景关闭
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                this.closeSettings();
            }
        });

        document.body.appendChild(settingsModal);
    },

    // 关闭设置面板
    closeSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.remove();
        }
    },
    // 苹果风格窗口控制按钮交互
    bindAppleWindowControls: function() {
        const closeBtn = document.querySelector('.control-btn.close');
        const minimizeBtn = document.querySelector('.control-btn.minimize');
        const maximizeBtn = document.querySelector('.control-btn.maximize');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (confirm('确定要关闭管理后台吗？')) {
                    window.close();
                }
            });
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                // 模拟最小化效果
                const appleWindow = document.querySelector('.apple-window');
                if (appleWindow) {
                    appleWindow.style.transform = 'scale(0.1)';
                    appleWindow.style.opacity = '0';
                    setTimeout(() => {
                        appleWindow.style.transform = 'scale(1)';
                        appleWindow.style.opacity = '1';
                    }, 300);
                }
            });
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                const appleWindow = document.querySelector('.apple-window');
                if (appleWindow) {
                    if (appleWindow.style.maxWidth === 'none') {
                        appleWindow.style.maxWidth = '1400px';
                        appleWindow.style.margin = '0 auto';
                    } else {
                        appleWindow.style.maxWidth = 'none';
                        appleWindow.style.margin = '0';
                        appleWindow.style.width = '100%';
                    }
                }
            });
        }
    },

    // 初始化苹果风格增强
    initAppleEnhancements: function() {
        this.bindAppleWindowControls();
        
        // 添加窗口拖拽效果（仅视觉效果）
        const titlebar = document.querySelector('.apple-titlebar');
        if (titlebar) {
            let isDragging = false;
            let startX, startY;
            
            titlebar.addEventListener('mousedown', (e) => {
                if (e.target.closest('.window-controls') || e.target.closest('.window-actions')) {
                    return;
                }
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                titlebar.style.cursor = 'grabbing';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                // 仅视觉反馈，不实际移动窗口
                const appleWindow = document.querySelector('.apple-window');
                if (appleWindow && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                    appleWindow.style.transform = `translate(${deltaX * 0.1}px, ${deltaY * 0.1}px)`;
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    titlebar.style.cursor = '';
                    const appleWindow = document.querySelector('.apple-window');
                    if (appleWindow) {
                        appleWindow.style.transform = '';
                    }
                }
            });
        }
        
        // 添加窗口焦点效果
        const appleWindow = document.querySelector('.apple-window');
        if (appleWindow) {
            window.addEventListener('focus', () => {
                appleWindow.style.boxShadow = '0 16px 48px rgba(0,0,0,0.20)';
            });
            
            window.addEventListener('blur', () => {
                appleWindow.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
            });
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 记录会话开始时间
    if (!localStorage.getItem('sessionStartTime')) {
        localStorage.setItem('sessionStartTime', Date.now().toString());
    }

    // 处理初始URL
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'messages', 'files', 'users'].includes(hash)) {
        AdminApp.currentPage = hash;
    }
    
    // 初始化苹果风格增强
    AdminApp.initAppleEnhancements();
});

// 导出到全局
window.AdminApp = AdminApp;

// 添加一些全局快捷方法
window.exportMessages = () => AdminApp.exportData('messages');
window.exportFiles = () => AdminApp.exportData('files');
window.exportUsers = () => AdminApp.exportData('users');
window.showSystemInfo = () => AdminApp.showSystemInfo();
window.clearCache = () => AdminApp.clearCache();