import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db';

const router = Router();

// 配置文件上传
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'dish-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件：jpeg, jpg, png, gif, webp'));
    }
  },
});

// 获取菜品列表
router.get('/', async (req, res) => {
  try {
    const { type, mealTag, enabled } = req.query;
    
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (mealTag) {
      where.mealTags = { contains: `"${mealTag}"` };
    }
    
    if (enabled !== undefined) {
      where.enabled = enabled === 'true';
    }
    
    const dishes = await prisma.dish.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    
    // 解析 JSON 字段
    const parsed = dishes.map(d => ({
      ...d,
      images: JSON.parse(d.images as string),
      mealTags: JSON.parse(d.mealTags as string),
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error('获取菜品列表失败:', error);
    res.status(500).json({ error: '获取菜品列表失败' });
  }
});

// 获取菜品详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const dish = await prisma.dish.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    
    res.json({
      ...dish,
      images: JSON.parse(dish.images as string),
      mealTags: JSON.parse(dish.mealTags as string),
    });
  } catch (error) {
    console.error('获取菜品详情失败:', error);
    res.status(500).json({ error: '获取菜品详情失败' });
  }
});

// 创建菜品（支持图片上传）
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { name, duration, type, mealTags, sortOrder = 0 } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: '菜品名称和类型为必填项' });
    }
    
    // 处理上传的图片
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/${file.filename}`);
      });
    }
    
    // 解析 mealTags
    let parsedMealTags: string[] = [];
    if (mealTags) {
      if (typeof mealTags === 'string') {
        try {
          parsedMealTags = JSON.parse(mealTags);
        } catch {
          parsedMealTags = [mealTags];
        }
      } else if (Array.isArray(mealTags)) {
        parsedMealTags = mealTags;
      }
    }
    
    const dish = await prisma.dish.create({
      data: {
        name,
        images: JSON.stringify(imageUrls),
        duration: duration ? parseInt(duration) : null,
        type,
        mealTags: JSON.stringify(parsedMealTags),
        sortOrder,
      },
    });
    
    res.status(201).json({
      ...dish,
      images: JSON.parse(dish.images as string),
      mealTags: JSON.parse(dish.mealTags as string),
    });
  } catch (error: any) {
    console.error('创建菜品失败:', error);
    res.status(500).json({ error: '创建菜品失败：' + error.message });
  }
});

// 更新菜品
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, images, duration, type, mealTags, sortOrder, enabled } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (images !== undefined) {
      updateData.images = JSON.stringify(typeof images === 'string' ? [images] : images);
    }
    if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
    if (type !== undefined) updateData.type = type;
    if (mealTags !== undefined) {
      updateData.mealTags = JSON.stringify(Array.isArray(mealTags) ? mealTags : [mealTags]);
    }
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (enabled !== undefined) updateData.enabled = enabled;
    
    // 处理新上传的图片（追加到现有图片）
    if (req.files && Array.isArray(req.files)) {
      let existingImages: string[] = [];
      try {
        existingImages = typeof images === 'string' ? JSON.parse(images) : (images || []);
      } catch {
        existingImages = images ? [images] : [];
      }
      req.files.forEach(file => {
        existingImages.push(`/uploads/${file.filename}`);
      });
      updateData.images = JSON.stringify(existingImages);
    }
    
    // 解析 mealTags
    if (mealTags !== undefined) {
      let parsedMealTags: string[] = [];
      if (typeof mealTags === 'string') {
        try {
          parsedMealTags = JSON.parse(mealTags);
        } catch {
          parsedMealTags = [mealTags];
        }
      } else if (Array.isArray(mealTags)) {
        parsedMealTags = mealTags;
      }
      updateData.mealTags = JSON.stringify(parsedMealTags);
    }
    
    const dish = await prisma.dish.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    
    res.json({
      ...dish,
      images: JSON.parse(dish.images as string),
      mealTags: JSON.parse(dish.mealTags as string),
    });
  } catch (error: any) {
    console.error('更新菜品失败:', error);
    res.status(500).json({ error: '更新菜品失败：' + error.message });
  }
});

// 删除菜品
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.dish.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除菜品失败:', error);
    res.status(500).json({ error: '删除菜品失败' });
  }
});

// 切换菜品启用状态
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const dish = await prisma.dish.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    
    const updated = await prisma.dish.update({
      where: { id: parseInt(id) },
      data: { enabled: !dish.enabled },
    });
    
    res.json({
      ...updated,
      images: JSON.parse(updated.images as string),
      mealTags: JSON.parse(updated.mealTags as string),
    });
  } catch (error) {
    console.error('切换菜品状态失败:', error);
    res.status(500).json({ error: '切换菜品状态失败' });
  }
});

export default router;
