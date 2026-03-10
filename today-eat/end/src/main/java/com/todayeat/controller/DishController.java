package com.todayeat.controller;

import com.todayeat.dto.DishDTO;
import com.todayeat.service.DishService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/dishes")
@CrossOrigin(origins = "*")
public class DishController {
    
    @Autowired
    private DishService dishService;
    
    @GetMapping
    public ResponseEntity<List<DishDTO>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String mealTag,
            @RequestParam(required = false) Boolean enabled) {
        return ResponseEntity.ok(dishService.findAll(type, mealTag, enabled));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DishDTO> get(@PathVariable Long id) {
        DishDTO dto = dishService.findById(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }
    
    @PostMapping
    public ResponseEntity<DishDTO> create(
            @RequestParam String name,
            @RequestParam String type,
            @RequestParam(required = false) String mealTags,
            @RequestParam(required = false) Integer duration,
            @RequestParam(required = false) Integer sortOrder,
            @RequestPart(required = false) List<MultipartFile> images) {
        try {
            DishDTO dto = new DishDTO();
            dto.setName(name);
            dto.setType(type);
            dto.setMealTags(parseJsonArray(mealTags));
            dto.setDuration(duration);
            dto.setSortOrder(sortOrder);
            dto.setEnabled(true);
            
            DishDTO created = dishService.create(dto, images);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<DishDTO> update(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String mealTags,
            @RequestParam(required = false) Integer duration,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam(required = false) Boolean enabled,
            @RequestPart(required = false) List<MultipartFile> images) {
        try {
            DishDTO dto = new DishDTO();
            dto.setName(name);
            dto.setType(type);
            dto.setMealTags(parseJsonArray(mealTags));
            dto.setDuration(duration);
            dto.setSortOrder(sortOrder);
            dto.setEnabled(enabled);
            
            DishDTO updated = dishService.update(id, dto, images);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dishService.delete(id);
        return ResponseEntity.ok().build();
    }
    
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<DishDTO> toggle(@PathVariable Long id) {
        try {
            dishService.toggleEnabled(id);
            return ResponseEntity.ok(dishService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    private List<String> parseJsonArray(String json) {
        if (json == null || json.isEmpty()) return null;
        json = json.trim();
        if (json.startsWith("[") && json.endsWith("]")) {
            json = json.substring(1, json.length() - 1);
            if (json.isEmpty()) return new java.util.ArrayList<>();
            return java.util.Arrays.stream(json.split(","))
                    .map(s -> s.trim().replace("\"", ""))
                    .filter(s -> !s.isEmpty())
                    .collect(java.util.stream.Collectors.toList());
        }
        return java.util.Arrays.asList(json);
    }
}
