package com.institute.repository;

import com.institute.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByIsMainTrue();
    List<Branch> findByStatusOrderByCreatedAtDesc(String status);
    List<Branch> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
}
