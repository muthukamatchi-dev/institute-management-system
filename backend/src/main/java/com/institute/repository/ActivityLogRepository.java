package com.institute.repository;

import com.institute.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop100ByOrderByCreatedAtDesc();
    List<ActivityLog> findByCreatedAtBetweenOrderByCreatedAtDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<ActivityLog> findByUserTypeOrderByCreatedAtDesc(String userType);
    long countByUserId(Long userId);
    long countByUserIdAndUserType(Long userId, String userType);
}
