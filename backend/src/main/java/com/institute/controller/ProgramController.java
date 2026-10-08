package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.model.Program;
import com.institute.model.ProgramModule;
import com.institute.model.StudentProgramEnrollment;
import com.institute.service.ProgramService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/programs")
public class ProgramController {

    private final ProgramService programService;

    public ProgramController(ProgramService programService) {
        this.programService = programService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllPrograms() {
        return ResponseEntity.ok(ApiResponse.success(programService.getAllPrograms()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getProgramDetails(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(programService.getProgramDetails(id)));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse> saveProgram(@RequestBody Map<String, Object> body) {
        Program program = programService.saveProgram(body);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", program.getId());
        return ResponseEntity.ok(ApiResponse.success(data, body.containsKey("id") && body.get("id") != null ? "Program updated" : "Program created"));
    }

    @PostMapping("/delete")
    public ResponseEntity<ApiResponse> deleteProgram(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        programService.deleteProgram(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Program deleted successfully"));
    }

    @PostMapping("/{id}/modules")
    public ResponseEntity<ApiResponse> saveModule(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ProgramModule module = programService.saveModule(id, body);
        return ResponseEntity.ok(ApiResponse.success(module, "Module saved successfully"));
    }

    @PostMapping("/{id}/modules/reorder")
    public ResponseEntity<ApiResponse> reorderModules(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        List<Integer> ids = (List<Integer>) body.get("moduleIds");
        List<Long> moduleIds = ids.stream().map(Long::valueOf).toList();
        programService.reorderModules(id, moduleIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Modules reordered successfully"));
    }

    @DeleteMapping("/modules/{moduleId}")
    public ResponseEntity<ApiResponse> deleteModule(@PathVariable Long moduleId) {
        programService.deleteModule(moduleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Module removed successfully"));
    }

    @PostMapping("/enroll")
    public ResponseEntity<ApiResponse> enrollStudent(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("studentId").toString());
        Long programId = Long.valueOf(body.get("programId").toString());
        StudentProgramEnrollment spe = programService.enrollStudentInProgram(studentId, programId);
        return ResponseEntity.ok(ApiResponse.success(spe, "Student enrolled in program successfully"));
    }

    @GetMapping("/student/{studentId}/progress")
    public ResponseEntity<ApiResponse> getStudentProgress(@PathVariable Long studentId, @RequestParam Long programId) {
        Map<String, Object> progress = programService.getStudentProgramProgress(studentId, programId);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @PostMapping("/complete-module")
    public ResponseEntity<ApiResponse> completeModule(@RequestBody Map<String, Object> body) {
        Long progressId = Long.valueOf(body.get("progressId").toString());
        programService.completeModule(progressId);
        return ResponseEntity.ok(ApiResponse.success(null, "Module marked as complete"));
    }
}
