
-- 1. Create Plays Table (History of wins/losses)
CREATE TABLE IF NOT EXISTS public.luck_card_plays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    source TEXT NOT NULL,
    reward_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.luck_card_plays ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policies
-- Allow user to insert their own records (Backend function runs as security definer, so this is mainly for client-side inserts if needed, but RPC handles it)
CREATE POLICY "User inserts own luck card play" ON public.luck_card_plays 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow user to read their own history
CREATE POLICY "User reads own luck card play" ON public.luck_card_plays 
FOR SELECT USING (auth.uid() = user_id);

-- 4. Add attempts column to users table (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS luck_card_attempts INTEGER DEFAULT 0 NOT NULL;

-- 5. Create/Replace the Game Logic Function (RPC)
CREATE OR REPLACE FUNCTION public.play_luck_card(
  p_user_id uuid,
  p_source text,
  p_reward_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_attempts int;
BEGIN
  -- Check attempts
  SELECT luck_card_attempts INTO current_attempts FROM public.users WHERE id = p_user_id;
  
  IF current_attempts IS NULL OR current_attempts <= 0 THEN
    RAISE EXCEPTION 'No attempts remaining';
  END IF;

  -- Update user: deduct 1 attempt, add reward to balance
  UPDATE public.users
  SET 
    luck_card_attempts = luck_card_attempts - 1,
    balance = balance + p_reward_amount
  WHERE id = p_user_id;

  -- Insert play record into history
  INSERT INTO public.luck_card_plays (user_id, source, reward_amount)
  VALUES (p_user_id, p_source, p_reward_amount);

  -- Return the reward amount to confirm success
  RETURN p_reward_amount;
END;
$$;
