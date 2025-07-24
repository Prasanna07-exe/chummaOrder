/*
  # Fix Cart Operations - Items Not Being Added

  1. Database Functions
    - Fix add_to_cart_with_quantity_check function
    - Fix update_cart_quantity_with_stock_check function  
    - Fix remove_from_cart_with_quantity_restore function
    - Fix place_order_with_cart_clear function

  2. Security
    - Ensure proper RLS policies for cart operations
    - Grant execute permissions to authenticated users

  3. Changes
    - Fixed cart item insertion logic
    - Added proper error handling and validation
    - Ensured atomic transactions work correctly
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS add_to_cart_with_quantity_check(uuid, uuid, integer);
DROP FUNCTION IF EXISTS update_cart_quantity_with_stock_check(uuid, uuid, integer);
DROP FUNCTION IF EXISTS remove_from_cart_with_quantity_restore(uuid, uuid);
DROP FUNCTION IF EXISTS place_order_with_cart_clear(uuid);

-- Function to add item to cart with quantity check
CREATE OR REPLACE FUNCTION add_to_cart_with_quantity_check(
  p_user_id uuid,
  p_menu_item_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_quantity integer;
  v_current_cart_quantity integer := 0;
  v_cart_item_id uuid;
  v_menu_item_name text;
BEGIN
  -- Get menu item details and current quantity
  SELECT quantity_available, name 
  INTO v_available_quantity, v_menu_item_name
  FROM menu_items 
  WHERE id = p_menu_item_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Menu item not found'
    );
  END IF;
  
  -- Get current quantity in cart for this item
  SELECT quantity INTO v_current_cart_quantity
  FROM cart_items 
  WHERE user_id = p_user_id AND menu_item_id = p_menu_item_id;
  
  IF NOT FOUND THEN
    v_current_cart_quantity := 0;
  END IF;
  
  -- Check if we have enough stock
  IF v_available_quantity < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not enough stock available. Only ' || v_available_quantity || ' items left.'
    );
  END IF;
  
  -- Start transaction
  BEGIN
    -- Update menu item quantity (decrease)
    UPDATE menu_items 
    SET quantity_available = quantity_available - p_quantity,
        updated_at = now()
    WHERE id = p_menu_item_id;
    
    -- Insert or update cart item
    INSERT INTO cart_items (user_id, menu_item_id, quantity)
    VALUES (p_user_id, p_menu_item_id, v_current_cart_quantity + p_quantity)
    ON CONFLICT (user_id, menu_item_id)
    DO UPDATE SET 
      quantity = cart_items.quantity + p_quantity,
      created_at = now();
    
    RETURN json_build_object(
      'success', true,
      'message', v_menu_item_name || ' added to cart successfully!',
      'new_quantity', v_current_cart_quantity + p_quantity,
      'remaining_stock', v_available_quantity - p_quantity
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to add item to cart: ' || SQLERRM
    );
  END;
END;
$$;

-- Function to update cart quantity with stock check
CREATE OR REPLACE FUNCTION update_cart_quantity_with_stock_check(
  p_user_id uuid,
  p_cart_item_id uuid,
  p_new_quantity integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity integer;
  v_menu_item_id uuid;
  v_available_quantity integer;
  v_quantity_diff integer;
  v_menu_item_name text;
BEGIN
  -- Get current cart item details
  SELECT ci.quantity, ci.menu_item_id, mi.quantity_available, mi.name
  INTO v_current_quantity, v_menu_item_id, v_available_quantity, v_menu_item_name
  FROM cart_items ci
  JOIN menu_items mi ON ci.menu_item_id = mi.id
  WHERE ci.id = p_cart_item_id AND ci.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cart item not found'
    );
  END IF;
  
  -- Calculate quantity difference
  v_quantity_diff := p_new_quantity - v_current_quantity;
  
  -- If increasing quantity, check stock
  IF v_quantity_diff > 0 AND v_available_quantity < v_quantity_diff THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not enough stock available. Only ' || v_available_quantity || ' items left.'
    );
  END IF;
  
  -- If new quantity is 0 or less, remove item
  IF p_new_quantity <= 0 THEN
    -- Remove from cart and restore quantity
    BEGIN
      DELETE FROM cart_items WHERE id = p_cart_item_id AND user_id = p_user_id;
      
      UPDATE menu_items 
      SET quantity_available = quantity_available + v_current_quantity,
          updated_at = now()
      WHERE id = v_menu_item_id;
      
      RETURN json_build_object(
        'success', true,
        'message', v_menu_item_name || ' removed from cart',
        'action', 'removed'
      );
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Failed to remove item: ' || SQLERRM
      );
    END;
  END IF;
  
  -- Update quantities
  BEGIN
    -- Update cart quantity
    UPDATE cart_items 
    SET quantity = p_new_quantity,
        created_at = now()
    WHERE id = p_cart_item_id AND user_id = p_user_id;
    
    -- Update menu item quantity (subtract the difference)
    UPDATE menu_items 
    SET quantity_available = quantity_available - v_quantity_diff,
        updated_at = now()
    WHERE id = v_menu_item_id;
    
    RETURN json_build_object(
      'success', true,
      'message', v_menu_item_name || ' quantity updated successfully!',
      'new_quantity', p_new_quantity,
      'remaining_stock', v_available_quantity - v_quantity_diff
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update quantity: ' || SQLERRM
    );
  END;
END;
$$;

-- Function to remove item from cart with quantity restore
CREATE OR REPLACE FUNCTION remove_from_cart_with_quantity_restore(
  p_user_id uuid,
  p_cart_item_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quantity integer;
  v_menu_item_id uuid;
  v_menu_item_name text;
BEGIN
  -- Get cart item details
  SELECT ci.quantity, ci.menu_item_id, mi.name
  INTO v_quantity, v_menu_item_id, v_menu_item_name
  FROM cart_items ci
  JOIN menu_items mi ON ci.menu_item_id = mi.id
  WHERE ci.id = p_cart_item_id AND ci.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cart item not found'
    );
  END IF;
  
  BEGIN
    -- Remove from cart
    DELETE FROM cart_items WHERE id = p_cart_item_id AND user_id = p_user_id;
    
    -- Restore quantity to menu item
    UPDATE menu_items 
    SET quantity_available = quantity_available + v_quantity,
        updated_at = now()
    WHERE id = v_menu_item_id;
    
    RETURN json_build_object(
      'success', true,
      'message', v_menu_item_name || ' removed from cart successfully!',
      'restored_quantity', v_quantity
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to remove item: ' || SQLERRM
    );
  END;
END;
$$;

-- Function to place order with cart clear
CREATE OR REPLACE FUNCTION place_order_with_cart_clear(
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_amount numeric := 0;
  v_order_id uuid;
  v_cart_item record;
  v_order_count integer;
BEGIN
  -- Check if cart has items
  SELECT COUNT(*) INTO v_order_count
  FROM cart_items 
  WHERE user_id = p_user_id;
  
  IF v_order_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;
  
  -- Calculate total amount
  SELECT COALESCE(SUM(ci.quantity * mi.price), 0)
  INTO v_total_amount
  FROM cart_items ci
  JOIN menu_items mi ON ci.menu_item_id = mi.id
  WHERE ci.user_id = p_user_id;
  
  BEGIN
    -- Create order
    INSERT INTO orders (user_id, total_amount, status, payment_status)
    VALUES (p_user_id, v_total_amount, 'pending', 'pending')
    RETURNING id INTO v_order_id;
    
    -- Create order items from cart
    FOR v_cart_item IN 
      SELECT ci.*, mi.price, mi.name
      FROM cart_items ci
      JOIN menu_items mi ON ci.menu_item_id = mi.id
      WHERE ci.user_id = p_user_id
    LOOP
      INSERT INTO order_items (order_id, menu_item_id, quantity, price)
      VALUES (v_order_id, v_cart_item.menu_item_id, v_cart_item.quantity, v_cart_item.price);
    END LOOP;
    
    -- Clear cart
    DELETE FROM cart_items WHERE user_id = p_user_id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Order placed successfully!',
      'order_id', v_order_id,
      'total_amount', v_total_amount,
      'item_count', v_order_count
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to place order: ' || SQLERRM
    );
  END;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_to_cart_with_quantity_check(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cart_quantity_with_stock_check(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_cart_with_quantity_restore(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION place_order_with_cart_clear(uuid) TO authenticated;

-- Ensure RLS policies allow cart operations
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cart_items' 
    AND policyname = 'Users can manage own cart items'
  ) THEN
    CREATE POLICY "Users can manage own cart items"
      ON cart_items
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;