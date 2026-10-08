package com.institute.repository;

import com.institute.model.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    List<Enquiry> findByStatus(String status);
    List<Enquiry> findByEnquiryType(String enquiryType);
    List<Enquiry> findByFollowUpDate(LocalDate followUpDate);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByStatus(String status);
}
