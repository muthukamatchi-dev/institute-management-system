package com.institute.repository;

import com.institute.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByTenantCode(String tenantCode);
    Optional<Tenant> findByTenantCodeIgnoreCase(String tenantCode);

    Optional<Tenant> findBySubdomainIgnoreCase(String subdomain);

    Optional<Tenant> findByDomain(String domain);

    Optional<Tenant> findByAdminEmail(String adminEmail);

    boolean existsByTenantCode(String tenantCode);

    boolean existsBySubdomain(String subdomain);

    boolean existsByAdminEmail(String adminEmail);

    List<Tenant> findByStatus(String status);

    @Query("SELECT t FROM Tenant t WHERE t.isTrialActive = true AND t.trialEndDate < CURRENT_DATE AND t.status = 'active'")
    List<Tenant> findExpiredTrialTenants();

    @Query("SELECT t FROM Tenant t ORDER BY t.createdAt DESC")
    List<Tenant> findAllOrderByCreatedAtDesc();

    @Query("SELECT t FROM Tenant t WHERE t.status = 'active' AND " +
           "(LOWER(t.tenantName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.subdomain) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Tenant> searchByNameOrSubdomain(@Param("query") String query);
}

