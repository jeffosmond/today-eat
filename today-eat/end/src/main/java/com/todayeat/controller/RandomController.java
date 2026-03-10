package com.todayeat.controller;

import com.todayeat.dto.ConfirmRequestDTO;
import com.todayeat.dto.RandomResultDTO;
import com.todayeat.entity.RandomRecord;
import com.todayeat.service.RandomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/random")
@CrossOrigin(origins = "*")
public class RandomController {
    
    @Autowired
    private RandomService randomService;
    
    @PostMapping("/generate")
    public ResponseEntity<RandomResultDTO> generate(@RequestBody Map<String, String> request) {
        String mealType = request != null ? request.get("mealType") : "lunch";
        RandomResultDTO result = randomService.generate(mealType);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestBody ConfirmRequestDTO request) {
        try {
            RandomRecord record = randomService.confirm(
                    request.getDrinkId(),
                    request.getStapleId(),
                    request.getDishId(),
                    request.getMealType(),
                    request.getForce() != null && request.getForce()
            );
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }
    
    @GetMapping("/today")
    public ResponseEntity<List<RandomRecord>> today(@RequestParam(required = false) String mealType) {
        return ResponseEntity.ok(randomService.getTodayRecords(mealType));
    }
}
