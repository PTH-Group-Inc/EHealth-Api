BEGIN;

WITH ranked_user_roles AS (
    SELECT
        ur.user_id,
        ur.role_id,
        ROW_NUMBER() OVER (
            PARTITION BY ur.user_id
            ORDER BY
                CASE r.code
                    WHEN 'ADMIN' THEN 1
                    WHEN 'DOCTOR' THEN 2
                    WHEN 'PHARMACIST' THEN 3
                    WHEN 'STAFF' THEN 4
                    WHEN 'PATIENT' THEN 5
                    ELSE 999
                END,
                r.code,
                ur.role_id
        ) AS role_rank
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.roles_id
)
DELETE FROM user_roles ur
USING ranked_user_roles rur
WHERE ur.user_id = rur.user_id
  AND ur.role_id = rur.role_id
  AND rur.role_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_user
    ON user_roles (user_id);

COMMIT;
