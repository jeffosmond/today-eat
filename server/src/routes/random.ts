import { Router } from 'express';
import prisma from '../db';

const router = Router();

// 随机辅助函数
function randomPick<T>(array: T[]): T | null {
  if (array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// 检查结果是否在 7 天内重复
function isDuplicateWithinWeek(existingRecords: any[], newResult: { drinkId: number | null; stapleId: number | null; dishId: number | null }): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentRecords = existingRecords.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= sevenDaysAgo;
  });
  
  for (const record of recentRecords) {
    const sameDrink = record.drinkId === newResult.drinkId;
    const sameStaple = record.stapleId === newResult.stapleId;
    const sameDish = record.dishId === newResult.dishId;
    
    if (sameDrink && sameStaple && sameDish) {
      return true;
    }
  }
  
  return false;
}

// 生成随机结果（带重试机制）
router.post('/generate', async (req, res) => {
  try {
    const { mealType } = req.body;
    
    if (!mealType) {
      return res.status(400).json({ error: '请指定餐次' });
    }
    
    // 获取过去 7 天的记录
    const existingRecords = await prisma.record.findMany({
      where: {
        mealType,
      },
      orderBy: { date: 'desc' },
    });
    
    // 查询各类型启用的菜品
    const getDishesByType = async (type: string) => {
      return await prisma.dish.findMany({
        where: { type, enabled: true, mealTags: { contains: `"${mealType}"` } },
      });
    };
    
    const [drinks, staples, dishes] = await Promise.all([
      getDishesByType('drink'),
      getDishesByType('staple'),
      getDishesByType('dish'),
    ]);
    
    // 查找"研究新品"
    const researchDrink = drinks.find(d => d.name.includes('研究新品'));
    const researchStaple = staples.find(d => d.name.includes('研究新品'));
    const researchDish = dishes.find(d => d.name.includes('研究新品'));
    
    let result: { drink: any; staple: any; dish: any } | null = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    // 尝试生成不重复的结果
    while (attempts < maxAttempts && !result) {
      const randomDrink = randomPick(drinks);
      const randomStaple = randomPick(staples);
      const randomDish = randomPick(dishes);
      
      // 先检查是否有"研究新品"，如果有，全部设置为研究新品
      let candidate: { drink: any; staple: any; dish: any };
      const hasResearch = randomDrink?.name?.includes('研究新品') ||
                         randomStaple?.name?.includes('研究新品') ||
                         randomDish?.name?.includes('研究新品');
      
      if (hasResearch && researchDrink && researchStaple && researchDish) {
        // 有研究新品，全部设置为研究新品
        candidate = {
          drink: researchDrink,
          staple: researchStaple,
          dish: researchDish,
        };
      } else {
        // 没有研究新品，使用随机结果
        candidate = {
          drink: randomDrink,
          staple: randomStaple,
          dish: randomDish,
        };
      }
      
      // 检查是否重复（研究新品不检查重复）
      const isDup = !hasResearch && isDuplicateWithinWeek(existingRecords, {
        drinkId: candidate.drink?.id || null,
        stapleId: candidate.staple?.id || null,
        dishId: candidate.dish?.id || null,
      });
      
      if (!isDup) {
        result = candidate;
      }
      
      attempts++;
    }
    
    // 如果所有尝试都重复，返回最后一次结果（会触发前端提示）
    if (!result) {
      result = {
        drink: randomPick(drinks),
        staple: randomPick(staples),
        dish: randomPick(dishes),
      };
      
      // 检查是否有研究新品
      const hasResearch = result.drink?.name?.includes('研究新品') ||
                         result.staple?.name?.includes('研究新品') ||
                         result.dish?.name?.includes('研究新品');
      
      if (hasResearch) {
        result = {
          drink: researchDrink || result.drink,
          staple: researchStaple || result.staple,
          dish: researchDish || result.dish,
        };
      }
    }
    
    // 解析 JSON 字段
    const parseDish = (d: any) => d ? {
      ...d,
      images: JSON.parse(d.images || '[]'),
      mealTags: JSON.parse(d.mealTags || '[]'),
    } : null;
    
    const finalResult = {
      drink: parseDish(result.drink),
      staple: parseDish(result.staple),
      dish: parseDish(result.dish),
      isDuplicate: attempts >= maxAttempts, // 标记是否可能重复
    };
    
    res.json(finalResult);
  } catch (error) {
    console.error('生成随机结果失败:', error);
    res.status(500).json({ error: '生成随机结果失败' });
  }
});

// 获取今日随机记录
router.get('/today', async (req, res) => {
  try {
    const { mealType } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    const where: any = { date: today };
    if (mealType) {
      where.mealType = mealType;
    }
    
    const records = await prisma.record.findMany({
      where,
      include: {
        drink: true,
        staple: true,
        dish: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 解析 JSON 字段
    const parsed = records.map(r => ({
      ...r,
      drink: r.drink ? { ...r.drink, images: JSON.parse(r.drink.images || '[]'), mealTags: JSON.parse(r.drink.mealTags || '[]') } : null,
      staple: r.staple ? { ...r.staple, images: JSON.parse(r.staple.images || '[]'), mealTags: JSON.parse(r.staple.mealTags || '[]') } : null,
      dish: r.dish ? { ...r.dish, images: JSON.parse(r.dish.images || '[]'), mealTags: JSON.parse(r.dish.mealTags || '[]') } : null,
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error('获取今日记录失败:', error);
    res.status(500).json({ error: '获取今日记录失败' });
  }
});

// 获取历史记录（按天分组）
router.get('/history', async (req, res) => {
  try {
    const { mealType, limit = 30 } = req.query;
    
    const where: any = {};
    if (mealType) {
      where.mealType = mealType;
    }
    
    const records = await prisma.record.findMany({
      where,
      take: parseInt(limit as string),
      include: {
        drink: true,
        staple: true,
        dish: true,
      },
      orderBy: { date: 'desc' },
    });
    
    res.json(records);
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

// 确认保存随机结果
router.post('/confirm', async (req, res) => {
  try {
    const { drinkId, stapleId, dishId, mealType, force } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // 检查该餐次今日是否已有记录
    const existing = await prisma.record.findUnique({
      where: {
        date_mealType: {
          date: today,
          mealType,
        },
      },
    });
    
    if (existing && !force) {
      return res.status(409).json({ error: '该餐次今日已有记录，请确认是否覆盖' });
    }
    
    let record;
    
    if (existing) {
      // 覆盖已有记录
      record = await prisma.record.update({
        where: { id: existing.id },
        data: {
          drinkId,
          stapleId,
          dishId,
          confirmed: true,
          updatedAt: new Date(),
        },
        include: {
          drink: true,
          staple: true,
          dish: true,
        },
      });
    } else {
      // 创建新记录
      record = await prisma.record.create({
        data: {
          drinkId,
          stapleId,
          dishId,
          date: today,
          mealType,
          confirmed: true,
        },
        include: {
          drink: true,
          staple: true,
          dish: true,
        },
      });
    }
    
    res.json(record);
  } catch (error: any) {
    console.error('保存随机结果失败:', error);
    res.status(500).json({ error: '保存随机结果失败' });
  }
});

export default router;
