ALTER TABLE "users" ADD COLUMN "name" TEXT;

UPDATE "users"
SET "name" = CASE
  WHEN "email" ~ '^customer[0-9]{2}@brewlite\.test$'
    THEN 'Customer ' || substring("email" FROM 9 FOR 2)
  ELSE initcap(replace(replace(split_part("email", '@', 1), '.', ' '), '_', ' '))
END
WHERE "name" IS NULL;

ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
