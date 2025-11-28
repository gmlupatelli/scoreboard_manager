-- Location: supabase/migrations/20251128213826_add_test_data.sql
-- Schema Analysis: Existing schema has user_profiles, scoreboards, scoreboard_entries with proper RLS
-- Integration Type: Additive - Adding test data only, no schema modifications
-- Dependencies: user_profiles, scoreboards, scoreboard_entries

-- Add comprehensive test data for testing scoreboard functionality
DO $$
DECLARE
    -- New test user
    test_user_uuid UUID := gen_random_uuid();
    
    -- Existing users (from sample data)
    existing_admin_uuid UUID;
    existing_user_uuid UUID;
    
    -- New scoreboards
    sports_scoreboard_id TEXT := 'scoreboard_' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT || '_sports';
    gaming_scoreboard_id TEXT := 'scoreboard_' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT || '_gaming';
    private_test_scoreboard_id TEXT := 'scoreboard_' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT || '_private';
BEGIN
    -- Get existing user IDs from sample data
    SELECT id INTO existing_admin_uuid FROM public.user_profiles WHERE email = 'admin@scoreboard.com';
    SELECT id INTO existing_user_uuid FROM public.user_profiles WHERE email = 'john@example.com';
    
    -- Create new test user with complete auth.users structure
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES (
        test_user_uuid, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated',
        'sarah@example.com', 
        crypt('test123', gen_salt('bf', 10)), 
        now(), 
        now(), 
        now(),
        '{"full_name": "Sarah Williams"}'::jsonb, 
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );

    -- Create additional public scoreboards with variety
    INSERT INTO public.scoreboards (id, title, subtitle, owner_id, visibility, sort_order, created_at, updated_at) VALUES
        (sports_scoreboard_id, 'Basketball Tournament 2025', 'Season player rankings and statistics', test_user_uuid, 'public'::public.scoreboard_visibility, 'desc', now(), now()),
        (gaming_scoreboard_id, 'Gaming Championship Leaderboard', 'Top players across all tournaments', existing_user_uuid, 'public'::public.scoreboard_visibility, 'desc', now(), now()),
        (private_test_scoreboard_id, 'Internal Testing Metrics', 'QA team performance tracking', test_user_uuid, 'private'::public.scoreboard_visibility, 'asc', now(), now());

    -- Add diverse scoreboard entries for sports leaderboard
    INSERT INTO public.scoreboard_entries (id, scoreboard_id, name, score, details, created_at, updated_at) VALUES
        ('entry_' || gen_random_uuid()::TEXT, sports_scoreboard_id, 'Alex Rodriguez', 2856, 'MVP candidate - 28.5 PPG, 8.2 APG', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, sports_scoreboard_id, 'Jordan Mitchell', 2734, 'Top scorer - 31.2 PPG, 5.7 RPG', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, sports_scoreboard_id, 'Emma Thompson', 2598, 'All-around player - 22.1 PPG, 9.5 RPG, 7.3 APG', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, sports_scoreboard_id, 'Marcus Davis', 2401, 'Defensive specialist - 18.3 PPG, 3.2 SPG', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, sports_scoreboard_id, 'Lisa Chen', 2287, 'Three-point leader - 19.8 PPG, 45% 3PT', now(), now());

    -- Add gaming championship entries
    INSERT INTO public.scoreboard_entries (id, scoreboard_id, name, score, details, created_at, updated_at) VALUES
        ('entry_' || gen_random_uuid()::TEXT, gaming_scoreboard_id, 'ProGamer_X', 15420, 'Tournament champion - 47 wins', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, gaming_scoreboard_id, 'NinjaWarrior', 14850, 'Runner-up - 42 wins, 5 second places', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, gaming_scoreboard_id, 'StrategicMind', 13975, 'Tactical genius - highest average strategy score', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, gaming_scoreboard_id, 'SpeedDemon99', 12680, 'Fastest completion times - 38 wins', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, gaming_scoreboard_id, 'ElitePlayer', 11945, 'Consistent performer - 35 wins', now(), now());

    -- Add private scoreboard entries (for testing private visibility)
    INSERT INTO public.scoreboard_entries (id, scoreboard_id, name, score, details, created_at, updated_at) VALUES
        ('entry_' || gen_random_uuid()::TEXT, private_test_scoreboard_id, 'Test Case Alpha', 98, 'All critical tests passed', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, private_test_scoreboard_id, 'Test Case Beta', 95, 'Minor issues in edge cases', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, private_test_scoreboard_id, 'Test Case Gamma', 87, 'Performance optimization needed', now(), now());

    -- Add more entries to existing Q4 Sales scoreboard for variety
    INSERT INTO public.scoreboard_entries (id, scoreboard_id, name, score, details, created_at, updated_at) VALUES
        ('entry_' || gen_random_uuid()::TEXT, 'scoreboard_1764365638.179892', 'David Martinez', 92300, 'New client acquisition specialist', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, 'scoreboard_1764365638.179892', 'Rachel Green', 89750, 'Territory expansion leader', now(), now()),
        ('entry_' || gen_random_uuid()::TEXT, 'scoreboard_1764365638.179892', 'Tom Anderson', 84500, 'Customer retention expert', now(), now());

    RAISE NOTICE 'Test data added successfully';
    RAISE NOTICE 'New test user: sarah@example.com / test123';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding test data: %', SQLERRM;
END $$;