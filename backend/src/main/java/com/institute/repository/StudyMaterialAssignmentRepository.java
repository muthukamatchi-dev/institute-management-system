package com.institute.repository;

import com.institute.model.StudyMaterialAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudyMaterialAssignmentRepository extends JpaRepository<StudyMaterialAssignment, Long> {
    List<StudyMaterialAssignment> findByMaterialId(Long materialId);
    void deleteByMaterialId(Long materialId);
    List<StudyMaterialAssignment> findByTargetTypeAndTargetId(String targetType, Long targetId);
}
