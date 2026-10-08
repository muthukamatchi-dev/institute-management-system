package com.institute.model;

import com.institute.context.BranchContext;
import com.institute.tenant.TenantContext;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.lang.reflect.Field;
import java.time.LocalDateTime;

public class BranchEntityListener {

    @PrePersist
    public void onPrePersist(Object entity) {
        setBranchId(entity);
        setTenantId(entity);
        setCreatedAtIfNull(entity);
        setUpdatedAtIfNull(entity);
    }

    @PreUpdate
    public void onPreUpdate(Object entity) {
        setUpdatedAt(entity);
    }

    private void setBranchId(Object entity) {
        String branchIdStr = BranchContext.getCurrentBranchId();
        if (branchIdStr != null && !branchIdStr.equals("all")) {
            try {
                Long branchId = Long.parseLong(branchIdStr);
                Field field = entity.getClass().getDeclaredField("branchId");
                field.setAccessible(true);
                if (field.get(entity) == null) {
                    field.set(entity, branchId);
                }
            } catch (NoSuchFieldException | IllegalAccessException | NumberFormatException e) {
                // Entity doesn't have branchId or it's already set or bId invalid
            }
        }
    }

    private void setTenantId(Object entity) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            try {
                Field field = entity.getClass().getDeclaredField("tenantId");
                field.setAccessible(true);
                Object current = field.get(entity);
                if (current == null || "default".equals(current.toString())) {
                    field.set(entity, tenantId);
                }
            } catch (NoSuchFieldException | IllegalAccessException e) {
                // Entity doesn't have tenantId or it's already set
            }
        }
    }

    private void setCreatedAtIfNull(Object entity) {
        try {
            Field field = entity.getClass().getDeclaredField("createdAt");
            field.setAccessible(true);
            if (field.get(entity) == null) {
                field.set(entity, LocalDateTime.now());
            }
        } catch (NoSuchFieldException | IllegalAccessException e) {
            // Entity doesn't have createdAt field or not accessible
        }
    }

    private void setUpdatedAtIfNull(Object entity) {
        try {
            Field field = entity.getClass().getDeclaredField("updatedAt");
            field.setAccessible(true);
            if (field.get(entity) == null) {
                field.set(entity, LocalDateTime.now());
            }
        } catch (NoSuchFieldException | IllegalAccessException e) {
            // Entity doesn't have updatedAt field or not accessible
        }
    }

    private void setUpdatedAt(Object entity) {
        try {
            Field field = entity.getClass().getDeclaredField("updatedAt");
            field.setAccessible(true);
            field.set(entity, LocalDateTime.now());
        } catch (NoSuchFieldException | IllegalAccessException e) {
            // Entity doesn't have updatedAt field or not accessible
        }
    }
}
