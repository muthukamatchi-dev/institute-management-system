package com.institute.service.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service("localStorageService")
public class LocalStorageService implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(LocalStorageService.class);

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public String getProviderName() {
        return "LOCAL";
    }

    @Override
    public StorageResult upload(String category, MultipartFile file, String subDirectory, String targetFolderId) {
        try {
            String folderName = (subDirectory != null && !subDirectory.trim().isEmpty()) ? subDirectory.trim() : category.toLowerCase();
            Path dirPath = Paths.get(uploadDir, folderName);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String sanitized = System.currentTimeMillis() + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path targetPath = dirPath.resolve(sanitized);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "uploads/" + folderName + "/" + sanitized;

            return StorageResult.builder()
                    .success(true)
                    .provider("LOCAL")
                    .providerFileId(relativePath)
                    .fileName(originalName)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .relativePathOrUrl(relativePath)
                    .webViewLink(relativePath)
                    .build();
        } catch (Exception e) {
            logger.error("Local storage upload error: {}", e.getMessage(), e);
            return StorageResult.builder()
                    .success(false)
                    .provider("LOCAL")
                    .errorMessage("Local upload failed: " + e.getMessage())
                    .build();
        }
    }

    @Override
    public InputStream download(String providerFileId) {
        try {
            File f = new File(providerFileId);
            if (!f.exists()) {
                f = new File(uploadDir, providerFileId.replace("uploads/", ""));
            }
            if (f.exists()) {
                return new FileInputStream(f);
            }
        } catch (Exception e) {
            logger.error("Local download error for {}: {}", providerFileId, e.getMessage());
        }
        return null;
    }

    @Override
    public boolean delete(String providerFileId) {
        try {
            File f = new File(providerFileId);
            if (!f.exists()) {
                f = new File(uploadDir, providerFileId.replace("uploads/", ""));
            }
            if (f.exists()) {
                return f.delete();
            }
        } catch (Exception e) {
            logger.error("Local delete error for {}: {}", providerFileId, e.getMessage());
        }
        return false;
    }
}
