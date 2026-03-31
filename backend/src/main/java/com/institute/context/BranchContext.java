package com.institute.context;

public class BranchContext {
    private static final ThreadLocal<String> currentBranchId = new ThreadLocal<>();

    public static void setCurrentBranchId(String branchId) {
        currentBranchId.set(branchId);
    }

    public static String getCurrentBranchId() {
        return currentBranchId.get();
    }

    public static void clear() {
        currentBranchId.remove();
    }
}
