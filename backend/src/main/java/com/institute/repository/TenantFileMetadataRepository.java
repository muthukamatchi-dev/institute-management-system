package com.institute.repository;

import com.institute.model.TenantFileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TenantFileMetadataRepository extends JpaRepository<TenantFileMetadata, Long> {

    List<TenantFileMetadata> findByTenantId(String tenantId);

    List<TenantFileMetadata> findByTenantIdAndEntityTypeAndEntityId(String tenantId, String entityType, Long entityId);

    Optional<TenantFileMetadata> findByTenantIdAndProviderFileId(String tenantId, String providerFileId);
}
