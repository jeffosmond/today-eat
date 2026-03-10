FROM maven:3.8.6-eclipse-temurin-8 AS builder

WORKDIR /app

# 复制 pom.xml 并下载依赖
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源代码并构建
COPY src ./src
RUN mvn clean package -DskipTests -B

# 运行阶段
FROM eclipse-temurin:8-jre

WORKDIR /app

# 安装必要工具
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制构建产物
COPY --from=builder /app/target/*.jar app.jar

# 创建上传和数据目录
RUN mkdir -p /app/uploads /app/data

# 暴露端口
EXPOSE 3001

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
