package com.institute.security;

import com.institute.context.BranchContext;
import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class HibernateFilterAspect {

    @Autowired
    private EntityManager entityManager;

    @Before("execution(* com.institute.service.*.*(..)) && !execution(* com.institute.service.BranchService.*(..))")
    public void enableBranchFilter() {
        String branchId = BranchContext.getCurrentBranchId();
        if (branchId != null && !branchId.equals("all")) {
            try {
                Long bId = Long.parseLong(branchId);
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter("branchFilter").setParameter("branchId", bId);
            } catch (NumberFormatException e) {
                // Ignore if branchId is not a number and not "all"
            }
        }
    }
}
