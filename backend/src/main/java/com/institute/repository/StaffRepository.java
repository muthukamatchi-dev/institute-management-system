package com.institute.repository;

import com.institute.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByToken(String token);
    Optional<Staff> findByTokenAndTenantId(String token, String tenantId);
    Optional<Staff> findByStaffIdAndMobile(String staffId, String mobile);
    Optional<Staff> findByStaffIdAndTenantId(String staffId, String tenantId);
    Optional<Staff> findByStaffIdIgnoreCase(String staffId);
    Optional<Staff> findByStaffIdIgnoreCaseAndTenantIdIgnoreCase(String staffId, String tenantId);
    Optional<Staff> findByStaffId(String staffId);
}
