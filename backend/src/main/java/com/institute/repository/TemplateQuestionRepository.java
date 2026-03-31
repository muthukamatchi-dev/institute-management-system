package com.institute.repository;

import com.institute.model.TemplateQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TemplateQuestionRepository extends JpaRepository<TemplateQuestion, Long> {
    List<TemplateQuestion> findByTemplateId(Long templateId);
    void deleteByTemplateId(Long templateId);
}
