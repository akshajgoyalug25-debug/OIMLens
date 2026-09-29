-- ==============================================================================
-- OIMLense SIH26035 Supabase Migration: 'instruments' Table Schema Alignment
-- ==============================================================================
-- Issue: Supabase PostgREST PGRST204 column missing error (e.g. 'documentation_reference', 'd')
-- Solution: Add all required NAWI instrument specification & metadata columns.
-- ==============================================================================

-- 1. Ensure table base exists
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add identification & manufacturer details
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS instrument_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS accuracy_class TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS indication_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS weighing_principle TEXT;

-- 3. Add metrological parameters (capacity, scale intervals e & d, intervals n)
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS max_capacity NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS min_capacity NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS e NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS d NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS n NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS verification_scale_interval_e NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS actual_scale_interval_d NUMERIC;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS number_of_verification_scale_intervals_n NUMERIC;

-- 4. Add auxiliary features, markings, and technical references
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS tare_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS tare_device_type TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS type_approval_number TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS software_version TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS year_of_manufacture INTEGER;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS markings TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS descriptive_markings TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS documentation_reference TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS technical_document_reference TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 5. Add boolean feature flags
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS has_auxiliary_indicating_device BOOLEAN DEFAULT false;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS is_multiple_range BOOLEAN DEFAULT false;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS is_multi_interval BOOLEAN DEFAULT false;

-- 6. Add user ownership link
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS user_id UUID;
