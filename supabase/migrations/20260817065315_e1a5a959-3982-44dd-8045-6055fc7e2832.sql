UPDATE public.listings
SET images = ARRAY[]::text[]
WHERE images IS NOT NULL
  AND array_length(images, 1) = 1
  AND images[1] LIKE '%placeholder.svg%';