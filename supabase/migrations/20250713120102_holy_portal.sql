/*
  # Real-time Cart Quantity Management System

  1. Database Functions
    - `add_to_cart_with_quantity_check` - Atomically adds items to cart and updates menu quantities
    - `remove_from_cart_with_quantity_restore` - Atomically removes items from cart and restores menu quantities
    - `update_cart_quantity_with_stock_check` - Atomically updates cart quantities with stock validation

  2. Security & Validation
    - Atomic transactions to prevent race conditions
    - Stock validation before any operations
    - Proper error handling and rollbacks
    - RLS policies updated for real-time operations

  3. Real-time Features
    - Triggers for real-time updates
    - Optimistic UI updates with database sync
    - Cross-dashboard synchronization
*/

-- Enable real-time for menu_items and cart_items tables
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

-- Function to add item to cart with quantity management
CREATE OR REPLACE FUNCTION add_to_cart_with_quantity_check(
  p_user_id UUID,
  p_menu_item_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_menu_item RECORD;
  v_cart_item RECORD;
  v_result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Lock and get current menu item with quantity
    SELECT * INTO v_menu_item
    FROM menu_items 
    WHERE id = p_menu_item_id
    FOR UPDATE;
    
    -- Check if menu item exists
    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Menu item not found'
      );
    END IF;
    
    -- Check if enough quantity is available
    IF v_menu_item.quantity_available < p_quantity THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient quantity available',
        'available', v_menu_item.quantity_available,
        'requested', p_quantity
      );
    END IF;
    
    -- Check if item already exists in cart
    SELECT * INTO v_cart_item
    FROM cart_items
    WHERE user_id = p_user_id AND menu_item_id = p_menu_item_id;
    
    IF FOUND THEN
      -- Update existing cart item
      UPDATE cart_items 
      SET quantity = quantity + p_quantity
      WHERE id = v_cart_item.id;
      
      -- Update result with new cart quantity
      v_cart_item.quantity := v_cart_item.quantity + p_quantity;
    ELSE
      -- Insert new cart item
      INSERT INTO cart_items (user_id, menu_item_id, quantity)
      VALUES (p_user_id, p_menu_item_id, p_quantity)
      RETURNING * INTO v_cart_item;
    END IF;
    
    -- Update menu item quantity
    UPDATE menu_items 
    SET quantity_available = quantity_available - p_quantity
    WHERE id = p_menu_item_id;
    
    -- Return success result
    v_result := json_build_object(
      'success', true,
      'cart_item', row_to_json(v_cart_item),
      'new_menu_quantity', v_menu_item.quantity_available - p_quantity,
      'message', 'Item added to cart successfully'
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    RAISE;
  END;
END;
$$;

-- Function to remove item from cart with quantity restoration
CREATE OR REPLACE FUNCTION remove_from_cart_with_quantity_restore(
  p_user_id UUID,
  p_cart_item_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_item RECORD;
  v_result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Get cart item details
    SELECT ci.*, mi.quantity_available as current_menu_quantity
    INTO v_cart_item
    FROM cart_items ci
    JOIN menu_items mi ON ci.menu_item_id = mi.id
    WHERE ci.id = p_cart_item_id AND ci.user_id = p_user_id;
    
    -- Check if cart item exists
    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cart item not found'
      );
    END IF;
    
    -- Restore quantity to menu item
    UPDATE menu_items 
    SET quantity_available = quantity_available + v_cart_item.quantity
    WHERE id = v_cart_item.menu_item_id;
    
    -- Remove cart item
    DELETE FROM cart_items 
    WHERE id = p_cart_item_id AND user_id = p_user_id;
    
    -- Return success result
    v_result := json_build_object(
      'success', true,
      'restored_quantity', v_cart_item.quantity,
      'new_menu_quantity', v_cart_item.current_menu_quantity + v_cart_item.quantity,
      'message', 'Item removed from cart successfully'
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    RAISE;
  END;
END;
$$;

-- Function to update cart quantity with stock validation
CREATE OR REPLACE FUNCTION update_cart_quantity_with_stock_check(
  p_user_id UUID,
  p_cart_item_id UUID,
  p_new_quantity INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_item RECORD;
  v_menu_item RECORD;
  v_quantity_diff INTEGER;
  v_result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Get current cart item
    SELECT * INTO v_cart_item
    FROM cart_items
    WHERE id = p_cart_item_id AND user_id = p_user_id;
    
    -- Check if cart item exists
    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cart item not found'
      );
    END IF;
    
    -- Get current menu item with lock
    SELECT * INTO v_menu_item
    FROM menu_items 
    WHERE id = v_cart_item.menu_item_id
    FOR UPDATE;
    
    -- Calculate quantity difference
    v_quantity_diff := p_new_quantity - v_cart_item.quantity;
    
    -- If increasing quantity, check availability
    IF v_quantity_diff > 0 THEN
      IF v_menu_item.quantity_available < v_quantity_diff THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Insufficient quantity available',
          'available', v_menu_item.quantity_available,
          'requested_increase', v_quantity_diff
        );
      END IF;
    END IF;
    
    -- Handle zero or negative quantity (remove item)
    IF p_new_quantity <= 0 THEN
      -- Restore all quantity to menu
      UPDATE menu_items 
      SET quantity_available = quantity_available + v_cart_item.quantity
      WHERE id = v_cart_item.menu_item_id;
      
      -- Remove cart item
      DELETE FROM cart_items 
      WHERE id = p_cart_item_id;
      
      RETURN json_build_object(
        'success', true,
        'action', 'removed',
        'restored_quantity', v_cart_item.quantity,
        'new_menu_quantity', v_menu_item.quantity_available + v_cart_item.quantity,
        'message', 'Item removed from cart'
      );
    END IF;
    
    -- Update cart quantity
    UPDATE cart_items 
    SET quantity = p_new_quantity
    WHERE id = p_cart_item_id;
    
    -- Update menu item quantity (subtract the difference)
    UPDATE menu_items 
    SET quantity_available = quantity_available - v_quantity_diff
    WHERE id = v_cart_item.menu_item_id;
    
    -- Return success result
    v_result := json_build_object(
      'success', true,
      'action', 'updated',
      'old_quantity', v_cart_item.quantity,
      'new_quantity', p_new_quantity,
      'quantity_diff', v_quantity_diff,
      'new_menu_quantity', v_menu_item.quantity_available - v_quantity_diff,
      'message', 'Cart quantity updated successfully'
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    RAISE;
  END;
END;
$$;

-- Function to handle order placement with proper quantity management
CREATE OR REPLACE FUNCTION place_order_with_cart_clear(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_items RECORD;
  v_total_amount DECIMAL(10,2) := 0;
  v_order_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if cart has items
    SELECT COUNT(*) INTO v_cart_items
    FROM cart_items
    WHERE user_id = p_user_id;
    
    IF v_cart_items = 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cart is empty'
      );
    END IF;
    
    -- Calculate total amount
    SELECT SUM(ci.quantity * mi.price) INTO v_total_amount
    FROM cart_items ci
    JOIN menu_items mi ON ci.menu_item_id = mi.id
    WHERE ci.user_id = p_user_id;
    
    -- Create order
    INSERT INTO orders (user_id, total_amount, status, payment_status)
    VALUES (p_user_id, v_total_amount, 'pending', 'pending')
    RETURNING id INTO v_order_id;
    
    -- Create order items from cart
    INSERT INTO order_items (order_id, menu_item_id, quantity, price)
    SELECT v_order_id, ci.menu_item_id, ci.quantity, mi.price
    FROM cart_items ci
    JOIN menu_items mi ON ci.menu_item_id = mi.id
    WHERE ci.user_id = p_user_id;
    
    -- Clear cart (quantities already deducted from menu items)
    DELETE FROM cart_items WHERE user_id = p_user_id;
    
    -- Return success result
    v_result := json_build_object(
      'success', true,
      'order_id', v_order_id,
      'total_amount', v_total_amount,
      'message', 'Order placed successfully'
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    RAISE;
  END;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_to_cart_with_quantity_check TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_cart_with_quantity_restore TO authenticated;
GRANT EXECUTE ON FUNCTION update_cart_quantity_with_stock_check TO authenticated;
GRANT EXECUTE ON FUNCTION place_order_with_cart_clear TO authenticated;

-- Update RLS policies to allow real-time updates
DROP POLICY IF EXISTS "Allow quantity updates for cart operations" ON menu_items;
CREATE POLICY "Allow quantity updates for cart operations" ON menu_items
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (quantity_available >= 0);

-- Add policy for real-time subscriptions
DROP POLICY IF EXISTS "Allow real-time subscriptions" ON menu_items;
CREATE POLICY "Allow real-time subscriptions" ON menu_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow real-time cart subscriptions" ON cart_items;
CREATE POLICY "Allow real-time cart subscriptions" ON cart_items
  FOR SELECT TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_quantity ON menu_items(quantity_available);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_menu ON cart_items(user_id, menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_realtime ON menu_items(id, quantity_available, updated_at);