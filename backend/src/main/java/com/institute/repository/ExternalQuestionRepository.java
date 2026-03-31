package com.institute.repository;

import com.institute.model.ExternalQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExternalQuestionRepository extends JpaRepository<ExternalQuestion, Long> {
    List<ExternalQuestion> findByExamId(Long examId);
    void deleteByExamId(Long examId);
}
