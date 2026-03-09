import express from 'express';
import cors from 'cors';
import path from 'path';
import dishRoutes from './routes/dishes';
import randomRoutes from './routes/random';
import historyRoutes from './routes/history';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 上传文件服务（必须在前端路由之前）
const uploadsPath = path.join(__dirname, '../../uploads');
console.log('上传文件路径:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// 静态文件服务（前端构建产物）
const clientDistPath = path.join(__dirname, '../../client/dist');
console.log('前端文件路径:', clientDistPath);
app.use(express.static(clientDistPath));

// API 路由
app.use('/api/dishes', dishRoutes);
app.use('/api/random', randomRoutes);
app.use('/api/history', historyRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 前端路由 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️  家庭就餐菜品选择系统已启动`);
  console.log(`📍 服务端：http://localhost:${PORT}`);
  console.log(`📍 前端：http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('服务器错误:', err);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
