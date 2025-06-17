// 管理后台用户管理模块
const Users = {
    currentPage: 1,
    pageSize: 20,
    totalPages: 0,
    filters: {
        search: '',
        role: '',
        isActive: ''
    },

    // 初始化
    init() {
        this.bindEvents();
        // 延迟加载用户数据，避免在页面未完全加载时触发
        setTimeout(() => {
            this.loadUsers();
        }, 100);
    },

    // 绑定事件
    bindEvents() {
        // 搜索
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadUsers();
            }, 500));
        }

        // 角色筛选
        const roleFilter = document.getElementById('userRoleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', () => {
                this.filters.role = roleFilter.value;
                this.currentPage = 1;
                this.loadUsers();
            });
        }

        // 状态筛选
        const statusFilter = document.getElementById('userStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.isActive = statusFilter.value;
                this.currentPage = 1;
                this.loadUsers();
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refreshUsers');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refresh();
            });
        }
    },

    // 加载用户列表
    async loadUsers() {
        try {
            this.showLoading();

            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                ...this.filters
            };

            // 移除空值
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const result = await AdminAPI.users.getList(params);

            if (result && result.success) {
                this.renderUsers(result.data.users);
                this.renderPagination(result.data.pagination);
                this.updateStats(result.data.stats);
            } else {
                this.showError('加载用户失败');
            }
        } catch (error) {
            console.error('加载用户失败:', error);
            this.showError('加载用户失败');
        }
    },

    // 渲染用户列表
    renderUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <div class="icon">👥</div>
                        <p>暂无用户数据</p>
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.escapeHtml(user.email || '未设置')}</td>
                <td>
                    <span class="status-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}">
                        ${user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        ${user.is_active ? '活跃' : '禁用'}
                    </span>
                </td>
                <td>${user.message_count || 0}</td>
                <td>${user.file_count || 0}</td>
                <td>${this.formatDateTime(user.created_at)}</td>
                <td>${user.last_login ? this.formatDateTime(user.last_login) : '从未登录'}</td>
                <td class="table-actions">
                    ${this.renderUserActions(user)}
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    // 渲染用户操作按钮
    renderUserActions(user) {
        const currentUserId = Auth.currentUser?.id;
        const isCurrentUser = user.id == currentUserId;
        
        let actions = [];

        // 状态切换按钮
        if (!isCurrentUser) {
            if (user.is_active) {
                actions.push(`
                    <button class="btn btn-sm btn-outline" onclick="Users.toggleUserStatus(${user.id}, false)">
                        禁用
                    </button>
                `);
            } else {
                actions.push(`
                    <button class="btn btn-sm btn-primary" onclick="Users.toggleUserStatus(${user.id}, true)">
                        启用
                    </button>
                `);
            }
        }

        // 角色切换按钮
        if (!isCurrentUser) {
            if (user.role === 'user') {
                actions.push(`
                    <button class="btn btn-sm btn-outline" onclick="Users.toggleUserRole(${user.id}, 'admin')">
                        设为管理员
                    </button>
                `);
            } else {
                actions.push(`
                    <button class="btn btn-sm btn-outline" onclick="Users.toggleUserRole(${user.id}, 'user')">
                        设为普通用户
                    </button>
                `);
            }
        }

        // 删除按钮
        if (!isCurrentUser) {
            actions.push(`
                <button class="btn btn-sm btn-danger" onclick="Users.deleteUser(${user.id})">
                    删除
                </button>
            `);
        }

        // 查看详情按钮
        actions.push(`
            <button class="btn btn-sm btn-outline" onclick="Users.viewUserDetails(${user.id})">
                详情
            </button>
        `);

        return actions.join('');
    },

    // 渲染分页
    renderPagination(pagination) {
        const container = document.getElementById('usersPagination');
        if (!container) return;

        this.totalPages = pagination.totalPages;
        this.currentPage = pagination.page;

        container.innerHTML = '';

        if (pagination.totalPages <= 1) return;

        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一页';
        prevBtn.disabled = pagination.page <= 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadUsers();
            }
        });
        container.appendChild(prevBtn);

        // 页码按钮
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.totalPages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === pagination.page ? 'current' : '';
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadUsers();
            });
            container.appendChild(pageBtn);
        }

        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页';
        nextBtn.disabled = pagination.page >= pagination.totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadUsers();
            }
        });
        container.appendChild(nextBtn);

        // 页面信息
        const info = document.createElement('span');
        info.textContent = `第 ${pagination.page} 页，共 ${pagination.totalPages} 页，总计 ${pagination.total} 条`;
        info.style.marginLeft = '1rem';
        container.appendChild(info);
    },

    // 更新统计信息
    updateStats(stats) {
        // 可以在页面上显示用户统计信息
        console.log('用户统计:', stats);
    },

    // 切换用户状态
    async toggleUserStatus(userId, isActive) {
        const action = isActive ? '启用' : '禁用';

        try {
            const result = await AdminAPI.users.update(userId, { isActive });

            if (result && result.success) {
                Auth.showNotification(`用户${action}成功`, 'success');
                this.loadUsers();
            } else {
                Auth.showNotification(result?.error || `${action}失败`, 'error');
            }
        } catch (error) {
            console.error(`${action}用户失败:`, error);
            Auth.showNotification(`${action}失败`, 'error');
        }
    },

    // 切换用户角色
    async toggleUserRole(userId, role) {
        try {
            const result = await AdminAPI.users.update(userId, { role });

            if (result && result.success) {
                Auth.showNotification('用户角色修改成功', 'success');
                this.loadUsers();
            } else {
                Auth.showNotification(result?.error || '角色修改失败', 'error');
            }
        } catch (error) {
            console.error('修改用户角色失败:', error);
            Auth.showNotification('角色修改失败', 'error');
        }
    },

    // 删除用户
    async deleteUser(userId) {
        try {
            const result = await AdminAPI.users.delete(userId);

            if (result && result.success) {
                Auth.showNotification('用户删除成功', 'success');
                this.loadUsers();
            } else {
                Auth.showNotification(result?.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            Auth.showNotification('删除失败', 'error');
        }
    },

    // 查看用户详情
    viewUserDetails(userId) {
        // 这里可以实现用户详情查看功能
        // 比如显示用户的详细信息、活动记录等
        Auth.showNotification('用户详情功能待实现', 'info');
    },

    // 显示加载状态
    showLoading() {
        const tbody = document.querySelector('#usersTable tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="loading">加载中...</td></tr>';
        }
    },

    // 显示错误
    showError(message) {
        const tbody = document.querySelector('#usersTable tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10" class="empty-state">❌ ${message}</td></tr>`;
        }
    },

    // 确认对话框
    showConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const messageEl = document.getElementById('confirmMessage');
            const cancelBtn = document.getElementById('confirmCancel');
            const okBtn = document.getElementById('confirmOk');

            // 检查元素是否存在
            if (!modal || !titleEl || !messageEl || !cancelBtn || !okBtn) {
                console.error('确认对话框元素未找到');
                resolve(false);
                return;
            }

            titleEl.textContent = title;
            messageEl.textContent = message;
            modal.style.display = 'flex';

            const cleanup = () => {
                modal.style.display = 'none';
                cancelBtn.removeEventListener('click', handleCancel);
                okBtn.removeEventListener('click', handleOk);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const handleOk = () => {
                cleanup();
                resolve(true);
            };

            cancelBtn.addEventListener('click', handleCancel);
            okBtn.addEventListener('click', handleOk);
        });
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 格式化日期时间
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 刷新数据
    refresh() {
        this.currentPage = 1;
        this.loadUsers();
    }
};

// 导出到全局
window.Users = Users;