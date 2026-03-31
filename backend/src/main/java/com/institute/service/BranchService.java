package com.institute.service;

import com.institute.model.Branch;
import com.institute.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BranchService {
    private final BranchRepository branchRepository;

    private static String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) return "Active";
        String s = status.trim();
        if ("active".equalsIgnoreCase(s)) return "Active";
        if ("inactive".equalsIgnoreCase(s)) return "Inactive";
        return s;
    }

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public List<Branch> getActiveBranches() {
        // Be forgiving: existing rows might have "active" vs "Active".
        return branchRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc("Active");
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
        branch.setStatus(normalizeStatus(branch.getStatus()));
        return branchRepository.save(branch);
    }

    @Transactional
    public Branch updateBranch(Branch branch) {
        branch.setStatus(normalizeStatus(branch.getStatus()));
        if (branch.isMain()) {
            branchRepository.findByIsMainTrue().ifPresent(oldMain -> {
                if (!oldMain.getId().equals(branch.getId())) {
                    oldMain.setMain(false);
                    branchRepository.save(oldMain);
                }
            });
        }
        return branchRepository.save(branch);
    }

    @Transactional
    public void setMainBranch(Long branchId) {
        branchRepository.findByIsMainTrue().ifPresent(oldMain -> {
            oldMain.setMain(false);
            branchRepository.save(oldMain);
        });

        branchRepository.findById(branchId).ifPresent(newMain -> {
            newMain.setMain(true);
            branchRepository.save(newMain);
        });
    }

    public void deleteBranch(Long id) {
        branchRepository.deleteById(id);
    }
}
