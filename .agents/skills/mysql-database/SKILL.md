---
name: mysql-database
description: >-
  Provides the exact credentials, binary location, and command templates for connecting to the local
  MySQL database for Classivo / Institute Management (institute_db).
---

# MySQL Database Access Guide

This repository connects to local MySQL Server 26.7.

## Connection Parameters
- **Binary Path**: `C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe`
- **Host**: `localhost`
- **Port**: `3306`
- **User**: `root`
- **Password**: `muthu`
- **Database**: `institute_db`

## How to Execute SQL Queries in PowerShell
Execute MySQL queries directly using the installed client binary:

```powershell
& "C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe" -u root -pmuthu institute_db -e "SELECT * FROM external_participants WHERE exam_id = 8;"
```
