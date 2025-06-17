// 管理员登录按钮处理
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            // 跳转到管理后台页面
            window.location.href = '/admin.html';
        });
    }
});
// 应用主入口文件

class WeChatApp {
    constructor() {
        this.isInitialized = false;
        this.deviceId = null;
    }
    
    // 初始化应用
    async init() {
        try {
            console.log('🚀 微信文件传输助手启动中...');
            
            // 检查浏览器兼容性
            this.checkBrowserCompatibility();
            
            // 初始化设备ID
            this.deviceId = Utils.getDeviceId();
            console.log('📱 设备ID:', this.deviceId);
            
            // 延迟请求通知权限，避免在页面加载时弹窗
            // Utils.requestNotificationPermission() 将在用户首次交互时调用
            
            // 初始化各个模块
            UI.init();
            
            // 确保 FileUpload 已定义
            if (typeof FileUpload !== 'undefined') {
                FileUpload.init();
            } else {
                console.warn('⚠️ FileUpload 模块未加载，文件上传功能可能不可用');
            }

            // 设置初始连接状态
            UI.setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');

            MessageHandler.init();

            // 标记为已初始化
            this.isInitialized = true;

            console.log('✅ 应用初始化完成');
            
            // 显示欢迎消息
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.showInitError(error);
        }
    }
    
    // 检查浏览器兼容性
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'fetch',
            'localStorage',
            'FormData',
            'FileReader'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            return !(feature in window);
        });
        
        if (missingFeatures.length > 0) {
            throw new Error(`浏览器不支持以下功能: ${missingFeatures.join(', ')}`);
        }
        
        // 检查ES6支持
        try {
            eval('const test = () => {};');
        } catch (e) {
            throw new Error('浏览器不支持ES6语法，请使用现代浏览器');
        }
        
        console.log('✅ 浏览器兼容性检查通过');
    }
    
    // 显示欢迎消息
    showWelcomeMessage() {
        const isFirstTime = !localStorage.getItem('hasVisited');
        
        if (isFirstTime) {
            localStorage.setItem('hasVisited', 'true');
            
            setTimeout(() => {
                Utils.showNotification('欢迎使用微信文件传输助手！', 'info');
            }, 1000);
        }
    }
    
    // 显示初始化错误
    showInitError(error) {
        const errorMessage = `
            <div style="text-align: center; padding: 2rem; color: #ff4757;">
                <h2>😵 应用启动失败</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="
                    background: #07c160; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    margin-top: 1rem;
                ">
                    🔄 重新加载
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }
    
    // 获取应用状态
    getStatus() {
        return {
            initialized: this.isInitialized,
            deviceId: this.deviceId,
            online: navigator.onLine,
            timestamp: new Date().toISOString()
        };
    }
    
    // 重启应用
    restart() {
        console.log('🔄 重启应用...');
        location.reload();
    }
    
    // 清理应用数据
    clearData() {
        localStorage.clear();
        console.log('🗑️ 本地数据已清除');
        this.restart();
    }
}

// 创建应用实例
const app = new WeChatApp();

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    Utils.showNotification('应用发生错误，请刷新页面重试', 'error');
});

// 未处理的Promise错误
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
    Utils.showNotification('网络请求失败，请检查网络连接', 'error');
});

// 导出到全局作用域（用于调试）
window.WeChatApp = app;
if (typeof CONFIG !== 'undefined') window.CONFIG = CONFIG;
if (typeof Utils !== 'undefined') window.Utils = Utils;
if (typeof API !== 'undefined') window.API = API;
if (typeof UI !== 'undefined') window.UI = UI;
if (typeof FileUpload !== 'undefined') window.FileUpload = FileUpload;
if (typeof MessageHandler !== 'undefined') window.MessageHandler = MessageHandler;

// 开发模式下的调试信息
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('🔧 开发模式已启用');
    const availableObjects = { WeChatApp: app };
    if (typeof CONFIG !== 'undefined') availableObjects.CONFIG = CONFIG;
    if (typeof Utils !== 'undefined') availableObjects.Utils = Utils;
    if (typeof API !== 'undefined') availableObjects.API = API;
    if (typeof UI !== 'undefined') availableObjects.UI = UI;
    if (typeof FileUpload !== 'undefined') availableObjects.FileUpload = FileUpload;
    if (typeof MessageHandler !== 'undefined') availableObjects.MessageHandler = MessageHandler;
    
    console.log('可用的全局对象:', availableObjects);
}
