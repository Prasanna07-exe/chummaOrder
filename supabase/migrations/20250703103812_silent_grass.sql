/*
  # Create menu items table

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text) - item name
      - `description` (text) - item description
      - `price` (decimal) - item price
      - `image_url` (text) - item image URL
      - `category` (text) - food category
      - `serves` (integer) - number of people it serves
      - `canteen_name` (text) - which canteen/stall
      - `rating` (decimal) - average rating
      - `quantity_available` (integer) - available quantity
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `menu_items` table
    - Add policy for everyone to read menu items
    - Add policy for staff to manage menu items
*/

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  image_url text NOT NULL,
  category text NOT NULL,
  serves integer NOT NULL DEFAULT 1 CHECK (serves > 0),
  canteen_name text NOT NULL,
  rating decimal(3,2) DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
  quantity_available integer NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'staff'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();