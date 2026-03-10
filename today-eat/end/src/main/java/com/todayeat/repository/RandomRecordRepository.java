package com.todayeat.repository;

import com.todayeat.entity.RandomRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RandomRecordRepository extends JpaRepository<RandomRecord, Long> {
    
    Optional<RandomRecord> findByDateAndMealType(String date, String mealType);
    
    List<RandomRecord> findByDateOrderByCreatedAtDesc(String date);
    
    @Query("SELECT r FROM RandomRecord r WHERE r.mealType = :mealType ORDER BY r.createdAt DESC")
    List<RandomRecord> findByMealTypeRecent(@Param("mealType") String mealType);
    
    @Query("SELECT r FROM RandomRecord r WHERE r.mealType = :mealType AND r.createdAt >= :afterDate ORDER BY r.createdAt DESC")
    List<RandomRecord> findRecentRecords(@Param("mealType") String mealType, @Param("afterDate") java.util.Date afterDate);
}
