package com.institute.repository;

import com.institute.model.QuestionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionTemplateRepository extends JpaRepository<QuestionTemplate, Long> {
    List<QuestionTemplate> findByCourseId(Long courseId);
}
