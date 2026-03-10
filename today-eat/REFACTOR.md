# 今天吃什么 - 项目重构说明

## 重构概述

将原 Node.js 后端重构为 Java 8 + Spring Boot + MySQL 架构，前端增加图片裁剪压缩功能。

## 目录结构

```
today-eat/
├── front/              # 前端代码 (React + Vite)
│   └── client/
│       ├── src/
│       ├── package.json
│       └── ...
├── end/                # 后端代码 (Java 8 + Spring Boot)
│   ├── src/main/java/com/todayeat/
│   │   ├── controller/    # REST 控制器
│   │   ├── service/       # 业务逻辑
│   │   ├── repository/    # 数据访问层
│   │   ├── entity/        # JPA 实体
│   │   ├── dto/           # 数据传输对象
│   │   └── config/        # 配置类
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── ...
│   ├── pom.xml
│   └── Dockerfile
├── docker-compose.yml   # Docker 编排 (MySQL + App)
├── deploy.sh           # 部署脚本
└── README.md           # 项目说明
```

## 技术栈变更

### 后端
| 原技术 | 新技术 |
|--------|--------|
| Node.js 20 | Java 8 |
| Express | Spring Boot 2.7.18 |
| SQLite (Prisma) | MySQL 8.0 |
| sharp (图片处理) | Thumbnailator |

### 前端
| 新增功能 | 实现方式 |
|----------|----------|
| 图片裁剪 | react-easy-crop |
| 图片压缩 | browser-image-compression |
| 裁剪比例 | 固定 1:1 正方形 |
| 压缩目标 | ≤20KB |

## 主要变更

### 1. 前端图片处理

**位置**: `front/client/src/utils/imageUtils.ts`

```typescript
// 裁剪为 1:1 并压缩至 20KB
export async function cropAndCompressImage(
  file: File,
  crop: { x: number; y: number; width: number }
): Promise<Blob>
```

**使用流程**:
1. 用户选择图片
2. 弹出裁剪框（1:1 正方形）
3. 前端裁剪并压缩至≤20KB
4. 上传到后端

### 2. 后端图片存储

**变更**: 图片不再保存文件，而是将 Base64 数据直接存储到 MySQL 数据库

**实体类**: `end/src/main/java/com/todayeat/entity/Dish.java`
```java
@Column(columnDefinition = "TEXT")
private String images; // JSON 数组存储图片 Base64 数据
```

### 3. API 接口保持不变

所有 API 接口与原版保持一致，前端无需大量修改：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/dishes` | GET | 获取菜品列表 |
| `/api/dishes` | POST | 创建菜品 |
| `/api/dishes/{id}` | PUT | 更新菜品 |
| `/api/dishes/{id}` | DELETE | 删除菜品 |
| `/api/random/generate` | POST | 随机生成 |
| `/api/random/confirm` | POST | 确认保存 |
| `/api/random/today` | GET | 获取今日记录 |

## 部署方式

### Docker 部署（推荐）

```bash
cd today-eat
docker-compose up -d
```

服务地址：
- 应用：http://localhost:3001
- MySQL: localhost:3306
- H2 控制台：http://localhost:3001/h2-console (仅开发环境)

### 手动部署

**后端**:
```bash
cd end
mvn clean package
java -jar target/*.jar
```

**前端**:
```bash
cd front/client
npm install
npm run build
```

## 数据库配置

### MySQL (生产)
```properties
spring.datasource.url=jdbc:mysql://mysql:3306/meal_planner
spring.datasource.username=root
spring.datasource.password=mealplanner123
```

### H2 (开发)
```properties
spring.datasource.url=jdbc:h2:mem:meal_planner
spring.h2.console.enabled=true
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SPRING_PROFILES_ACTIVE` | 运行环境 | `prod` |
| `SPRING_DATASOURCE_URL` | 数据库 URL | - |
| `SPRING_DATASOURCE_USERNAME` | 数据库用户名 | - |
| `SPRING_DATASOURCE_PASSWORD` | 数据库密码 | - |

## 注意事项

1. **图片大小**: 前端压缩至 20KB 以下，确保快速加载
2. **裁剪比例**: 固定 1:1 正方形，保证显示一致性
3. **数据库迁移**: 从 SQLite 迁移到 MySQL 需要导出数据并导入
4. **Java 版本**: 必须使用 Java 8

## 下一步

- [ ] 完成前端图片裁剪 UI 集成
- [ ] 测试完整流程
- [ ] 更新 GitHub 仓库
- [ ] 编写 API 文档
