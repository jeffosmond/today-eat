package com.todayeat.service;

import com.todayeat.dto.DishDTO;
import com.todayeat.dto.RandomResultDTO;
import com.todayeat.entity.Dish;
import com.todayeat.entity.RandomRecord;
import com.todayeat.repository.DishRepository;
import com.todayeat.repository.RandomRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RandomService {
    
    @Autowired
    private DishRepository dishRepository;
    
    @Autowired
    private RandomRecordRepository randomRecordRepository;
    
    public RandomResultDTO generate(String mealType) {
        List<Dish> drinks = dishRepository.findByTypeAndEnabledTrue("drink");
        List<Dish> staples = dishRepository.findByTypeAndEnabledTrue("staple");
        List<Dish> dishes = dishRepository.findByTypeAndEnabledTrue("dish");
        
        // 根据餐次标签过滤
        if (mealType != null && !mealType.isEmpty()) {
            drinks = filterByMealTag(drinks, mealType);
            staples = filterByMealTag(staples, mealType);
            dishes = filterByMealTag(dishes, mealType);
        }
        
        Dish selectedDrink = selectRandom(drinks);
        Dish selectedStaple = selectRandom(staples);
        Dish selectedDish = selectRandom(dishes);
        
        RandomResultDTO result = new RandomResultDTO();
        result.setDrink(toDTO(selectedDrink));
        result.setStaple(toDTO(selectedStaple));
        result.setDish(toDTO(selectedDish));
        
        // 检查是否与过去 7 天重复
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_YEAR, -7);
        List<RandomRecord> recentRecords = randomRecordRepository.findRecentRecords(mealType, calendar.getTime());
        
        for (RandomRecord record : recentRecords) {
            if (isDuplicate(result, record)) {
                result.setIsDuplicate(true);
                break;
            }
        }
        
        return result;
    }
    
    private List<Dish> filterByMealTag(List<Dish> dishes, String mealType) {
        return dishes.stream()
                .filter(d -> {
                    String tags = d.getMealTags();
                    return tags == null || tags.isEmpty() || tags.contains(mealType);
                })
                .collect(Collectors.toList());
    }
    
    private Dish selectRandom(List<Dish> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(new Random().nextInt(list.size()));
    }
    
    private boolean isDuplicate(RandomResultDTO result, RandomRecord record) {
        Long drinkId = result.getDrink() != null ? result.getDrink().getId() : null;
        Long stapleId = result.getStaple() != null ? result.getStaple().getId() : null;
        Long dishId = result.getDish() != null ? result.getDish().getId() : null;
        
        Long recordDrinkId = record.getDrink() != null ? record.getDrink().getId() : null;
        Long recordStapleId = record.getStaple() != null ? record.getStaple().getId() : null;
        Long recordDishId = record.getDish() != null ? record.getDish().getId() : null;
        
        boolean drinkMatch = drinkId != null && drinkId.equals(recordDrinkId);
        boolean stapleMatch = stapleId != null && stapleId.equals(recordStapleId);
        boolean dishMatch = dishId != null && dishId.equals(recordDishId);
        
        return drinkMatch && stapleMatch && dishMatch;
    }
    
    public RandomRecord confirm(Long drinkId, Long stapleId, Long dishId, String mealType, boolean force) {
        String today = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date());
        
        Optional<RandomRecord> existing = randomRecordRepository.findByDateAndMealType(today, mealType);
        if (existing.isPresent() && !force) {
            throw new RuntimeException("该餐次今日已有记录");
        }
        
        RandomRecord record = existing.orElse(new RandomRecord());
        record.setDate(today);
        record.setMealType(mealType);
        
        if (drinkId != null) {
            record.setDrink(dishRepository.findById(drinkId).orElse(null));
        }
        if (stapleId != null) {
            record.setStaple(dishRepository.findById(stapleId).orElse(null));
        }
        if (dishId != null) {
            record.setDish(dishRepository.findById(dishId).orElse(null));
        }
        
        record.setConfirmed(true);
        return randomRecordRepository.save(record);
    }
    
    public List<RandomRecord> getTodayRecords(String mealType) {
        String today = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date());
        if (mealType != null && !mealType.isEmpty()) {
            return randomRecordRepository.findByDateOrderByCreatedAtDesc(today).stream()
                    .filter(r -> mealType.equals(r.getMealType()))
                    .collect(Collectors.toList());
        }
        return randomRecordRepository.findByDateOrderByCreatedAtDesc(today);
    }
    
    private DishDTO toDTO(Dish dish) {
        if (dish == null) return null;
        DishDTO dto = new DishDTO();
        dto.setId(dish.getId());
        dto.setName(dish.getName());
        dto.setImages(fromJson(dish.getImages()));
        dto.setType(dish.getType());
        dto.setMealTags(fromJson(dish.getMealTags()));
        dto.setDuration(dish.getDuration());
        dto.setSortOrder(dish.getSortOrder());
        dto.setEnabled(dish.getEnabled());
        return dto;
    }
    
    private List<String> fromJson(String json) {
        if (json == null || json.isEmpty() || "null".equals(json)) {
            return new ArrayList<>();
        }
        json = json.trim();
        if (json.startsWith("[") && json.endsWith("]")) {
            json = json.substring(1, json.length() - 1);
            if (json.isEmpty()) return new ArrayList<>();
            return Arrays.stream(json.split(","))
                    .map(s -> s.trim().replace("\"", ""))
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
        return Arrays.asList(json);
    }
}
