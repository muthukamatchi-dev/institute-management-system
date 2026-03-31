package com.institute.repository;

import com.institute.model.TemplateOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TemplateOptionRepository extends JpaRepository<TemplateOption, Long> {
    List<TemplateOption> findByQuestionId(Long questionId);
    void deleteByQuestionId(Long questionId);
}
