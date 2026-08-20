package com.institute.service;

import com.institute.model.Branch;
import com.institute.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class BranchService {
    private final BranchRepository branchRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty())
            return "Active";
        String s = status.trim();
        if ("active".equalsIgnoreCase(s))
            return "Active";
        if ("inactive".equalsIgnoreCase(s))
            return "Inactive";
        return s;
    }

    @Transactional
    public List<Branch> getAllBranches() {
        ensureMainBranchExists();
        return branchRepository.findAll();
    }

    @Transactional
    public List<Branch> getActiveBranches() {
        ensureMainBranchExists();
        // Be forgiving: existing rows might have "active" vs "Active".
        return branchRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc("Active");
    }

    private void ensureMainBranchExists() {
        try {
            Optional<Branch> mainOpt = branchRepository.findByIsMainTrue();
            Branch mainBranch = null;
            if (mainOpt.isEmpty()) {
                List<Branch> all = branchRepository.findAll();
                if (all.isEmpty()) {
                    String tenantId = com.institute.tenant.TenantContext.getTenantId();
                    if (tenantId == null || tenantId.isEmpty()) tenantId = "default";
                    Branch main = Branch.builder()
                            .name("Main Branch")
                            .code("MAIN")
                            .isMain(true)
                            .status("Active")
                            .tenantId(tenantId)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    mainBranch = branchRepository.save(main);
                } else {
                    mainBranch = all.get(0);
                    mainBranch.setMain(true);
                    branchRepository.save(mainBranch);
                }
            } else {
                mainBranch = mainOpt.get();
            }

            if (mainBranch != null && mainBranch.getId() != null) {
                Long mainBranchId = mainBranch.getId();
                String tenantId = com.institute.tenant.TenantContext.getTenantId();
                if (tenantId != null && !tenantId.isEmpty()) {
                    String[] tables = {
                        "students", "courses", "batches", "fees", "expenses", "staff", "attendance",
                        "scheduled_classes", "study_materials", "exams", "exam_entries",
                        "exam_entry_student_results", "external_exams", "receipts",
                        "staff_attendance", "activity_logs", "notifications", "users"
                    };

                    for (String table : tables) {
                        try {
                            entityManager.createNativeQuery("UPDATE " + table + " SET branch_id = :bId WHERE (branch_id IS NULL OR branch_id = 0) AND UPPER(tenant_id) = UPPER(:tId)")
                                    .setParameter("bId", mainBranchId)
                                    .setParameter("tId", tenantId)
                                    .executeUpdate();
                        } catch (Exception e) {
                            // ignore table errors
                        }
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
    }

    public Optional<Branch> getMainBranch() {
        return branchRepository.findByIsMainTrue();
    }

    @Transactional
    public Branch createBranch(Branch branch) {
        if (branch.isMain()) {
            // Unset current main branch
            branchRepository.findByIsMainTrue().ifPresent(oldMain -> {
                oldMain.setMain(false);
                branchRepository.save(oldMain);
            });
        }
        branch.setCreatedAt(LocalDateTime.now());
        branch.setUpdatedAt(LocalDateTime.now());
        branch.setStatus(normalizeStatus(branch.getStatus()));
        return branchRepository.save(branch);
    }

    @Transactional
    public Branch updateBranch(Branch branch) {
        Branch existing = branchRepository.findById(branch.getId())
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + branch.getId()));

        existing.setName(branch.getName());
        existing.setCode(branch.getCode());
        existing.setAddress(branch.getAddress());
        existing.setCity(branch.getCity());
        existing.setState(branch.getState());
        existing.setPincode(branch.getPincode());
        existing.setPhone(branch.getPhone());
        existing.setEmail(branch.getEmail());
        existing.setStatus(normalizeStatus(branch.getStatus()));
        existing.setUpdatedAt(LocalDateTime.now());

        if (branch.isMain()) {
            branchRepository.findByIsMainTrue().ifPresent(oldMain -> {
                if (!oldMain.getId().equals(branch.getId())) {
                    oldMain.setMain(false);
                    branchRepository.save(oldMain);
                }
            });
            existing.setMain(true);
        } else {
            existing.setMain(false);
        }

        return branchRepository.save(existing);
    }

    @Transactional
    public void setMainBranch(Long branchId) {
        branchRepository.findByIsMainTrue().ifPresent(oldMain -> {
            oldMain.setMain(false);
            oldMain.setUpdatedAt(LocalDateTime.now());
            branchRepository.save(oldMain);
        });

        branchRepository.findById(branchId).ifPresent(newMain -> {
            newMain.setMain(true);
            newMain.setUpdatedAt(LocalDateTime.now());
            branchRepository.save(newMain);
        });
    }

    public void deleteBranch(Long id) {
        branchRepository.deleteById(id);
    }
}
