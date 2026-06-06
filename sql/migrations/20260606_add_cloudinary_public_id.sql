ALTER TABLE phar_media_files
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;
