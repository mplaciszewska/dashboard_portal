## Setup

1. Clone the repository
```
git clone https://github.com/mplaciszewska/dashboard_portal.git
```

2. Create .env file based on .env.example


3. Start docker containers
```
docker compose up -d
```

4. Restore database and tiles backup
```
docker cp backup.sql postgis:/backup.sql
docker cp "path_to_tiles\." backend:/workspace/tiles/
docker exec -i postgis psql -U postgres -d  {postgres_db} -f /backup.sql;
```

Frontend app available at:  http://localhost:3000
Backend endpoints available at: http://localhost:8000/api


## Useful

1. Run cron job for updating database manually

```
docker exec cron /usr/local/bin/python -u -m backend.cron_job
```


<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/37f25cf0-d081-436d-8ea0-bae44016293c" />
<img width="1022" height="574" alt="image" src="https://github.com/user-attachments/assets/8815871d-83da-4859-a03d-5d97460175f1" />
