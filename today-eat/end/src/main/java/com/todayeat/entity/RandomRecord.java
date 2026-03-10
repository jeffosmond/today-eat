package com.todayeat.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.persistence.*;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "random_record")
public class RandomRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String date; // YYYY-MM-DD
    
    @Column(nullable = false)
    private String mealType; // breakfast, lunch, dinner
    
    @ManyToOne
    @JoinColumn(name = "drink_id")
    private Dish drink;
    
    @ManyToOne
    @JoinColumn(name = "staple_id")
    private Dish staple;
    
    @ManyToOne
    @JoinColumn(name = "dish_id")
    private Dish dish;
    
    @Column(name = "created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    
    @Column(name = "confirmed")
    private Boolean confirmed = false;
    
    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }
}
