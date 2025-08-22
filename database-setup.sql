-- Create people table
CREATE TABLE IF NOT EXISTS people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  department TEXT,
  hourly_rate DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Create policy for people table
CREATE POLICY "Users can view all people" ON people FOR SELECT USING (true);
CREATE POLICY "Users can insert people" ON people FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update people" ON people FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete people" ON people FOR DELETE USING (auth.uid() = created_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS people_created_by_idx ON people(created_by);
CREATE INDEX IF NOT EXISTS people_name_idx ON people(name);
CREATE INDEX IF NOT EXISTS people_role_idx ON people(role);
CREATE INDEX IF NOT EXISTS people_department_idx ON people(department); 