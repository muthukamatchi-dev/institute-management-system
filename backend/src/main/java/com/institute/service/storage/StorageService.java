package com.institute.service.storage;

import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;

public interface StorageService {

    String getProviderName();

    StorageResult upload(String category, MultipartFile file, String subDirectory, String targetFolderId);

    InputStream download(String providerFileId);

    boolean delete(String providerFileId);
}
