package com.institute.repository;

import com.institute.model.ExamOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamOptionRepository extends JpaRepository<ExamOption, Long> {
    List<ExamOption> findByQuestionId(Long questionId);
    void deleteByQuestionId(Long questionId);
    Optional<ExamOption> findByQuestionIdAndIsCorrect(Long questionId, Integer isCorrect);
}
