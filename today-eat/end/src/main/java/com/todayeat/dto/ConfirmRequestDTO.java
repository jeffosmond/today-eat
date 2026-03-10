package com.todayeat.dto;

import lombok.Data;

@Data
public class ConfirmRequestDTO {
    private Long drinkId;
    private Long stapleId;
    private Long dishId;
    private String mealType;
    private Boolean force = false;
}
