// 管理后台文件管理模块
const Files = {
    currentPage: 1,
    pageSize: 20,
    totalPages: 0,
    selectedFiles: new Set(),
    filters: {
        search: '',
        mimeType: '',
        userId: ''
    },

    // 初始化
    init() {
        this.bindEvents();
        this.loadFiles();
    },

    // 绑定事件
    bindEvents() {
        // 搜索
        const searchInput = document.getElementById('fileSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadFiles();
            }, 500));
        }

        // 类型筛选
        const typeFilter = document.getElementById('fileTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filters.mimeType = typeFilter.value;
                this.currentPage = 1;
                this.loadFiles();
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refreshFiles');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refresh();
            });
        }

        // 全选复选框
        const selectAllCheckbox = document.getElementById('selectAllFiles');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // 批量删除按钮
        const batchDeleteBtn = document.getElementById('batchDeleteFiles');
        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', () => {
                this.batchDeleteFiles();
            });
        }
    },

    // 加载文件列表
    async loadFiles() {
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

            const result = await AdminAPI.files.getList(params);

            if (result && result.success) {
                this.renderFiles(result.data.files);
                this.renderPagination(result.data.pagination);
                this.updateStats(result.data.stats);
            } else {
                this.showError('加载文件失败');
            }
        } catch (error) {
            console.error('加载文件失败:', error);
            this.showError('加载文件失败');
        }
    },

    // 渲染文件列表
    renderFiles(files) {
        const tbody = document.querySelector('#filesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        this.selectedFiles.clear();
        this.updateBatchDeleteButton();

        if (!files || files.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <div class="icon">📁</div>
                        <p>暂无文件数据</p>
                    </td>
                </tr>
            `;
            return;
        }

        files.forEach(file => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="file-checkbox" data-file-id="${file.id}">
                </td>
                <td class="file-name">
                    ${this.renderFileName(file)}
                </td>
                <td>${this.formatFileSize(file.file_size)}</td>
                <td>
                    <span class="file-type-badge">${this.getFileTypeDisplay(file.mime_type)}</span>
                </td>
                <td>${this.escapeHtml(file.username || '未知用户')}</td>
                <td>${file.download_count || 0}</td>
                <td>${this.formatDateTime(file.created_at)}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="Files.downloadFile('${file.r2_key}', '${this.escapeHtml(file.original_name)}')">
                        下载
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Files.deleteFile(${file.id})">
                        删除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // 绑定复选框事件
        const checkboxes = tbody.querySelectorAll('.file-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const fileId = parseInt(e.target.dataset.fileId);
                if (e.target.checked) {
                    this.selectedFiles.add(fileId);
                } else {
                    this.selectedFiles.delete(fileId);
                }
                this.updateSelectAllCheckbox();
                this.updateBatchDeleteButton();
            });
        });
    },

    // 渲染文件名
    renderFileName(file) {
        const fileName = this.escapeHtml(file.original_name);
        const fileIcon = this.getFileIcon(file.mime_type);
        
        // 如果是图片，可以添加预览功能
        if (file.mime_type && file.mime_type.startsWith('image/')) {
            return `
                <div class="file-item">
                    <span class="file-icon">${fileIcon}</span>
                    <span class="file-name-text" title="${fileName}">${fileName}</span>
                    <span class="file-preview-badge">可预览</span>
                </div>
            `;
        }

        return `
            <div class="file-item">
                <span class="file-icon">${fileIcon}</span>
                <span class="file-name-text" title="${fileName}">${fileName}</span>
            </div>
        `;
    },

    // 获取文件图标
    getFileIcon(mimeType) {
        if (!mimeType) return '📄';
        
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
        if (mimeType.startsWith('text/')) return '📄';
        
        return '📄';
    },

    // 获取文件类型显示名称
    getFileTypeDisplay(mimeType) {
        if (!mimeType) return '未知';
        
        if (mimeType.startsWith('image/')) return '图片';
        if (mimeType.startsWith('video/')) return '视频';
        if (mimeType.startsWith('audio/')) return '音频';
        if (mimeType.includes('pdf')) return 'PDF';
        if (mimeType.includes('word')) return 'Word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPT';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '压缩包';
        if (mimeType.startsWith('text/')) return '文本';
        
        return '其他';
    },

    // 渲染分页
    renderPagination(pagination) {
        const container = document.getElementById('filesPagination');
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
                this.loadFiles();
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
                this.loadFiles();
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
                this.loadFiles();
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
        // 可以在页面上显示文件统计信息
        console.log('文件统计:', stats);
    },

    // 切换全选
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.file-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const fileId = parseInt(checkbox.dataset.fileId);
            if (checked) {
                this.selectedFiles.add(fileId);
            } else {
                this.selectedFiles.delete(fileId);
            }
        });
        this.updateBatchDeleteButton();
    },

    // 更新全选复选框状态
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllFiles');
        const checkboxes = document.querySelectorAll('.file-checkbox');
        
        if (checkboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (this.selectedFiles.size === checkboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (this.selectedFiles.size > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    },

    // 更新批量删除按钮状态
    updateBatchDeleteButton() {
        const batchDeleteBtn = document.getElementById('batchDeleteFiles');
        if (batchDeleteBtn) {
            batchDeleteBtn.disabled = this.selectedFiles.size === 0;
            batchDeleteBtn.textContent = `批量删除 (${this.selectedFiles.size})`;
        }
    },

    // 下载文件
    downloadFile(r2Key, fileName) {
        const downloadUrl = `/api/files/download/${r2Key}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // 删除文件
    async deleteFile(fileId) {
        const confirmed = await this.showConfirm(
            '确认删除',
            '确定要删除这个文件吗？此操作不可撤销。'
        );

        if (!confirmed) return;

        try {
            const result = await AdminAPI.files.delete(fileId);

            if (result && result.success) {
                Auth.showNotification('文件删除成功', 'success');
                this.loadFiles();
            } else {
                Auth.showNotification(result?.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除文件失败:', error);
            Auth.showNotification('删除失败', 'error');
        }
    },

    // 批量删除文件
    async batchDeleteFiles() {
        if (this.selectedFiles.size === 0) {
            Auth.showNotification('请选择要删除的文件', 'warning');
            return;
        }

        const confirmed = await this.showConfirm(
            '确认批量删除',
            `确定要删除选中的 ${this.selectedFiles.size} 个文件吗？此操作不可撤销。`
        );

        if (!confirmed) return;

        try {
            const fileIds = Array.from(this.selectedFiles);
            const result = await AdminAPI.files.batchDelete(fileIds);

            if (result && result.success) {
                Auth.showNotification(result.data.message, 'success');
                this.selectedFiles.clear();
                this.loadFiles();
            } else {
                Auth.showNotification(result?.error || '批量删除失败', 'error');
            }
        } catch (error) {
            console.error('批量删除文件失败:', error);
            Auth.showNotification('批量删除失败', 'error');
        }
    },

    // 显示加载状态
    showLoading() {
        const tbody = document.querySelector('#filesTable tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';
        }
    },

    // 显示错误
    showError(message) {
        const tbody = document.querySelector('#filesTable tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">❌ ${message}</td></tr>`;
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
        this.selectedFiles.clear();
        this.loadFiles();
    }
};

// 导出到全局
window.Files = Files;