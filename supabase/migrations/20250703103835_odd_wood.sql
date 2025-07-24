/*
  # Insert sample data

  1. Sample Data
    - Sample menu items with various categories
    - Realistic food items with proper pricing and descriptions

  Note: This is sample data for development and testing purposes
*/

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, image_url, category, serves, canteen_name, rating, quantity_available) VALUES
  ('Chicken Biryani', 'Aromatic basmati rice with tender chicken pieces and traditional spices', 120.00, 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg', 'main_course', 1, 'Main Canteen', 4.5, 25),
  ('Veg Thali', 'Complete vegetarian meal with dal, sabzi, roti, rice and pickle', 80.00, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', 'main_course', 1, 'Main Canteen', 4.2, 30),
  ('Masala Dosa', 'Crispy rice crepe filled with spiced potato filling, served with chutney', 60.00, 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg', 'south_indian', 1, 'South Indian Corner', 4.7, 20),
  ('Paneer Butter Masala', 'Rich and creamy paneer curry with butter and aromatic spices', 100.00, 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg', 'main_course', 1, 'Main Canteen', 4.4, 15),
  ('Samosa Chat', 'Crispy samosas topped with chutneys, yogurt and spices', 40.00, 'https://images.pexels.com/photos/14477797/pexels-photo-14477797.jpeg', 'snacks', 1, 'Snacks Counter', 4.1, 40),
  ('Chicken Sandwich', 'Grilled chicken sandwich with fresh vegetables and mayo', 70.00, 'https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg', 'snacks', 1, 'Snacks Counter', 4.0, 25),
  ('Mango Lassi', 'Refreshing yogurt drink blended with sweet mango pulp', 35.00, 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg', 'beverages', 1, 'Juice Corner', 4.3, 50),
  ('Masala Chai', 'Traditional Indian spiced tea with milk and aromatic spices', 15.00, 'https://images.pexels.com/photos/1793037/pexels-photo-1793037.jpeg', 'beverages', 1, 'Tea Stall', 4.6, 100),
  ('Rajma Rice', 'Kidney bean curry served with steamed basmati rice', 85.00, 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg', 'main_course', 1, 'Main Canteen', 4.2, 20),
  ('Idli Sambhar', 'Steamed rice cakes served with lentil curry and coconut chutney', 45.00, 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg', 'south_indian', 1, 'South Indian Corner', 4.5, 35),
  ('Vada Pav', 'Mumbai street food - spiced potato fritter in a bun with chutneys', 25.00, 'https://images.pexels.com/photos/14477797/pexels-photo-14477797.jpeg', 'snacks', 1, 'Snacks Counter', 4.0, 60),
  ('Fresh Lime Water', 'Refreshing lime juice with mint and a hint of salt', 20.00, 'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg', 'beverages', 1, 'Juice Corner', 4.1, 80);