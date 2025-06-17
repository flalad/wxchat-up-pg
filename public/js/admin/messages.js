// 管理后台消息管理模块
const Messages = {
    currentPage: 1,
    pageSize: 20,
    totalPages: 0,
    filters: {
        search: '',
        type: '',
        userId: ''
    },

    // 初始化
    init() {
        this.bindEvents();
        this.loadMessages();
    },

    // 绑定事件
    bindEvents() {
        // 搜索
        const searchInput = document.getElementById('messageSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadMessages();
            }, 500));
        }

        // 类型筛选
        const typeFilter = document.getElementById('messageTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filters.type = typeFilter.value;
                this.currentPage = 1;
                this.loadMessages();
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refreshMessages');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refresh();
            });
        }
    },

    // 加载消息列表
    async loadMessages() {
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

            const result = await AdminAPI.messages.getList(params);

            if (result && result.success) {
                this.renderMessages(result.data.messages);
                this.renderPagination(result.data.pagination);
            } else {
                this.showError('加载消息失败');
            }
        } catch (error) {
            console.error('加载消息失败:', error);
            this.showError('加载消息失败');
        }
    },

    // 渲染消息列表
    renderMessages(messages) {
        const tbody = document.querySelector('#messagesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!messages || messages.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="icon">💬</div>
                        <p>暂无消息数据</p>
                    </td>
                </tr>
            `;
            return;
        }

        messages.forEach(message => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${message.id}</td>
                <td>
                    <span class="status-badge ${message.type === 'text' ? 'status-active' : 'role-admin'}">
                        ${message.type === 'text' ? '文本' : '文件'}
                    </span>
                </td>
                <td class="message-content">
                    ${this.renderMessageContent(message)}
                </td>
                <td>${this.escapeHtml(message.username || '未知用户')}</td>
                <td>${this.escapeHtml(message.device_id || '')}</td>
                <td>${this.formatDateTime(message.created_at)}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-danger" onclick="Messages.deleteMessage(${message.id})">
                        删除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    // 渲染消息内容
    renderMessageContent(message) {
        if (message.type === 'text') {
            const content = this.escapeHtml(message.content || '');
            return content.length > 50 ? content.substring(0, 50) + '...' : content;
        } else if (message.type === 'file') {
            const fileName = this.escapeHtml(message.original_name || '未知文件');
            const fileSize = this.formatFileSize(message.file_size || 0);
            return `📁 ${fileName} (${fileSize})`;
        }
        return '';
    },

    // 渲染分页
    renderPagination(pagination) {
        const container = document.getElementById('messagesPagination');
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
                this.loadMessages();
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
                this.loadMessages();
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
                this.loadMessages();
            }
        });
        container.appendChild(nextBtn);

        // 页面信息
        const info = document.createElement('span');
        info.textContent = `第 ${pagination.page} 页，共 ${pagination.totalPages} 页，总计 ${pagination.total} 条`;
        info.style.marginLeft = '1rem';
        container.appendChild(info);
    },

    // 删除消息
    async deleteMessage(messageId) {
        try {
            const result = await AdminAPI.messages.delete(messageId);

            if (result && result.success) {
                Auth.showNotification('消息删除成功', 'success');
                this.loadMessages();
            } else {
                Auth.showNotification(result?.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除消息失败:', error);
            Auth.showNotification('删除失败', 'error');
        }
    },

    // 显示加载状态
    showLoading() {
        const tbody = document.querySelector('#messagesTable tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">加载中...</td></tr>';
        }
    },

    // 显示错误
    showError(message) {
        const tbody = document.querySelector('#messagesTable tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">❌ ${message}</td></tr>`;
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

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        this.loadMessages();
    }
};

// 导出到全局
window.Messages = Messages;