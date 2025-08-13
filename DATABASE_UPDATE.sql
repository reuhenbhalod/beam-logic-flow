-- Database Update Script for Enhanced Project Management
-- Run these commands in your Supabase SQL Editor

-- 1. Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS target_hourly_rate DECIMAL(10,2) DEFAULT 0;

-- 2. Add role column to time_entries table
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'engineering';

-- 3. Update existing projects with default values if needed
UPDATE projects 
SET 
  client_name = COALESCE(client_name, 'Client TBD'),
  project_type = COALESCE(project_type, 'engineering'),
  fee = COALESCE(fee, 0),
  start_date = COALESCE(start_date, created_at),
  target_hourly_rate = COALESCE(target_hourly_rate, 100)
WHERE client_name IS NULL OR project_type IS NULL OR fee IS NULL OR start_date IS NULL OR target_hourly_rate IS NULL;

-- 4. Update existing time entries with default role
UPDATE time_entries 
SET role = 'engineering' 
WHERE role IS NULL OR role = '';

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_name ON projects(client_name);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_fee ON projects(fee);
CREATE INDEX IF NOT EXISTS idx_time_entries_role ON time_entries(role);

-- 6. Update RLS policies to include new columns
-- Drop existing policies (only if they exist)
DROP POLICY IF EXISTS "Users can insert profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Recreate policies with new columns
CREATE POLICY "Users can insert profile" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Projects policies (only create if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view all projects') THEN
    CREATE POLICY "Users can view all projects" ON projects
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert projects') THEN
    CREATE POLICY "Users can insert projects" ON projects
      FOR INSERT WITH CHECK (auth.uid() = created_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update own projects') THEN
    CREATE POLICY "Users can update own projects" ON projects
      FOR UPDATE USING (auth.uid() = created_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete own projects') THEN
    CREATE POLICY "Users can delete own projects" ON projects
      FOR DELETE USING (auth.uid() = created_by);
  END IF;
END $$;

-- Time entries policies (only create if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can view all time entries') THEN
    CREATE POLICY "Users can view all time entries" ON time_entries
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can insert time entries') THEN
    CREATE POLICY "Users can insert time entries" ON time_entries
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can update own time entries') THEN
    CREATE POLICY "Users can update own time entries" ON time_entries
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Users can delete own time entries') THEN
    CREATE POLICY "Users can delete own time entries" ON time_entries
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Verify the changes
SELECT 
  'projects' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

SELECT 
  'time_entries' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
ORDER BY ordinal_position; 

## **✅ Time Entries Table Updated Successfully!**

The `time_entries` table now has:
- ✅ `id` (uuid)
- ✅ `user_id` (uuid) 
- ✅ `project_id` (uuid)
- ✅ `hours` (numeric)
- ✅ `description` (text)
- ✅ `date` (date)
- ✅ `created_at` (timestamp)
- ✅ **`role` (text)** ← **NEW COLUMN ADDED!**

## **🔍 Next Step: Check Projects Table**

Now run this query in your Supabase SQL Editor to see the current structure of the `projects` table:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
```

This will show us which of these new columns were successfully added to the `projects` table:
- `client_name` (text)
- `project_type` (text) 
- `fee` (decimal)
- `start_date` (date)
- `end_date` (date)
- `target_hourly_rate` (decimal)

## **📋 What to Expect:**

If all columns were added successfully, you should see:
1. **Original columns**: id, name, description, status, progress, created_by, created_at, updated_at
2. **New columns**: client_name, project_type, fee, start_date, end_date, target_hourly_rate

## **📝 After Verification:**

Once you confirm all columns are there, you can:
1. **Test creating a new project** with all the enhanced fields
2. **Log time with role selection** 
3. **View the enhanced dashboard** with financial metrics
4. **Generate advanced reports**


Now run this **clean SQL query** in your Supabase SQL Editor:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
```

## **📋 What This Will Show:**

This query will display all columns in your `projects` table, including:
- **Original columns**: id, name, description, status, progress, created_by, created_at, updated_at
- **New columns** (if added successfully): client_name, project_type, fee, start_date, end_date, target_hourly_rate

## **🚀 Steps:**

1. **Go to Supabase SQL Editor**
2. **Copy and paste the clean SQL query above**
3. **Click Run**
4. **Share the results** so I can see which columns were successfully added

## **🔍 Expected Results:**

If all new columns were added successfully, you should see something like:
```
client_name | text | YES | ''
project_type | text | YES | ''
fee | numeric | YES | 0
start_date | date | YES | CURRENT_DATE
end_date | date | YES | 
target_hourly_rate | numeric | YES | 0
```

**Run the clean SQL query and let me know what you see!** 🎯 