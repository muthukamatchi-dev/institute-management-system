package com.institute.repository;

import com.institute.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findByCourseId(Long courseId);
    List<Batch> findByInstructor(String instructor);
}
