package com.institute.service.storage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageResult {
    private boolean success;
    private String provider; // GOOGLE_DRIVE or LOCAL
    private String providerFileId;
    private String fileName;
    private String mimeType;
    private Long fileSize;
    private String relativePathOrUrl;
    private String webViewLink;
    private String errorMessage;
}
