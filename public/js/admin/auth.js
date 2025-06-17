// 管理后台认证模块
const Auth = {
    // 当前用户信息
    currentUser: null,
    sessionId: null,

    // 初始化
    init() {
        this.checkAuth();
        this.bindEvents();
    },

    // 绑定事件
    bindEvents() {
        // 登录表单
        document.getElementById('loginForm').addEventListener('submit', this.handleLogin.bind(this));
        
        // 注册表单
        document.getElementById('registerForm').addEventListener('submit', this.handleRegister.bind(this));
        
        // 切换登录/注册
        document.getElementById('showRegister').addEventListener('click', this.showRegisterForm.bind(this));
        document.getElementById('showLogin').addEventListener('click', this.showLoginForm.bind(this));
        
        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', this.handleLogout.bind(this));
    },

    // 检查认证状态
    checkAuth() {
        const sessionId = localStorage.getItem('adminSessionId');
        const userInfo = localStorage.getItem('adminUserInfo');
        
        if (sessionId && userInfo) {
            try {
                this.sessionId = sessionId;
                this.currentUser = JSON.parse(userInfo);
                this.showAdminApp();
            } catch (error) {
                console.error('解析用户信息失败:', error);
                this.showLoginModal();
            }
        } else {
            this.showLoginModal();
        }
    },

    // 处理登录
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        if (!username || !password) {
            this.showNotification('请填写用户名和密码', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                this.sessionId = result.data.sessionId;
                this.currentUser = result.data.user;
                
                // 保存到本地存储
                localStorage.setItem('adminSessionId', this.sessionId);
                localStorage.setItem('adminUserInfo', JSON.stringify(this.currentUser));
                
                this.showNotification('登录成功', 'success');
                this.showAdminApp();
            } else {
                this.showNotification(result.error || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showNotification('网络错误，请重试', 'error');
        }
    },

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');
        const email = formData.get('email');

        if (!username || !password) {
            this.showNotification('请填写用户名和密码', 'error');
            return;
        }

        if (username.length < 3) {
            this.showNotification('用户名长度不能少于3个字符', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('密码长度不能少于6个字符', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('注册成功，请登录', 'success');
                this.showLoginForm();
                
                // 清空注册表单
                document.getElementById('registerForm').reset();
            } else {
                this.showNotification(result.error || '注册失败', 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showNotification('网络错误，请重试', 'error');
        }
    },

    // 处理退出登录
    handleLogout() {
        // 清除本地存储
        localStorage.removeItem('adminSessionId');
        localStorage.removeItem('adminUserInfo');
        
        // 重置状态
        this.sessionId = null;
        this.currentUser = null;
        
        this.showNotification('已退出登录', 'success');
        this.showLoginModal();
    },

    // 显示登录模态框
    showLoginModal() {
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('adminApp').style.display = 'none';
        this.showLoginForm();
    },

    // 显示管理后台
    showAdminApp() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('adminApp').style.display = 'block';
        
        // 更新用户信息显示
        document.getElementById('currentUser').textContent = this.currentUser.username;
        
        // 检查是否为管理员
        if (this.currentUser.role !== 'admin') {
            this.showNotification('权限不足，需要管理员权限', 'error');
            this.handleLogout();
            return;
        }
        
        // 初始化管理后台
        if (window.AdminApp) {
            window.AdminApp.init();
        }
    },

    // 显示登录表单
    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').reset();
    },

    // 显示注册表单
    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('registerForm').reset();
    },

    // 获取认证头
    getAuthHeader() {
        return this.sessionId ? `Bearer ${this.sessionId}` : null;
    },

    // 检查是否已认证
    isAuthenticated() {
        return !!this.sessionId && !!this.currentUser;
    },

    // 检查是否为管理员
    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin';
    },

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notifications');
        container.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// 导出到全局
window.Auth = Auth;