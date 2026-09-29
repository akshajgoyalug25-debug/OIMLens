-- SQL Migration: Seed 78 OIML R76 Test Definitions
-- Generated for OIMLense SIH26035

CREATE TABLE IF NOT EXISTS public.test_definitions (
    id UUID PRIMARY KEY,
    test_code TEXT UNIQUE NOT NULL,
    test_name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'weighing',
    source_document TEXT DEFAULT 'OIML R 76-1:2006',
    source_clause TEXT DEFAULT 'A.4',
    report_clause TEXT,
    rule_version TEXT DEFAULT '2006',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing optional columns exist if table was created with an older schema
ALTER TABLE public.test_definitions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.test_definitions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'weighing';
ALTER TABLE public.test_definitions ADD COLUMN IF NOT EXISTS source_document TEXT DEFAULT 'OIML R 76-1:2006';
ALTER TABLE public.test_definitions ADD COLUMN IF NOT EXISTS source_clause TEXT DEFAULT 'A.4';
ALTER TABLE public.test_definitions ADD COLUMN IF NOT EXISTS report_clause TEXT;
ALTER TABLE public.test_definitions ADD COLUMN IF NOT EXISTS rule_version TEXT DEFAULT '2006';
ALTER TABLE public.test_definitions ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Ensure RLS policy allows public read access for client queries
ALTER TABLE public.test_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on test_definitions" ON public.test_definitions;
CREATE POLICY "Allow public read access on test_definitions" ON public.test_definitions FOR SELECT USING (true);

INSERT INTO public.test_definitions (id, test_code, test_name, description, category, source_document, source_clause, report_clause, rule_version, enabled)
VALUES
  ('3a36e3c3-2749-56d0-89ee-d8363b8b7c29', 'AUTO_ZERO_TRACKING', 'Auto Zero Tracking', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('c42015ef-e8e6-54c5-8702-8a99d3b0395f', 'AUXILIARY_INDICATING', 'Auxiliary Indicating', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('d6e8b3e8-4ef3-5513-9ccc-9652f83ef3de', 'BAROMETRIC_PRESSURE', 'Barometric Pressure', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('a7b1552b-a9e9-5730-a1c6-152df4f28ba0', 'BEAM_ROBERVAL_CHECK', 'Beam Roberval Check', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('18105128-830b-554f-a7cc-1e4875cb17cd', 'BURSTS_EFT', 'Bursts Eft', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('f71e3d56-2fef-5fe2-9f46-23d525936335', 'CHECKLIST_EXAMINATION', 'Checklist Examination', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('cc4ddc60-47e7-5006-b81e-fb89f1add947', 'CONDUCTED_RF_IMMUNITY', 'Conducted Rf Immunity', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('348b15b6-a3c2-5e8f-8f50-06a510f46ccc', 'CORNER_LOAD_ADJUSTMENT', 'Corner Load Adjustment', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('206f2ab9-5000-54a4-836a-f287a5313739', 'COUNTING_INSTRUMENT', 'Counting Instrument', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('28077d9e-7f95-56fe-a358-1ec8b563ff66', 'CREEP', 'Creep', 'Classes II, III and IIII according to R76', 'time_dependence', 'OIML R 76-1:2006', 'A.4.11.1', NULL, '2006', true),
  ('f61fad06-4692-5a11-918c-ad7eaa674994', 'DAMP_HEAT_STEADY', 'Damp Heat Steady', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('7896a145-9510-53f6-894f-09772a92b653', 'DATA_STORAGE_SECURITY', 'Data Storage Security', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('c8550ff6-a884-5319-827c-94d66bccb3c3', 'DESCRIPTIVE_MARKINGS', 'Descriptive Markings', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('c58fd634-74c4-5403-a89c-1c4abb57ba0f', 'DISCRIMINATION', 'Discrimination', 'According to indication type', 'performance', 'OIML R 76-1:2006', 'A.4.8', 'R76-2 Section 4.1', '2006', true),
  ('c9eb5dce-fe8d-52b7-a5e0-7782c2f3a775', 'DOCUMENTATION_CHECK', 'Documentation Check', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('9d6957a5-5a2d-50df-ac99-2bf8641eb5c8', 'ECCENTRIC_LOADING', 'Eccentricity', 'According to load receptor/support configuration', 'performance', 'OIML R 76-1:2006', 'A.4.7', 'R76-2 Section 3', '2006', true),
  ('de192c58-e9c8-59d1-99c0-dc126e92ead8', 'ECCENTRIC_ROLLING', 'Eccentric Rolling', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('17289673-6828-5d49-9581-ff41283345e9', 'ELECTROSTATIC_DISCHARGE', 'Electrostatic Discharge', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('feb24a76-4fd5-5659-a79f-ecb2c51f23de', 'ENDURANCE', 'Endurance test', 'According to instrument type and R76 requirements', 'endurance', 'OIML R 76-1:2006', 'A.6', 'R76-2 Section 15', '2006', true),
  ('b5b4b0a5-83f5-5544-9e56-64daa24b74a2', 'EQUILIBRIUM_STABILITY', 'Equilibrium Stability', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('001bee97-5c40-5267-b3d9-275fed9f49b7', 'HIGH_HUMIDITY_STORAGE', 'High Humidity Storage', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('568eaf39-809b-5063-88d2-c50a939f036a', 'HIGH_TEMP_OPERATION', 'High Temp Operation', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('5a7f252c-4c11-5617-bb94-ee4d1904c84f', 'HYSTERESIS_TEST', 'Hysteresis Test', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('ca7724b3-051e-563f-90da-9b1d749e760f', 'INDICATOR_DAMPING', 'Indicator Damping', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('b1a362c4-6f50-5448-929f-e87f17fda9c5', 'INITIAL_ZERO_SETTING', 'Initial Zero Setting', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('e737ca06-acea-5f07-8d53-13b54942d13e', 'LEVEL_INDICATOR', 'Level Indicator', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('2169b1f6-bc27-5c56-a5cc-3919d2b9a315', 'LOCKING_POSITIONS', 'Locking Positions', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('0ab7fe63-6eff-509d-b297-3fa26e8a0045', 'LOW_TEMP_OPERATION', 'Low Temp Operation', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('6952f578-e52c-5176-862e-7b93cf2fd345', 'MAGNETIC_FIELD', 'Magnetic Field', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('28d74f62-ad3b-57de-a706-1221844afbe1', 'MAINS_DIPS_INTERRUPTIONS', 'Mains Dips Interruptions', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('ef76f90b-d307-5b1b-8047-7fbb7b14cfb0', 'MINIMUM_CAPACITY_CHECK', 'Minimum Capacity Check', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('8e769f25-e74f-5cd2-b2fb-3639e379bef2', 'MOBILE_WEIGHING', 'Mobile Weighing', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('6eadeadf-f5b7-5042-ade4-0a2e31196f3d', 'MULTIPLE_RANGE_WEIGHING', 'Multiple Range Weighing', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('272e9d80-2b9a-527f-a0a0-3908596da385', 'MULTI_INTERVAL_WEIGHING', 'Multi Interval Weighing', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('0d2b40bb-e849-5a92-86c6-bdf73cc90891', 'MULTI_LOAD_RECEPTOR', 'Multi Load Receptor', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('d39ce795-adff-5d28-97af-27cc67612fd9', 'OPEN_AIR_WIND_EFFECT', 'Open Air Wind Effect', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('87ef3bfc-1301-5fda-bc0f-7ee5156b5376', 'OVERLOAD_PROTECTION', 'Overload Protection', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('f2ce7d29-ab9d-56d4-8f43-629d20742b59', 'PLUS_MINUS_COMPARATOR', 'Plus Minus Comparator', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('ef07ebbc-d887-53ed-a9c5-76ae4aab8ae3', 'PORTABLE_VEHICLE', 'Portable Vehicle', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('7ac64320-dfb4-5172-9de5-3a666226bf11', 'POWER_DC_SUPPLY', 'Power Dc Supply', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('44c12c60-b4cf-576f-95ec-52b7ccb74076', 'POWER_FREQUENCY_VARIATION', 'Power Frequency Variation', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('bdb0bcf3-36dd-5361-bc03-782000bc9225', 'PRESET_TARE', 'Preset Tare', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('ae61fb85-3dfa-553d-bd94-6575f5323b91', 'PRICE_COMPUTING', 'Price Computing', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('f8036d3c-acd2-51ed-a9a4-6ad9ab3c66fe', 'PRICE_LABELING', 'Price Labeling', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('55893d22-3cce-54b8-aa3a-5f4e5434efa0', 'RADIATED_RF_IMMUNITY', 'Radiated Rf Immunity', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('e451a22e-7b9e-56e7-868a-eaf2deb0c72b', 'REPEATABILITY', 'Repeatability', 'Applicable repeatability test', 'performance', 'OIML R 76-1:2006', 'A.4.10', 'R76-2 Section 5', '2006', true),
  ('87e674c3-0904-5d66-a350-edb67a1b6e12', 'SEALING_DEVICE', 'Sealing Device', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('76fc9703-f8d5-58ae-992d-58c286ed01f1', 'SENSITIVITY', 'Sensitivity', 'Non-self-indicating instruments', 'performance', 'OIML R 76-1:2006', 'A.4.9', 'R76-2 Section 4.2', '2006', true),
  ('1c2e8e75-6c58-585f-96ee-7727c87f8cf4', 'SOFTWARE_IDENTIFICATION', 'Software Identification', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('3ffedac8-7b71-5198-b414-79e40809ff11', 'SOFTWARE_PROTECTION', 'Software Protection', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('fe34d38c-2e5d-58bb-a1c9-f58eb28a46e0', 'SOLAR_RADIATION_SHIELD', 'Solar Radiation Shield', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('8ee592a3-37d3-52c9-ac22-85c4bbb3c5f0', 'SPAN_STABILITY', 'Span Stability', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('9e9fcfcb-b10b-546c-9d3a-52e8ef07a41e', 'STEELYARD_POISE_LIMIT', 'Steelyard Poise Limit', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('76f83cc2-51b3-595f-a26d-0e2cbc506a56', 'SUBSTITUTION_TEST', 'Substitution Test', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('85d59613-656a-54d5-b508-5304e1007639', 'SURGES_IMMUNITY', 'Surges Immunity', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('021aba59-8183-5c5b-a99b-14bd271bcd84', 'TARE_ACCURACY', 'Tare Accuracy', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('d4c3523c-5119-5c49-ab7d-a3d283d6df08', 'TARE_RANGE', 'Tare Range', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('33795de3-db08-5931-afc1-deb0b6d99f2f', 'TARE_WEIGHING', 'Tare Weighing', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('a53dcb86-0539-5c28-8430-82c9c89fced7', 'TEMPERATURE_STATIC', 'Static temperatures', 'According to applicable temperature requirements', 'influence_factor', 'OIML R 76-1:2006', 'A.5.3.1', NULL, '2006', true),
  ('fa31b5d1-e6f3-5879-b655-e08e3d01f4d6', 'TEMPERATURE_ZERO', 'Temperature effect on no-load indication', 'According to accuracy class', 'influence_factor', 'OIML R 76-1:2006', 'A.5.3.2', 'R76-2 Section 2', '2006', true),
  ('7c4a7390-b41e-5a39-9bc8-500dbdef67b1', 'TEMP_RAMP_CYCLING', 'Temp Ramp Cycling', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('2e0a5069-4271-5ba3-89a8-f0575aa55da2', 'TILTING_MOBILE', 'Tilting Mobile', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('efd63123-a389-5fd2-a773-08feb6547a26', 'TILTING_STATIC', 'Tilting Static', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('1b897afd-ffe1-5ab8-b462-679d800d9cda', 'VERIFICATION_MARKS', 'Verification Marks', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('85462bba-f37f-5221-9803-30b3afc1ea57', 'VIBRATION_RESISTANCE', 'Vibration Resistance', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('da26eecb-1c3b-5351-8ff2-0b2a936ccd8d', 'VOLTAGE_AC', 'AC mains voltage variation', 'Instruments powered from AC mains', 'influence_factor', 'OIML R 76-1:2006', 'A.5.4.1', NULL, '2006', true),
  ('dfe4f4e1-980b-55c0-a1dc-08d365764dc6', 'VOLTAGE_BATTERY', 'Battery voltage variation', 'Battery-powered instruments', 'influence_factor', 'OIML R 76-1:2006', 'A.5.4.3', NULL, '2006', true),
  ('4c2a4024-499a-5e0a-aacd-c49337487b84', 'VOLTAGE_EXTERNAL', 'External or plug-in power supply variation', 'According to power supply configuration', 'influence_factor', 'OIML R 76-1:2006', 'A.5.4.2', NULL, '2006', true),
  ('8324dd53-e5e2-5bad-bb5d-abe6418a4866', 'VOLTAGE_VEHICLE', '12 V or 24 V vehicle battery variation', 'Road-vehicle battery powered instruments', 'influence_factor', 'OIML R 76-1:2006', 'A.5.4.4', NULL, '2006', true),
  ('e15098b8-5d71-5c93-8fa6-5e557e0f6aaa', 'WARM_UP', 'Warm-up time', 'Electronic instruments according to R76', 'influence_factor', 'OIML R 76-1:2006', 'A.5.2', NULL, '2006', true),
  ('52257d3d-2e7c-5c06-8074-c60a91921a68', 'WARM_UP_ZERO_DRIFT', 'Warm Up Zero Drift', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('7cf4b3d6-daa8-529d-9019-aaf3afd85e0d', 'WEIGHING_PERFORMANCE', 'Weighing performance', 'Core performance test', 'performance', 'OIML R 76-1:2006', 'A.4.4.1', 'R76-2 Section 1', '2006', true),
  ('d04b8ce6-4a7f-500d-8928-0a145768c9f0', 'WEIGHING_REVERSE', 'Weighing Reverse', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('172559e3-9054-5e0b-9a9a-305ba31229db', 'ZERO_ACCURACY', 'Accuracy of zero-setting', 'Applicable according to zero-setting type', 'zero', 'OIML R 76-1:2006', 'A.4.2.3', NULL, '2006', true),
  ('8a0ace48-3e0f-538d-a9ed-064d23197eba', 'ZERO_RANGE', 'Range of zero-setting', 'Applicable according to instrument zero-setting configuration', 'zero', 'OIML R 76-1:2006', 'A.4.2.1', NULL, '2006', true),
  ('060de85e-0164-57bc-b406-703831c64d3a', 'ZERO_RETURN', 'Zero return', 'Classes II, III and IIII according to R76', 'time_dependence', 'OIML R 76-1:2006', 'A.4.11.2', 'R76-2 Section 6.1', '2006', true),
  ('61cea5b4-3d98-53be-9dac-2acd909884db', 'ZERO_SETTING_LIMITS', 'Zero Setting Limits', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true),
  ('92203bdd-a477-5132-a793-ec3e95e728a0', 'ZERO_TRACKING', 'Zero Tracking', 'Standard OIML R 76 procedure', 'weighing', 'OIML R 76-1:2006', 'A.4', NULL, '2006', true)
ON CONFLICT (test_code) DO UPDATE SET
  id = EXCLUDED.id,
  test_name = EXCLUDED.test_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  source_document = EXCLUDED.source_document,
  source_clause = EXCLUDED.source_clause,
  report_clause = EXCLUDED.report_clause,
  rule_version = EXCLUDED.rule_version,
  enabled = EXCLUDED.enabled;
