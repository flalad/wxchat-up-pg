# 超简单管理员设置指南

## 🚀 三步搞定管理员设置

### 第一步：设置环境变量
在 Cloudflare Pages 项目中设置以下环境变量：
```
ADMIN_USERNAME=你的管理员用户名
ADMIN_PASSWORD=你的安全密码
```

### 第二步：重新部署
点击重新部署按钮，让环境变量生效。

### 第三步：直接登录
访问 `/admin.html`，用你设置的用户名和密码直接登录即可！

## 🎯 就是这么简单！

- ✅ 不需要手动初始化
- ✅ 不需要调用特殊API
- ✅ 不需要复杂的设置步骤
- ✅ 系统会在首次登录时自动创建管理员账户

## 📝 Cloudflare Pages 环境变量设置方法

1. 登录 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 **Settings** → **Environment variables**
4. 添加变量：
   - 变量名：`ADMIN_USERNAME`，值：`你的用户名`
   - 变量名：`ADMIN_PASSWORD`，值：`你的密码`
5. 点击 **Save**
6. 重新部署项目

## 🔒 密码建议

- 至少 8 个字符
- 包含字母、数字和特殊字符
- 例如：`MyAdmin@2024!`

## 🛠️ 本地开发

在项目根目录创建 `.dev.vars` 文件：
```bash
ADMIN_USERNAME=local_admin
ADMIN_PASSWORD=LocalDev@2024!
```

## ❓ 常见问题

**Q: 忘记密码怎么办？**
A: 直接修改环境变量中的 `ADMIN_PASSWORD`，重新部署即可。

**Q: 想换管理员用户名？**
A: 修改环境变量中的 `ADMIN_USERNAME`，重新部署即可。

**Q: 登录提示用户名或密码错误？**
A: 检查环境变量是否正确设置，确保重新部署后再试。

---

**就是这么简单直接！不需要复杂的初始化流程。**