import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PlanTier = 'basic' | 'growth' | 'professional' | 'enterprise';

/** Ordered plan tiers — index = privilege level */
const PLAN_ORDER: PlanTier[] = ['basic', 'growth', 'professional', 'enterprise'];

/** Map features to the minimum plan required */
const FEATURE_PLAN_MAP: Record<string, PlanTier> = {
    staffLogin:        'growth',
    studentLogin:      'growth',
    attendance:        'growth',
    scheduleClass:     'growth',
    expenses:          'growth',
    smtp:              'growth',
    programs:          'growth',
    adminAsStaff:      'professional',
    exams:             'professional',
    performanceExams:  'professional',
    standardCourses:   'professional',
    branches:          'enterprise',
    studyMaterial:     'enterprise',
};

/**
 * PlanService — Single source of truth for the active tenant's plan.
 * Plan is stored in localStorage as 'tenantPlan' and loaded at boot.
 * The AuthService calls setPlan() on login.
 */
@Injectable({ providedIn: 'root' })
export class PlanService {
    private planSubject = new BehaviorSubject<PlanTier>(this.loadStoredPlan());
    public plan$ = this.planSubject.asObservable();

    get currentPlan(): PlanTier {
        return this.planSubject.value;
    }

    /** Called by AuthService after a successful login */
    setPlan(plan: string): void {
        const normalized = this.normalize(plan);
        localStorage.setItem('tenantPlan', normalized);
        this.planSubject.next(normalized);
    }

    /** Clear plan on logout */
    clearPlan(): void {
        localStorage.removeItem('tenantPlan');
        this.planSubject.next('basic');
    }

    /**
     * Check whether the current plan meets or exceeds a minimum required tier.
     * @param minPlan The minimum plan required.
     */
    hasPlan(minPlan: PlanTier): boolean {
        const current = PLAN_ORDER.indexOf(this.currentPlan);
        const required = PLAN_ORDER.indexOf(minPlan);
        return current >= required;
    }

    /**
     * Check if a named feature is available on the current plan.
     * @param feature One of the feature keys defined in FEATURE_PLAN_MAP.
     */
    canUse(feature: string): boolean {
        const required = FEATURE_PLAN_MAP[feature];
        if (!required) return true; // unknown feature = always allowed
        return this.hasPlan(required);
    }

    /** Returns a human-readable plan name for display. */
    getPlanLabel(): string {
        const labels: Record<PlanTier, string> = {
            basic:        'Basic',
            growth:       'Growth',
            professional: 'Professional',
            enterprise:   'Enterprise',
        };
        return labels[this.currentPlan] ?? 'Basic';
    }

    /** Returns the minimum plan name required for a feature (for upgrade prompts). */
    getRequiredPlanFor(feature: string): string {
        const required = FEATURE_PLAN_MAP[feature] as PlanTier | undefined;
        if (!required) return '';
        const labels: Record<PlanTier, string> = {
            basic: 'Basic', growth: 'Growth', professional: 'Professional', enterprise: 'Enterprise'
        };
        return labels[required];
    }

    private normalize(plan: string): PlanTier {
        if (PLAN_ORDER.includes(plan as PlanTier)) return plan as PlanTier;
        return 'basic';
    }

    private loadStoredPlan(): PlanTier {
        const stored = localStorage.getItem('tenantPlan');
        return this.normalize(stored ?? 'basic');
    }
}
