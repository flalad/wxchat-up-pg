// 管理后台仪表板模块
const Dashboard = {
    charts: {},

    // 初始化
    init() {
        this.loadData();
    },

    // 加载仪表板数据
    async loadData() {
        try {
            const result = await AdminAPI.dashboard.getData();
            
            if (result && result.success && result.data) {
                this.updateStats(result.data.totalStats || {});
                this.updateTodayStats(result.data.todayStats || {});
                this.createActivityChart(result.data.weeklyActivity || []);
                this.createFileTypeChart(result.data.fileTypes || []);
                this.updateRecentUsers(result.data.recentUsers || []);
                this.updateStorageInfo(result.data.storage || {});
                
                // 更新头部统计
                this.updateHeaderStats(result.data.totalStats || {});
            } else {
                console.error('仪表板数据获取失败:', result?.error || '未知错误');
                if (Auth && Auth.showNotification) {
                    Auth.showNotification(result?.error || '加载数据失败', 'error');
                }
                this.showEmptyState();
            }
        } catch (error) {
            console.error('加载仪表板数据失败:', error);
            if (Auth && Auth.showNotification) {
                Auth.showNotification('网络错误，请检查连接', 'error');
            }
            this.showEmptyState();
        }
    },

    // 更新统计数据
    updateStats(stats) {
        document.getElementById('totalUsers').textContent = stats.users || 0;
        document.getElementById('totalMessages').textContent = stats.messages || 0;
        document.getElementById('totalFiles').textContent = stats.files || 0;
        
        // 格式化存储大小
        const storageSize = this.formatFileSize(stats.fileSize || 0);
        document.getElementById('totalStorage').textContent = storageSize;
    },

    // 更新今日统计
    updateTodayStats(todayStats) {
        // 可以在统计卡片中添加今日数据的显示
        // 这里暂时不显示，可以根据需要扩展
    },

    // 创建活动统计图表
    createActivityChart(weeklyData) {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        // 销毁现有图表
        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        // 准备数据
        const labels = weeklyData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        });

        const messagesData = weeklyData.map(item => item.messages || 0);
        const filesData = weeklyData.map(item => item.files || 0);

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '文本消息',
                        data: messagesData,
                        borderColor: '#07c160',
                        backgroundColor: 'rgba(7, 193, 96, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '文件消息',
                        data: filesData,
                        borderColor: '#17a2b8',
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    // 创建文件类型分布图表
    createFileTypeChart(fileTypes) {
        const ctx = document.getElementById('fileTypeChart');
        if (!ctx) return;

        // 销毁现有图表
        if (this.charts.fileType) {
            this.charts.fileType.destroy();
        }

        // 准备数据
        const labels = fileTypes.map(item => item.file_type);
        const data = fileTypes.map(item => item.count);
        const colors = [
            '#07c160',
            '#17a2b8',
            '#ffc107',
            '#dc3545',
            '#6f42c1',
            '#fd7e14'
        ];

        this.charts.fileType = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    },

    // 更新最近用户列表
    updateRecentUsers(users) {
        const tbody = document.querySelector('#recentUsersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">暂无数据</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.formatDateTime(user.created_at)}</td>
                <td>${user.last_login ? this.formatDateTime(user.last_login) : '从未登录'}</td>
            `;
            tbody.appendChild(row);
        });
    },

    // 更新存储信息
    updateStorageInfo(storage) {
        if (!storage) return;

        // 可以在这里添加存储使用情况的可视化
        // 比如进度条或者饼图
        console.log('存储信息:', storage);
    },

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
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

    // 更新头部统计
    updateHeaderStats(stats) {
        const headerUserCount = document.getElementById('headerUserCount');
        const headerMessageCount = document.getElementById('headerMessageCount');
        const headerFileCount = document.getElementById('headerFileCount');
        
        if (headerUserCount) headerUserCount.textContent = stats.users || 0;
        if (headerMessageCount) headerMessageCount.textContent = stats.messages || 0;
        if (headerFileCount) headerFileCount.textContent = stats.files || 0;
    },

    // 显示空状态
    showEmptyState() {
        // 重置所有统计为0
        this.updateStats({ users: 0, messages: 0, files: 0, fileSize: 0 });
        this.updateHeaderStats({ users: 0, messages: 0, files: 0 });
        
        // 清空图表
        if (this.charts.activity) {
            this.charts.activity.destroy();
            this.charts.activity = null;
        }
        if (this.charts.fileType) {
            this.charts.fileType.destroy();
            this.charts.fileType = null;
        }
        
        // 显示空的用户列表
        this.updateRecentUsers([]);
    },

    // 刷新数据
    refresh() {
        this.loadData();
    }
};

// 导出到全局
window.Dashboard = Dashboard;