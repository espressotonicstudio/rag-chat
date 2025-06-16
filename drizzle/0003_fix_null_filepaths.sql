-- Fix existing NULL filePaths values by setting them to empty array
UPDATE "User" SET "filePaths" = '{}' WHERE "filePaths" IS NULL;