package com.todayeat.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RandomResultDTO {
    private DishDTO drink;
    private DishDTO staple;
    private DishDTO dish;
    private Boolean isDuplicate = false;
}
