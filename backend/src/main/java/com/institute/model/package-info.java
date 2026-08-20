/**
 * Global Hibernate filter definitions for the model package.
 * The branchFilter is declared ONCE here to avoid the
 * "Multiple @FilterDef annotations define a filter named 'branchFilter'" error.
 * Each entity that needs it only uses @Filter (not @FilterDef).
 *
 * tenantFilter: SaaS multi-tenant isolation for shared database mode.
 * Each entity uses @Filter(name = "tenantFilter") to scope queries by tenant_id.
 */
@FilterDefs({
    @FilterDef(name = "branchFilter", parameters = @ParamDef(name = "branchId", type = Long.class)),
    @FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
})
package com.institute.model;

import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.FilterDefs;
import org.hibernate.annotations.ParamDef;
