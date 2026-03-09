import { Router } from 'express';
import prisma from '../db';

const router = Router();

// 获取历史记录（按天分组）
router.get('/', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    
    const records = await prisma.record.findMany({
      take: parseInt(limit as string),
      include: {
        drink: true,
        staple: true,
        dish: true,
      },
      orderBy: { date: 'desc' },
    });
    
    // 按天分组
    const grouped: Record<string, any[]> = {};
    records.forEach(record => {
      if (!grouped[record.date]) {
        grouped[record.date] = [];
      }
      grouped[record.date].push(record);
    });
    
    res.json(grouped);
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

// 获取指定日期记录
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const records = await prisma.record.findMany({
      where: { date },
      include: {
        drink: true,
        staple: true,
        dish: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(records);
  } catch (error) {
    console.error('获取日期记录失败:', error);
    res.status(500).json({ error: '获取日期记录失败' });
  }
});

// 删除记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.record.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除记录失败:', error);
    res.status(500).json({ error: '删除记录失败' });
  }
});

export default router;
