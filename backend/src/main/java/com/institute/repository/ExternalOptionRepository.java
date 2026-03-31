package com.institute.repository;

import com.institute.model.ExternalOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalOptionRepository extends JpaRepository<ExternalOption, Long> {
    List<ExternalOption> findByQuestionId(Long questionId);
    Optional<ExternalOption> findByQuestionIdAndIsCorrect(Long questionId, Integer isCorrect);
    void deleteByQuestionId(Long questionId);
}
