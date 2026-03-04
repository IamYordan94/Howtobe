-- 3. Create the subjects table
CREATE TABLE subjects (
  id text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  is_published boolean DEFAULT false,
  coming_soon boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on subjects" ON subjects FOR SELECT USING (true);

-- 4. Create the connections table
CREATE TABLE connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_a text REFERENCES subjects(id),
  subject_b text REFERENCES subjects(id),
  description text
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on connections" ON connections FOR SELECT USING (true);

-- 5. Create the lessons table
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text REFERENCES subjects(id),
  title text NOT NULL,
  level text CHECK (level IN ('beginner','intermediate','advanced')),
  order_index integer DEFAULT 0,
  content text,
  is_published boolean DEFAULT false,
  is_preview boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on published lessons" ON lessons FOR SELECT USING (is_published = true OR is_preview = true);

-- 6. Create the users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  has_access boolean DEFAULT false,
  payment_date timestamp with time zone,
  notify_subjects text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- 7. Create the progress table
CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  lesson_id uuid REFERENCES lessons(id),
  completed_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own progress" ON progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON progress FOR INSERT WITH CHECK (auth.uid() = user_id);
