
-- Ensure Level 0 (Intern) exists in the vip_levels table
INSERT INTO public.vip_levels (id, level, name, price, daily_tasks, daily_income, monthly_income)
VALUES (0, 0, 'Intern', 0, 1, 0, 0)
ON CONFLICT (id) DO NOTHING;
