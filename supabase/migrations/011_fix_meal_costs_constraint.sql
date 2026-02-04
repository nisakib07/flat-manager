-- Clean up duplicate meal entries, keeping only the latest one per user/date/type
-- This is required before adding the UNIQUE constraint

DELETE FROM meal_costs a USING (
    SELECT MIN(created_at) as min_created, user_id, meal_date, meal_type
    FROM meal_costs
    GROUP BY user_id, meal_date, meal_type
    HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.meal_date = b.meal_date 
AND a.meal_type = b.meal_type 
AND a.created_at = b.min_created;

-- Add UNIQUE constraint to prevent future duplicates
-- This enables reliable UPSERT operations
ALTER TABLE meal_costs 
ADD CONSTRAINT meal_costs_user_date_type_key UNIQUE (user_id, meal_date, meal_type);
