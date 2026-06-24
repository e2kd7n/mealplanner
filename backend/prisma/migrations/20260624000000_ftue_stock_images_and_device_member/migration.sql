-- Add stock visual password image URL to family members (alternative to recipe-based visual password)
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "visual_password_image_url" TEXT;

-- Add family member tracking to device tokens (remember which member logged in)
ALTER TABLE "device_tokens" ADD COLUMN IF NOT EXISTS "family_member_id" TEXT;
