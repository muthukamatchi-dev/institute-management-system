package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.model.*;
import com.institute.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * Custom Fields Controller
 * Migrated from: controllers/api/CustomFields.php (57 lines)
 */
@RestController
@RequestMapping("/api/customfields")
public class CustomFieldsController {

    private final CustomFieldRepository customFieldRepo;
    private final CustomFieldValueRepository customFieldValueRepo;

    public CustomFieldsController(CustomFieldRepository customFieldRepo,
                                   CustomFieldValueRepository customFieldValueRepo) {
        this.customFieldRepo = customFieldRepo;
        this.customFieldValueRepo = customFieldValueRepo;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getFields(@RequestParam(name = "location", required = false) String location) {
        if (location != null) {
            return ResponseEntity.ok(ApiResponse.success(customFieldRepo.findByLocation(location)));
        }
        return ResponseEntity.ok(ApiResponse.success(customFieldRepo.findAll()));
    }

    @GetMapping("/entity_values")
    public ResponseEntity<ApiResponse> getEntityValues(@RequestParam(name = "location") String location, @RequestParam(name = "entity_id") String entity_id) {
        Long entityId = Long.valueOf(entity_id);
        List<CustomFieldValue> values = customFieldValueRepo.findByEntityId(entityId);
        return ResponseEntity.ok(ApiResponse.success(values));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse> saveField(@RequestBody Map<String, Object> body) {
        Long id = body.containsKey("id") && body.get("id") != null ? Long.valueOf(body.get("id").toString()) : null;
        CustomField field;
        if (id != null) {
            field = customFieldRepo.findById(id).orElse(new CustomField());
        } else {
            field = new CustomField();
            field.setCreatedAt(java.time.LocalDateTime.now());
        }
        if (body.containsKey("location")) field.setLocation((String) body.get("location"));
        if (body.containsKey("field_label")) field.setFieldLabel((String) body.get("field_label"));
        if (body.containsKey("field_type")) field.setFieldType((String) body.get("field_type"));
        if (body.containsKey("is_required")) field.setIsRequired(Integer.valueOf(body.get("is_required").toString()));
        if (body.containsKey("options")) field.setOptions(body.get("options").toString());
        field.setUpdatedAt(java.time.LocalDateTime.now());
        customFieldRepo.save(field);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", field.getId()), "Field saved"));
    }

    @GetMapping("/delete")
    public ResponseEntity<ApiResponse> deleteField(@RequestParam(name = "id") String id) {
        Long fieldId = Long.valueOf(id);
        customFieldValueRepo.deleteByFieldId(fieldId);
        customFieldRepo.deleteById(fieldId);
        return ResponseEntity.ok(ApiResponse.success(null, "Field deleted"));
    }
}
