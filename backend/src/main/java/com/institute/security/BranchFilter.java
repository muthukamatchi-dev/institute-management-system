package com.institute.security;

import com.institute.context.BranchContext;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class BranchFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest) {
            String branchId = ((HttpServletRequest) request).getHeader("X-Branch-ID");
            if (branchId != null) {
                BranchContext.setCurrentBranchId(branchId);
            } else {
                BranchContext.setCurrentBranchId("all");
            }
        }
        try {
            chain.doFilter(request, response);
        } finally {
            BranchContext.clear();
        }
    }
}
