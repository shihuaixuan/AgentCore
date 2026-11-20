UPDATE "Profile"
SET description = '', "updatedAt" = CURRENT_TIMESTAMP
WHERE description = 'I''m new here'
  AND "updatedAt" = "createdAt";
