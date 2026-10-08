package com.institute.repository;

import com.institute.model.ProgramModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgramModuleRepository extends JpaRepository<ProgramModule, Long> {
    List<ProgramModule> findByProgramIdOrderByModuleOrderAsc(Long programId);
    Optional<ProgramModule> findByProgramIdAndModuleOrder(Long programId, Integer moduleOrder);
    List<ProgramModule> findByCourseId(Long courseId);
    void deleteByProgramId(Long programId);
}
