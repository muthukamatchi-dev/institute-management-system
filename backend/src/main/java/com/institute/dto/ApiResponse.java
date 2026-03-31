package com.institute.dto;

import lombok.*;
import java.util.Map;

/**
 * API Response wrapper - exact match to Api_Controller.php -> response()
 * Original format: { status: 'success'|'error', data: ..., message: '...' }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private String status;
    private Object data;
    private String message;
    private Object user;

    public ApiResponse withAdditional(String key, Object value) {
        if ("user".equals(key)) this.user = value;
        return this;
    }

    public static ApiResponse success(Object data) {
        return ApiResponse.builder().status("success").data(data).build();
    }

    public static ApiResponse success(Object data, String message) {
        return ApiResponse.builder().status("success").data(data).message(message).build();
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder().status("error").message(message).build();
    }
}
