import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

interface Dish {
  id: number;
  name: string;
  images: string[];
  type: string;
}

interface RandomResult {
  drink: Dish | null;
  staple: Dish | null;
  dish: Dish | null;
}

function App() {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [result, setResult] = useState<RandomResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const [stopped, setStopped] = useState({ drink: false, staple: false, dish: false });
  const [displayItems, setDisplayItems] = useState<RandomResult>({ drink: null, staple: null, dish: null });
  const [history, setHistory] = useState<any[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [randomDate, setRandomDate] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const mealLabels = {
    breakfast: '🌅 早餐',
    lunch: '☀️ 午餐',
    dinner: '🌙 晚餐',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 加载今日记录
  useEffect(() => {
    loadTodayRecord();
  }, [mealType]);

  const loadTodayRecord = async () => {
    try {
      const res = await axios.get(`${API_BASE}/random/today?mealType=${mealType}`);
      if (res.data.length > 0) {
        const record = res.data[0];
        setResult({
          drink: record.drink,
          staple: record.staple,
          dish: record.dish,
        });
        setDisplayItems({
          drink: record.drink,
          staple: record.staple,
          dish: record.dish,
        });
        setRandomDate(record.date);
      } else {
        setRandomDate(null);
      }
    } catch (e) {
      console.error('加载记录失败', e);
    }
  };

  const generateRandom = async () => {
    if (!rolling) {
      // 开始滚动
      setRolling(true);
      setStopped({ drink: false, staple: false, dish: false });
      setIsDuplicate(false);
      
      try {
        const res = await axios.post(`${API_BASE}/random/generate`, { mealType });
        const newResult = res.data;
        
        // 检查是否重复
        if (newResult.isDuplicate) {
          setIsDuplicate(true);
        }
        
        // 滚动动画期间快速切换显示
        let iterations = 0;
        const maxIterations = 20;
        const interval = setInterval(async () => {
          iterations++;
          if (iterations >= maxIterations) {
            clearInterval(interval);
            // 停止动画
            stopRolling(newResult);
          } else {
            // 快速闪现随机菜品
            setDisplayItems({
              drink: Math.random() > 0.3 ? newResult.drink : null,
              staple: Math.random() > 0.3 ? newResult.staple : null,
              dish: Math.random() > 0.3 ? newResult.dish : null,
            });
          }
        }, 100);
      } catch (e) {
        console.error('生成失败', e);
        setRolling(false);
      }
    }
  };

  const stopRolling = async (finalResult: any) => {
    // 依次停止
    setTimeout(() => {
      setStopped(s => ({ ...s, drink: true }));
      setDisplayItems(d => ({ ...d, drink: finalResult.drink }));
    }, 0);

    setTimeout(() => {
      setStopped(s => ({ ...s, staple: true }));
      setDisplayItems(d => ({ ...d, staple: finalResult.staple }));
    }, 1000);

    setTimeout(() => {
      setStopped(s => ({ ...s, dish: true }));
      setDisplayItems(d => ({ ...d, dish: finalResult.dish }));
      setRolling(false);
      setResult(finalResult);
      
      // 如果重复，提示用户
      if (finalResult.isDuplicate) {
        setTimeout(() => {
          if (confirm('⚠️ 该结果与过去 7 天内的记录重复！\n\n点击"确定"重新随机，点击"取消"保留当前结果。')) {
            generateRandom();
          }
        }, 500);
      }
    }, 2000);
  };

  const confirmResult = async () => {
    if (!result) return;
    
    try {
      await axios.post(`${API_BASE}/random/confirm`, {
        drinkId: result.drink?.id,
        stapleId: result.staple?.id,
        dishId: result.dish?.id,
        mealType,
      });
      alert('✅ 已保存今日菜单！');
      loadTodayRecord();
    } catch (e: any) {
      if (e.response?.data?.error?.includes('覆盖')) {
        if (confirm('⚠️ 该餐次今日已有记录，是否覆盖？')) {
          // 强制覆盖
          await axios.post(`${API_BASE}/random/confirm`, {
            drinkId: result.drink?.id,
            stapleId: result.staple?.id,
            dishId: result.dish?.id,
            mealType,
            force: true,
          });
          alert('✅ 已覆盖今日菜单！');
          loadTodayRecord();
        }
      } else {
        alert('保存失败');
      }
    }
  };

  const SlotWindow = ({ type, item, isStopped }: { type: string; item: Dish | null; isStopped: boolean }) => (
    <div className="slot-window">
      <div className="slot-label">
        {type === 'drink' ? '🥤 饮品' : type === 'staple' ? '🍚 主食' : '🥗 菜肴'}
      </div>
      <div className="slot-content">
        {rolling && !isStopped ? (
          <div className="slot-rolling">🎲</div>
        ) : item ? (
          <div className="slot-item">
            {item.images?.[0] ? (
              <img src={item.images[0]} alt={item.name} className="slot-image" />
            ) : (
              <div className="slot-no-image">❓</div>
            )}
            <div className="slot-name">{item.name}</div>
          </div>
        ) : (
          <div className="slot-bomb">💣</div>
        )}
      </div>
    </div>
  );

  if (showManage) {
    return <DishManagement onBack={() => setShowManage(false)} />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎰 今天吃什么？</h1>
        <button className="btn-manage" onClick={() => setShowManage(true)}>
          ⚙️ 菜品管理
        </button>
      </header>

      <div className="meal-selector">
        {(['breakfast', 'lunch', 'dinner'] as const).map(type => (
          <button
            key={type}
            className={`meal-btn ${mealType === type ? 'active' : ''}`}
            onClick={() => setMealType(type)}
          >
            {mealLabels[type]}
          </button>
        ))}
      </div>

      <div className="slot-machine">
        <SlotWindow type="drink" item={displayItems.drink} isStopped={stopped.drink} />
        <SlotWindow type="staple" item={displayItems.staple} isStopped={stopped.staple} />
        <SlotWindow type="dish" item={displayItems.dish} isStopped={stopped.dish} />
      </div>

      <div className="controls">
        <button
          className="btn-roll"
          onClick={generateRandom}
        >
          {rolling ? '🎲 滚动中...' : '🎰 拉动拉杆'}
        </button>

        {result && !rolling && stopped.dish && (
          <button
            className="btn-confirm"
            onClick={confirmResult}
          >
            ✅ 确认保存
          </button>
        )}
      </div>

      {result && (
        <div className="result-preview">
          <h3>📋 {randomDate ? `${formatDate(randomDate)} (${randomDate})` : '当前选择'}：</h3>
          <p>
            {result.drink?.name || '💣'} - {result.staple?.name || '💣'} - {result.dish?.name || '💣'}
          </p>
          {isDuplicate && <p className="duplicate-warning">⚠️ 与过去 7 天内记录重复</p>}
        </div>
      )}
    </div>
  );
}

// 菜品管理组件
function DishManagement({ onBack }: { onBack: () => void }) {
  const [dishes, setDishes] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    type: 'dish',
    mealTags: [] as string[],
    duration: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    loadDishes();
  }, []);

  const loadDishes = async () => {
    const res = await axios.get(`${API_BASE}/dishes`);
    setDishes(res.data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
      // 创建预览
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('type', form.type);
      formData.append('mealTags', JSON.stringify(form.mealTags));
      if (form.duration) {
        formData.append('duration', form.duration);
      }
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      await axios.post(`${API_BASE}/dishes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('✅ 菜品添加成功！');
      setForm({ name: '', type: 'dish', mealTags: [], duration: '' });
      setImageFiles([]);
      setImagePreviews([]);
      loadDishes();
    } catch (error: any) {
      alert('❌ 添加失败：' + (error.response?.data?.error || error.message));
    }
  };

  const toggleMealTag = (tag: string) => {
    setForm(f => ({
      ...f,
      mealTags: f.mealTags.includes(tag)
        ? f.mealTags.filter(t => t !== tag)
        : [...f.mealTags, tag],
    }));
  };

  const deleteDish = async (id: number) => {
    if (confirm('确定删除？')) {
      await axios.delete(`${API_BASE}/dishes/${id}`);
      loadDishes();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <button className="btn-back" onClick={onBack}>← 返回</button>
        <h1>⚙️ 菜品管理</h1>
      </header>

      <form className="dish-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="菜品名称"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
        >
          <option value="drink">🥤 饮品</option>
          <option value="staple">🍚 主食</option>
          <option value="dish">🥗 菜肴</option>
        </select>
        <div className="meal-tags">
          <label>适用餐次：</label>
          {['breakfast', 'lunch', 'dinner'].map(tag => (
            <label key={tag} className="tag-checkbox">
              <input
                type="checkbox"
                checked={form.mealTags.includes(tag)}
                onChange={() => toggleMealTag(tag)}
              />
              {tag === 'breakfast' ? '早餐' : tag === 'lunch' ? '午餐' : '晚餐'}
            </label>
          ))}
        </div>
        <div className="image-upload">
          <label>菜品图片（可多选）：</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          {imagePreviews.length > 0 && (
            <div className="image-preview">
              {imagePreviews.map((src, idx) => (
                <img key={idx} src={src} alt={`预览${idx}`} className="preview-img" />
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          placeholder="预计时长（分钟）"
          value={form.duration}
          onChange={e => setForm({ ...form, duration: e.target.value })}
        />
        <button type="submit">➕ 添加菜品</button>
      </form>

      <div className="dish-list">
        {dishes.map(dish => (
          <div key={dish.id} className="dish-item">
            {dish.images && dish.images[0] && (
              <img src={dish.images[0]} alt={dish.name} className="dish-img" />
            )}
            <div className="dish-info">
              <strong>{dish.name}</strong>
              <span className="dish-type">
                {dish.type === 'drink' ? '🥤' : dish.type === 'staple' ? '🍚' : '🥗'}
              </span>
              <span className="dish-tags">
                {dish.mealTags.map((t: string) => (
                  <span key={t} className="tag">
                    {t === 'breakfast' ? '早餐' : t === 'lunch' ? '午餐' : '晚餐'}
                  </span>
                ))}
              </span>
            </div>
            <button className="btn-delete" onClick={() => deleteDish(dish.id)}>
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
