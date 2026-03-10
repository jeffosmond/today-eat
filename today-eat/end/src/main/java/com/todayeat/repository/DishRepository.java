package com.todayeat.repository;

import com.todayeat.entity.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    
    List<Dish> findByType(String type);
    
    List<Dish> findByEnabledTrueOrderBySortOrderAsc();
    
    List<Dish> findByTypeAndEnabledTrue(String type);
    
    @Query("SELECT d FROM Dish d WHERE d.enabled = true AND d.mealTags LIKE CONCAT('%', :mealTag, '%')")
    List<Dish> findByMealTag(@Param("mealTag") String mealTag);
    
    @Query("SELECT d FROM Dish d WHERE d.enabled = true AND d.type = :type AND d.mealTags LIKE CONCAT('%', :mealTag, '%')")
    List<Dish> findByTypeAndMealTag(@Param("type") String type, @Param("mealTag") String mealTag);
}
