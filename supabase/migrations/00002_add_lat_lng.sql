-- Add latitude/longitude to signals for world map visualization
ALTER TABLE signals ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE signals ADD COLUMN longitude DOUBLE PRECISION;
