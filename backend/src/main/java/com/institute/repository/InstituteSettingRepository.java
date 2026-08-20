package com.institute.repository;

import com.institute.model.InstituteSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.transaction.annotation.Transactional;

@Repository
public interface InstituteSettingRepository extends JpaRepository<InstituteSetting, Long> {
    @Modifying
    @Transactional
    @Query(value = "UPDATE institute_settings SET tenant_id = :tenantId WHERE tenant_id = 'default' OR tenant_id = 'DEFAULT'", nativeQuery = true)
    void fixLegacyTenants(@Param("tenantId") String tenantId);
}
