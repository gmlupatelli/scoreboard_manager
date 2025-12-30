-- Add custom styling fields to scoreboards table
ALTER TABLE scoreboards
ADD COLUMN IF NOT EXISTS custom_styles jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS style_scope varchar(20) DEFAULT 'both' CHECK (style_scope IN ('main', 'embed', 'both'));

COMMENT ON COLUMN scoreboards.custom_styles IS 'JSON object containing custom style settings (backgroundColor, textColor, headerColor, borderColor, fontFamily, borderRadius, etc.)';
COMMENT ON COLUMN scoreboards.style_scope IS 'Where custom styles are applied: main (public view only), embed (iframe only), or both';
