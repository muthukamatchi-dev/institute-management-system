package com.institute.repository;

import com.institute.model.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, Long> {
    Optional<CustomFieldValue> findByFieldIdAndEntityId(Long fieldId, Long entityId);
    List<CustomFieldValue> findByEntityId(Long entityId);
    void deleteByFieldId(Long fieldId);
}
