package com.institute.controller;

import com.institute.model.Branch;
import com.institute.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BranchController {
    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Branch>> getActiveBranches() {
        return ResponseEntity.ok(branchService.getActiveBranches());
    }

    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        return ResponseEntity.ok(branchService.createBranch(branch));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id, @RequestBody Branch branch) {
        branch.setId(id);
        return ResponseEntity.ok(branchService.updateBranch(branch));
    }

    @PostMapping("/{id}/set-main")
    public ResponseEntity<Void> setMainBranch(@PathVariable Long id) {
        branchService.setMainBranch(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok().build();
    }
}
