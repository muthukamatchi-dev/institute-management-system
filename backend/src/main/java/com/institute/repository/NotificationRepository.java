package com.institute.repository;

import com.institute.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("SELECT n FROM Notification n WHERE " +
           "(n.userId = :userId OR " +
           "LOWER(n.userType) = LOWER(:userType) OR " +
           "(LOWER(:userType) = 'user' AND LOWER(n.userType) = 'admin') OR " +
           "n.userType = 'all') " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findUserNotifications(@Param("userId") Long userId, @Param("userType") String userType);

    boolean existsByUserIdAndUserTypeAndTitleAndMessageAndTypeAndCreatedAtBetween(
        Long userId,
        String userType,
        String title,
        String message,
        String type,
        LocalDateTime start,
        LocalDateTime end
    );
}
