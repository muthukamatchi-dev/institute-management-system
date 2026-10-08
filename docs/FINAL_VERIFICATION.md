# Step 15 — Final Verification Checklist

Use this checklist after deploying the updated system.

## 1) Existing IMS Functionality
Verify these core flows still work with no regressions:

- Login for Admin, Staff, Student (shared tenant)
- Student CRUD
- Courses and Batches
- Fees + Receipts
- Attendance
- Exams (internal + external)
- Reports
- Settings
- File uploads (study material)

## 2) Shared Tenant Isolation
Create two shared tenants (e.g. `ABC`, `XYZ`) and verify:

- Each tenant can log in using its `tenant_code`.
- Data created in tenant `ABC` does NOT appear in `XYZ`.
- `tenant_id` filters are active in all key modules.

## 3) Dedicated Tenant Databases
Create one dedicated tenant and verify:

- Dedicated DB is created (e.g. `ims_abc_db`).
- Tenant data only exists in its dedicated DB.
- Shared DB contains only tenant master and shared system data.

## 4) Trial System
Verify for a tenant:

- Trial start/end set on creation.
- Login works within trial.
- Login fails after trial expiry with:
  `Subscription expired. Please renew.`

## 5) Tenant Onboarding
When creating a tenant, confirm:

- Tenant record created
- Admin user created
- Default settings created
- Default branch created
- For dedicated: DB created

## 6) Super Admin Panel
Verify:

- View all tenants
- Create tenant
- Enable/disable tenant
- Switch shared/dedicated
- Reset admin password
- View trial stats

## 7) JWT + Auth
Verify:

- Login returns `jwt_token`
- API accepts JWT in `Authorization: Bearer <token>`
- Legacy tokens still work
- Role access works for SUPER_ADMIN endpoints

## 8) Rate Limiting
Trigger >120 requests/minute from same IP and confirm:

- API returns `429 Too Many Requests`

## 9) Data Isolation Regression Checks
Spot-check:

- `students`, `staff`, `fees`, `attendance`, `exams`, `custom_fields`

