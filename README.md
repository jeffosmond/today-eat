# 家庭就餐菜品选择系统 🎰

> 今天吃什么？让老虎机帮你决定！

## 快速启动

### 方式一：Docker（推荐）

```bash
# 构建镜像
docker build -t meal-planner .

# 运行容器
docker run -d -p 3001:3001 \
  -v meal-data:/app/data \
  -v meal-uploads:/app/uploads \
  --name meal-planner \
  meal-planner
```

### 方式二：本地开发

```bash
# 安装依赖
npm install

# 初始化数据库
cd server
npx prisma migrate dev
npx prisma generate
cd ..

# 启动开发服务
npm run dev
```

访问 http://localhost:3001

## 功能特性

- 🎰 老虎机随机选择菜品
- 🍽️ 支持早餐/午餐/晚餐
- 📋 菜品管理后台
- 💾 每日记录保存
- 🐳 Docker 一键部署

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + Prisma
- **数据库**: SQLite
- **部署**: Docker

## 使用说明

1. 首次使用先进入"菜品管理"添加菜品
2. 返回首页选择餐次（早餐/午餐/晚餐）
3. 点击"拉动拉杆"开始随机
4. 再次点击停止，查看结果
5. 点击"确认保存"记录今日菜单

---

**版本**: v1.0.0 MVP  
**开发**: 小迪 🤖
