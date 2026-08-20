package com.institute.repository;

import com.institute.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(String roleName);
    Optional<Role> findByRoleNameAndTenantId(String roleName, String tenantId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE roles SET tenant_id = :tenantId WHERE tenant_id = 'default' OR tenant_id = 'DEFAULT'", nativeQuery = true)
    void fixLegacyTenants(@Param("tenantId") String tenantId);
}
