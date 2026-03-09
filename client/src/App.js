import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE = '/api';
function App() {
    const [mealType, setMealType] = useState('lunch');
    const [result, setResult] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [stopped, setStopped] = useState({ drink: false, staple: false, dish: false });
    const [displayItems, setDisplayItems] = useState({ drink: null, staple: null, dish: null });
    const [history, setHistory] = useState([]);
    const [showManage, setShowManage] = useState(false);
    const [randomDate, setRandomDate] = useState(null);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const mealLabels = {
        breakfast: '🌅 早餐',
        lunch: '☀️ 午餐',
        dinner: '🌙 晚餐',
    };
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dateStr === today)
            return '今天';
        if (dateStr === yesterday)
            return '昨天';
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
            }
            else {
                setRandomDate(null);
            }
        }
        catch (e) {
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
                    }
                    else {
                        // 快速闪现随机菜品
                        setDisplayItems({
                            drink: Math.random() > 0.3 ? newResult.drink : null,
                            staple: Math.random() > 0.3 ? newResult.staple : null,
                            dish: Math.random() > 0.3 ? newResult.dish : null,
                        });
                    }
                }, 100);
            }
            catch (e) {
                console.error('生成失败', e);
                setRolling(false);
            }
        }
    };
    const stopRolling = async (finalResult) => {
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
        if (!result)
            return;
        try {
            await axios.post(`${API_BASE}/random/confirm`, {
                drinkId: result.drink?.id,
                stapleId: result.staple?.id,
                dishId: result.dish?.id,
                mealType,
            });
            alert('✅ 已保存今日菜单！');
            loadTodayRecord();
        }
        catch (e) {
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
            }
            else {
                alert('保存失败');
            }
        }
    };
    const SlotWindow = ({ type, item, isStopped }) => (_jsxs("div", { className: "slot-window", children: [_jsx("div", { className: "slot-label", children: type === 'drink' ? '🥤 饮品' : type === 'staple' ? '🍚 主食' : '🥗 菜肴' }), _jsx("div", { className: "slot-content", children: rolling && !isStopped ? (_jsx("div", { className: "slot-rolling", children: "\uD83C\uDFB2" })) : item ? (_jsxs("div", { className: "slot-item", children: [item.images?.[0] ? (_jsx("img", { src: item.images[0], alt: item.name, className: "slot-image" })) : (_jsx("div", { className: "slot-no-image", children: "\u2753" })), _jsx("div", { className: "slot-name", children: item.name })] })) : (_jsx("div", { className: "slot-bomb", children: "\uD83D\uDCA3" })) })] }));
    if (showManage) {
        return _jsx(DishManagement, { onBack: () => setShowManage(false) });
    }
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "header", children: [_jsx("h1", { children: "\uD83C\uDFB0 \u4ECA\u5929\u5403\u4EC0\u4E48\uFF1F" }), _jsx("button", { className: "btn-manage", onClick: () => setShowManage(true), children: "\u2699\uFE0F \u83DC\u54C1\u7BA1\u7406" })] }), _jsx("div", { className: "meal-selector", children: ['breakfast', 'lunch', 'dinner'].map(type => (_jsx("button", { className: `meal-btn ${mealType === type ? 'active' : ''}`, onClick: () => setMealType(type), children: mealLabels[type] }, type))) }), _jsxs("div", { className: "slot-machine", children: [_jsx(SlotWindow, { type: "drink", item: displayItems.drink, isStopped: stopped.drink }), _jsx(SlotWindow, { type: "staple", item: displayItems.staple, isStopped: stopped.staple }), _jsx(SlotWindow, { type: "dish", item: displayItems.dish, isStopped: stopped.dish })] }), _jsxs("div", { className: "controls", children: [_jsx("button", { className: "btn-roll", onClick: generateRandom, children: rolling ? '🎲 滚动中...' : '🎰 拉动拉杆' }), result && !rolling && stopped.dish && (_jsx("button", { className: "btn-confirm", onClick: confirmResult, children: "\u2705 \u786E\u8BA4\u4FDD\u5B58" }))] }), result && (_jsxs("div", { className: "result-preview", children: [_jsxs("h3", { children: ["\uD83D\uDCCB ", randomDate ? `${formatDate(randomDate)} (${randomDate})` : '当前选择', "\uFF1A"] }), _jsxs("p", { children: [result.drink?.name || '💣', " - ", result.staple?.name || '💣', " - ", result.dish?.name || '💣'] }), isDuplicate && _jsx("p", { className: "duplicate-warning", children: "\u26A0\uFE0F \u4E0E\u8FC7\u53BB 7 \u5929\u5185\u8BB0\u5F55\u91CD\u590D" })] }))] }));
}
// 菜品管理组件
function DishManagement({ onBack }) {
    const [dishes, setDishes] = useState([]);
    const [form, setForm] = useState({
        name: '',
        type: 'dish',
        mealTags: [],
        duration: '',
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    useEffect(() => {
        loadDishes();
    }, []);
    const loadDishes = async () => {
        const res = await axios.get(`${API_BASE}/dishes`);
        setDishes(res.data);
    };
    const handleImageChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(files);
            // 创建预览
            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    };
    const handleSubmit = async (e) => {
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
        }
        catch (error) {
            alert('❌ 添加失败：' + (error.response?.data?.error || error.message));
        }
    };
    const toggleMealTag = (tag) => {
        setForm(f => ({
            ...f,
            mealTags: f.mealTags.includes(tag)
                ? f.mealTags.filter(t => t !== tag)
                : [...f.mealTags, tag],
        }));
    };
    const deleteDish = async (id) => {
        if (confirm('确定删除？')) {
            await axios.delete(`${API_BASE}/dishes/${id}`);
            loadDishes();
        }
    };
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "header", children: [_jsx("button", { className: "btn-back", onClick: onBack, children: "\u2190 \u8FD4\u56DE" }), _jsx("h1", { children: "\u2699\uFE0F \u83DC\u54C1\u7BA1\u7406" })] }), _jsxs("form", { className: "dish-form", onSubmit: handleSubmit, children: [_jsx("input", { type: "text", placeholder: "\u83DC\u54C1\u540D\u79F0", value: form.name, onChange: e => setForm({ ...form, name: e.target.value }), required: true }), _jsxs("select", { value: form.type, onChange: e => setForm({ ...form, type: e.target.value }), children: [_jsx("option", { value: "drink", children: "\uD83E\uDD64 \u996E\u54C1" }), _jsx("option", { value: "staple", children: "\uD83C\uDF5A \u4E3B\u98DF" }), _jsx("option", { value: "dish", children: "\uD83E\uDD57 \u83DC\u80B4" })] }), _jsxs("div", { className: "meal-tags", children: [_jsx("label", { children: "\u9002\u7528\u9910\u6B21\uFF1A" }), ['breakfast', 'lunch', 'dinner'].map(tag => (_jsxs("label", { className: "tag-checkbox", children: [_jsx("input", { type: "checkbox", checked: form.mealTags.includes(tag), onChange: () => toggleMealTag(tag) }), tag === 'breakfast' ? '早餐' : tag === 'lunch' ? '午餐' : '晚餐'] }, tag)))] }), _jsxs("div", { className: "image-upload", children: [_jsx("label", { children: "\u83DC\u54C1\u56FE\u7247\uFF08\u53EF\u591A\u9009\uFF09\uFF1A" }), _jsx("input", { type: "file", accept: "image/*", multiple: true, onChange: handleImageChange }), imagePreviews.length > 0 && (_jsx("div", { className: "image-preview", children: imagePreviews.map((src, idx) => (_jsx("img", { src: src, alt: `预览${idx}`, className: "preview-img" }, idx))) }))] }), _jsx("input", { type: "number", placeholder: "\u9884\u8BA1\u65F6\u957F\uFF08\u5206\u949F\uFF09", value: form.duration, onChange: e => setForm({ ...form, duration: e.target.value }) }), _jsx("button", { type: "submit", children: "\u2795 \u6DFB\u52A0\u83DC\u54C1" })] }), _jsx("div", { className: "dish-list", children: dishes.map(dish => (_jsxs("div", { className: "dish-item", children: [dish.images && dish.images[0] && (_jsx("img", { src: dish.images[0], alt: dish.name, className: "dish-img" })), _jsxs("div", { className: "dish-info", children: [_jsx("strong", { children: dish.name }), _jsx("span", { className: "dish-type", children: dish.type === 'drink' ? '🥤' : dish.type === 'staple' ? '🍚' : '🥗' }), _jsx("span", { className: "dish-tags", children: dish.mealTags.map((t) => (_jsx("span", { className: "tag", children: t === 'breakfast' ? '早餐' : t === 'lunch' ? '午餐' : '晚餐' }, t))) })] }), _jsx("button", { className: "btn-delete", onClick: () => deleteDish(dish.id), children: "\uD83D\uDDD1\uFE0F" })] }, dish.id))) })] }));
}
export default App;
