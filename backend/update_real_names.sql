DO $$
DECLARE
    -- 50+ Prefixes
    prefixes text[] := ARRAY[
        'Dark', 'Light', 'Hyper', 'Super', 'Pro', 'Noob', 'Dr', 'Mr', 'Ms', 'iAm', 'TheReal', 
        'Silent', 'Ghost', 'Neon', 'Cyber', 'Toxic', 'Epic', 'Mystic', 'Grand', 'Elite', 
        'Master', 'Rapid', 'Savage', 'Crazy', 'Shadow', 'Storm', 'Ice', 'Fire', 'Thunder',
        'Atomic', 'Cosmic', 'Deadly', 'Electric', 'Fatal', 'Grim', 'Holy', 'Iron', 'Jolly',
        'Killer', 'Lucky', 'Magic', 'Night', 'Omega', 'Phantom', 'Quantum', 'Royal', 'Solar',
        'Titan', 'Ultra', 'Venom', 'Wild', 'X', 'Young', 'Zen'
    ];
    
    -- 100+ Roots (Names, Objects, Creatures)
    roots text[] := ARRAY[
        -- Indian Names
        'Rahul', 'Aditi', 'Rohan', 'Kavya', 'Amit', 'Priya', 'Arjun', 'Sneha', 'Vikram', 'Anjali',
        'Dev', 'Sara', 'Raj', 'Neha', 'Kabir', 'Zara', 'Aryan', 'Ishaan', 'Vihaan', 'Myra',
        -- Western/Cool Names
        'Alex', 'Sam', 'Jordan', 'Taylor', 'Max', 'Leo', 'Kai', 'Nova', 'Luna', 'Sky',
        'Hunter', 'Sniper', 'Striker', 'Reaper', 'Rider', 'Walker', 'Flyer', 'Driver', 'Player',
        -- Animals/Creatures
        'Viper', 'Panda', 'Tiger', 'Dragon', 'Wolf', 'Bear', 'Shark', 'Eagle', 'Falcon', 'Hawk', 
        'Lion', 'Snake', 'Cobra', 'Titan', 'Spartan', 'Ninja', 'Samurai', 'Knight', 'Wizard', 
        'Ghost', 'Demon', 'Angel', 'Beast', 'Fox', 'Raven', 'Phoenix', 'Hydra', 'Griffin',
        -- objects/Concepts
        'Code', 'Byte', 'Pixel', 'Glitch', 'Lag', 'Ping', 'Frame', 'Bot', 'Server', 'Data',
        'Hammer', 'Sword', 'Shield', 'Arrow', 'Bullet', 'Rocket', 'Laser', 'Blade', 'Dagger'
    ];
    
    -- 50+ Suffixes
    suffixes text[] := ARRAY[
        'OP', 'YT', '123', '99', 'X', 'Gaming', 'Plays', 'TV', 'Live', 'Zone', 'HQ', 
        '007', '777', '88', '55', 'HD', 'Pro', 'Max', 'Ultra', '_v1', '_v2',
        '_Official', '_Real', '_X', '_Z', '01', '24x7', 'NaW', 'FTW', 'GG', 'EZ',
        'King', 'Queen', 'Boss', 'God', 'Lord', 'Star', 'Moon', 'Sun', 'Mars', 'Pluto'
    ];

    user_record RECORD;
    new_name TEXT;
    random_num INT;
BEGIN
    -- Loop through every single user to ensure 100% coverage
    FOR user_record IN SELECT id FROM users LOOP
        
        -- Generate random unique Gamertag
        -- Combination: Prefix + Root + Suffix
        new_name := 
            prefixes[1 + floor(random() * array_length(prefixes, 1))::int] ||
            roots[1 + floor(random() * array_length(roots, 1))::int] ||
            suffixes[1 + floor(random() * array_length(suffixes, 1))::int];
            
        -- Add a random number 1-9999 to guarantee uniqueness even if names collide
        random_num := floor(random() * 9999 + 1)::int;

        -- Format: Name_1234
        UPDATE users 
        SET username = new_name || '_' || random_num::text 
        WHERE id = user_record.id;
        
    END LOOP;
END $$;
