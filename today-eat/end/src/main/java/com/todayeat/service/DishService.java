package com.todayeat.service;

import com.todayeat.dto.DishDTO;
import com.todayeat.entity.Dish;
import com.todayeat.repository.DishRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class DishService {
    
    @Autowired
    private DishRepository dishRepository;
    
    private final String uploadPath = "/app/uploads";
    
    public List<DishDTO> findAll(String type, String mealTag, Boolean enabled) {
        List<Dish> dishes;
        
        if (enabled != null && enabled) {
            if (type != null && !type.isEmpty()) {
                dishes = dishRepository.findByTypeAndEnabledTrue(type);
            } else if (mealTag != null && !mealTag.isEmpty()) {
                dishes = dishRepository.findByMealTag(mealTag);
            } else {
                dishes = dishRepository.findByEnabledTrueOrderBySortOrderAsc();
            }
        } else {
            dishes = dishRepository.findAll();
        }
        
        return dishes.stream().map(this::toDTO).collect(Collectors.toList());
    }
    
    public DishDTO findById(Long id) {
        return dishRepository.findById(id)
                .map(this::toDTO)
                .orElse(null);
    }
    
    public DishDTO create(DishDTO dto, List<MultipartFile> images) throws IOException {
        Dish dish = new Dish();
        dish.setName(dto.getName());
        dish.setType(dto.getType());
        dish.setDuration(dto.getDuration());
        dish.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        dish.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);
        
        List<String> imageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                String imageUrl = saveImage(file);
                imageUrls.add(imageUrl);
            }
        }
        dish.setImages(toJson(imageUrls));
        
        if (dto.getMealTags() != null) {
            dish.setMealTags(toJson(dto.getMealTags()));
        }
        
        Dish saved = dishRepository.save(dish);
        return toDTO(saved);
    }
    
    public DishDTO update(Long id, DishDTO dto, List<MultipartFile> newImages) throws IOException {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("菜品不存在"));
        
        if (dto.getName() != null) dish.setName(dto.getName());
        if (dto.getType() != null) dish.setType(dto.getType());
        if (dto.getDuration() != null) dish.setDuration(dto.getDuration());
        if (dto.getSortOrder() != null) dish.setSortOrder(dto.getSortOrder());
        if (dto.getEnabled() != null) dish.setEnabled(dto.getEnabled());
        
        if (dto.getMealTags() != null) {
            dish.setMealTags(toJson(dto.getMealTags()));
        }
        
        if (newImages != null && !newImages.isEmpty()) {
            List<String> existingImages = fromJson(dish.getImages());
            for (MultipartFile file : newImages) {
                String imageUrl = saveImage(file);
                existingImages.add(imageUrl);
            }
            dish.setImages(toJson(existingImages));
        }
        
        Dish saved = dishRepository.save(dish);
        return toDTO(saved);
    }
    
    public void delete(Long id) {
        dishRepository.deleteById(id);
    }
    
    public void toggleEnabled(Long id) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("菜品不存在"));
        dish.setEnabled(!dish.getEnabled());
        dishRepository.save(dish);
    }
    
    private String saveImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return null;
        }
        
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
        
        String filename = "dish-" + System.currentTimeMillis() + extension;
        Path filePath = Paths.get(uploadPath, filename);
        
        Files.createDirectories(filePath.getParent());
        file.transferTo(filePath);
        
        return "/uploads/" + filename;
    }
    
    private DishDTO toDTO(Dish dish) {
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
    
    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(list.get(i)).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}
