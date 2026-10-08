package com.institute.service.storage;

import com.institute.model.TenantFileMetadata;
import com.institute.repository.TenantFileMetadataRepository;
import com.institute.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class DelegatingStorageService {

    private static final Logger logger = LoggerFactory.getLogger(DelegatingStorageService.class);

    @Autowired
    @Qualifier("localStorageService")
    private StorageService localStorageService;

    @Autowired
    private TenantFileMetadataRepository metadataRepository;

    /**
     * Upload file for current tenant using institute server local storage.
     */
    public StorageResult uploadFile(String category, MultipartFile file, String entityType, Long entityId) {
        String tenantId = TenantContext.getTenantId();

        StorageResult result = localStorageService.upload(category, file, category.toLowerCase(), null);

        // Save file metadata record in MySQL if upload succeeded
        if (result.isSuccess()) {
            try {
                TenantFileMetadata meta = TenantFileMetadata.builder()
                        .tenantId(tenantId)
                        .entityType(entityType != null ? entityType : category)
                        .entityId(entityId)
                        .provider(result.getProvider())
                        .providerFileId(result.getProviderFileId())
                        .fileName(result.getFileName())
                        .mimeType(result.getMimeType())
                        .fileSize(result.getFileSize())
                        .category(category)
                        .webViewLink(result.getWebViewLink())
                        .build();

                metadataRepository.save(meta);
            } catch (Exception e) {
                logger.warn("Failed to persist file metadata for tenant {}: {}", tenantId, e.getMessage());
            }
        }

        return result;
    }

    /**
     * Stream download file content
     */
    public InputStream downloadFile(String providerFileId, String provider) {
        return localStorageService.download(providerFileId);
    }
}
