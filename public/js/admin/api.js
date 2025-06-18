// 管理后台API模块
const AdminAPI = {
    // 基础请求方法
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // 添加认证头
        if (Auth.isAuthenticated()) {
            defaultOptions.headers['Authorization'] = Auth.getAuthHeader();
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            // 检查响应状态
            if (!response.ok) {
                if (response.status === 401) {
                    Auth.showNotification('会话已过期，请重新登录', 'error');
                    Auth.handleLogout();
                    return { success: false, error: '会话已过期' };
                }
                
                if (response.status === 403) {
                    Auth.showNotification('权限不足', 'error');
                    return { success: false, error: '权限不足' };
                }
                
                if (response.status === 404) {
                    return { success: false, error: '请求的资源不存在' };
                }
                
                if (response.status >= 500) {
                    Auth.showNotification('服务器错误，请稍后重试', 'error');
                    return { success: false, error: '服务器错误' };
                }
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                Auth.showNotification('网络连接失败，请检查网络', 'error');
                return { success: false, error: '网络连接失败' };
            }
            
            Auth.showNotification('请求失败，请重试', 'error');
            return { success: false, error: '请求失败' };
        }
    },

    // GET请求
    async get(url, params = {}) {
        const urlParams = new URLSearchParams(params);
        const fullUrl = urlParams.toString() ? `${url}?${urlParams}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    // POST请求
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT请求
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE请求
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    },

    // 仪表板API
    dashboard: {
        async getData() {
            return AdminAPI.get('/api/admin/dashboard');
        }
    },

    // 消息管理API
    messages: {
        async getList(params = {}) {
            return AdminAPI.get('/api/admin/messages', params);
        },

        async delete(messageId) {
            return AdminAPI.delete(`/api/admin/messages/${messageId}`);
        }
    },

    // 文件管理API
    files: {
        async getList(params = {}) {
            return AdminAPI.get('/api/admin/files', params);
        },

        async delete(fileId) {
            return AdminAPI.delete(`/api/admin/files/${fileId}`);
        },

        async batchDelete(fileIds) {
            return AdminAPI.post('/api/admin/files', { fileIds });
        }
    },

    // 用户管理API
    users: {
        async getList(params = {}) {
            return AdminAPI.get('/api/admin/users', params);
        },

        async update(userId, data) {
            return AdminAPI.put(`/api/admin/users/${userId}`, data);
        },

        async delete(userId) {
            return AdminAPI.delete(`/api/admin/users/${userId}`);
        }
    }
};

// 导出到全局
window.AdminAPI = AdminAPI;