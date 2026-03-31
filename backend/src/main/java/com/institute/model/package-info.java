/**
 * Global Hibernate filter definitions for the model package.
 * The branchFilter is declared ONCE here to avoid the
 * "Multiple @FilterDef annotations define a filter named 'branchFilter'" error.
 * Each entity that needs it only uses @Filter (not @FilterDef).
 */
@FilterDef(name = "branchFilter", parameters = @ParamDef(name = "branchId", type = Long.class))
package com.institute.model;

import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
