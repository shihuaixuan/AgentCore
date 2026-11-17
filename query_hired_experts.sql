SELECT e."templateKey", t."name" AS template_name, e."id", e."name" AS hire_name, e."role", e."jobTitle", e."tagline", left(coalesce(e."bio",''),80) AS bio, left(coalesce(e."identity",''),80) AS identity
FROM platform."Expert" e
JOIN platform."Expert" t ON t."id"=e."sourceTemplateId"
WHERE e."isTemplate"=false AND e."sourceTemplateId" IS NOT NULL
ORDER BY e."templateKey", e."id";
