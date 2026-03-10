package com.todayeat.dto;

import lombok.Data;
import java.util.List;

@Data
public class DishDTO {
    private Long id;
    private String name;
    private List<String> images;
    private String type;
    private List<String> mealTags;
    private Integer duration;
    private Integer sortOrder;
    private Boolean enabled;
}
