package com.institute.repository;

import com.institute.model.InstituteSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstituteSettingRepository extends JpaRepository<InstituteSetting, Long> {
}
