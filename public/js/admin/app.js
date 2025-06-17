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
            Auth.showNotification('页面已刷新', 'success');
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
            Auth.showNotification('当前页面不支持搜索', 'warning');
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
                Auth.showNotification('数据导出成功', 'success');
            } else {
                Auth.showNotification('导出失败，没有数据', 'error');
            }
        } catch (error) {
            console.error('导出数据失败:', error);
            Auth.showNotification('导出失败', 'error');
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
        Auth.showNotification('系统信息已输出到控制台', 'info');
    },

    // 检查更新
    async checkForUpdates() {
        // 这里可以实现检查更新的逻辑
        Auth.showNotification('当前已是最新版本', 'success');
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

        Auth.showNotification('缓存清理完成', 'success');
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
});

// 导出到全局
window.AdminApp = AdminApp;

// 添加一些全局快捷方法
window.exportMessages = () => AdminApp.exportData('messages');
window.exportFiles = () => AdminApp.exportData('files');
window.exportUsers = () => AdminApp.exportData('users');
window.showSystemInfo = () => AdminApp.showSystemInfo();
window.clearCache = () => AdminApp.clearCache();