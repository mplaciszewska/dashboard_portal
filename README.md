## Setup

1. Clone the repository
```
git clone https://github.com/mplaciszewska/dashboard_portal.git
```

2. Create .env file based on .env.example and modify these variables:
```
POSTGRES_DB=postgres_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

3. Start docker containers
```
docker compose up -d
```

4. Restore database backup and copy into your configured database
```
docker cp backup_good.sql postgis:/backup.sql
docker exec -i postgis psql -U <POSTGRES_USER> -d <POSTGRES_DB> -f /backup.sql
```

5. Run cron job for updating the database manually (Cron job rus every 2 weeks at 22:00)
```
docker exec cron /usr/local/bin/python -u -m backend.cron_job
```

Frontend app available at:  http://localhost:3000
Backend endpoints available at: http://localhost:8000/api

<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/37f25cf0-d081-436d-8ea0-bae44016293c" />
<img width="1022" height="574" alt="image" src="https://github.com/user-attachments/assets/8815871d-83da-4859-a03d-5d97460175f1" />

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
