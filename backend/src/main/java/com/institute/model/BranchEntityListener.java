package com.institute.model;

import com.institute.context.BranchContext;
import jakarta.persistence.PrePersist;
import java.lang.reflect.Field;

public class BranchEntityListener {

    @PrePersist
    public void setBranchId(Object entity) {
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
}
