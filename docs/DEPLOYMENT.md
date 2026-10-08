# Deployment Instructions (Spring Boot + Angular)

## 1) Build Backend

```bash
cd backend
./mvnw clean package
```

## 2) Configure Backend

Edit `backend/src/main/resources/application.properties`:

- `spring.datasource.*`
- `app.jwt.secret`
- `app.cors.allowed-origins`
- `app.ratelimit.*`

## 3) Run Backend

```bash
cd backend
java -jar target/institute-api-1.0.0.jar
```

## 4) Build Frontend

```bash
cd frontend
npm install
npm run build
```

## 5) Serve Frontend

Use any static web server:

```bash
npx serve -s dist
```

Or host `frontend/dist` behind Nginx/Apache.

## 6) Database Setup

Run schema once:

```sql
SOURCE database/migration.sql;
SOURCE database/V2__saas_multi_tenant_upgrade.sql;
```

## 7) Create First Super Admin

Use an existing admin in shared DB and update role to `Super Admin` in `roles` / `users`, or insert a super admin user manually.

## 8) Create Tenants

Use Super Admin panel:

- Create shared tenants
- Create dedicated tenants (auto DB creation)

## 9) Backup Automation

See [BACKUP.md](C:\Users\ammug\OneDrive\AMMU CLOUD\LANGUAGE PROGRAMMES\ANTIGRAVITY\Classivo\docs\BACKUP.md) for daily `mysqldump` automation.

