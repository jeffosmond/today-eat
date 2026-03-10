# 今天吃什么 - 家庭就餐菜品选择系统

一个有趣的老虎机风格随机选菜应用，帮助家庭解决"今天吃什么"的难题。

## 🎯 功能特点

- 🎰 **老虎机式随机**：拉动拉杆，随机选择菜品
- 📸 **图片裁剪压缩**：前端自动裁剪为 1:1 并压缩至 20KB
- 🍽️ **三餐支持**：早餐、午餐、晚餐分别管理
- 📅 **历史记录**：避免与过去 7 天重复
- ⚙️ **菜品管理**：上传菜品图片，分类管理

## 🏗️ 技术架构

```
today-eat/
├── front/          # React + Vite 前端
│   └── client/
├── end/            # Java 8 + Spring Boot 后端
│   └── src/
└── docker-compose.yml
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript |
| 后端 | Java 8 + Spring Boot 2.7 |
| 数据库 | MySQL 8.0 |
| 部署 | Docker + Docker Compose |

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

```bash
cd today-eat
docker-compose up -d
```

访问：http://localhost:3001

### 方式二：本地开发

**后端**:
```bash
cd end
mvn spring-boot:run
```

**前端**:
```bash
cd front/client
npm install
npm run dev
```

## 📸 图片处理

前端自动处理图片：
1. **裁剪**: 固定 1:1 正方形比例
2. **压缩**: 自动压缩至 20KB 以下
3. **格式**: 转换为 JPEG 格式

## 📋 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/dishes` | GET | 获取菜品列表 |
| `/api/dishes` | POST | 创建菜品 |
| `/api/dishes/{id}` | PUT | 更新菜品 |
| `/api/dishes/{id}` | DELETE | 删除菜品 |
| `/api/random/generate` | POST | 随机生成 |
| `/api/random/confirm` | POST | 确认保存 |

## 🔧 配置

### 环境变量

```bash
# 数据库配置
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/meal_planner
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your_password
```

## 📝 开发说明

### 前端图片裁剪

使用 `react-easy-crop` 实现：

```tsx
import ImageCropper from './components/ImageCropper';

<ImageCropper
  image={imageData}
  onCropComplete={handleCropComplete}
  onClose={() => setCroppingImage(null)}
/>
```

### 后端图片存储

图片以 Base64 形式存储在 MySQL 数据库：

```java
@Column(columnDefinition = "TEXT")
private String images; // JSON 数组
```

## 🐛 常见问题

**Q: 图片上传失败？**
A: 检查图片是否超过 5MB，确保已正确裁剪。

**Q: 数据库连接失败？**
A: 确保 MySQL 服务已启动，检查配置文件。

## 📄 License

MIT

---

**🎲 今天，你吃什么？**
