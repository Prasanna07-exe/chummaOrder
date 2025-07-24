/*
  # Cart Quantity Management Functions

  1. Database Functions
    - `add_to_cart_with_quantity_check` - Atomically adds items to cart and updates menu quantities
    - `remove_from_cart_with_quantity_restore` - Atomically removes items and restores quantities  
    - `update_cart_quantity_with_stock_check` - Atomically updates cart with stock validation
    - `place_order_with_cart_clear` - Handles order placement with proper cart clearing

  2. Security
    - All functions check user authentication
    - Atomic transactions prevent race conditions
    - Stock validation prevents overselling

  3. Real-time Updates
    - Functions trigger real-time subscriptions
    - Changes reflect instantly across all dashboards
*/

-- Function to add item to cart with quantity check and update
CREATE OR REPLACE FUNCTION add_to_cart_with_quantity_check(
  p_user_id uuid,
  p_menu_item_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_quantity integer;
  v_current_cart_quantity integer := 0;
  v_cart_item_id uuid;
  v_result jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized access'
    );
  END IF;

  -- Lock the menu item row to prevent race conditions
  SELECT quantity_available INTO v_available_quantity
  FROM menu_items 
  WHERE id = p_menu_item_id
  FOR UPDATE;

  -- Check if menu item exists
  IF v_available_quantity IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Menu item not found'
    );
  END IF;

  -- Get current cart quantity for this item
  SELECT quantity INTO v_current_cart_quantity
  FROM cart_items
  WHERE user_id = p_user_id AND menu_item_id = p_menu_item_id;

  -- If no cart item exists, set current quantity to 0
  IF v_current_cart_quantity IS NULL THEN
    v_current_cart_quantity := 0;
  END IF;

  -- Check if we have enough stock
  IF v_available_quantity < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Only %s items available', v_available_quantity)
    );
  END IF;

  -- Update menu item quantity (decrease by requested amount)
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
    created_at = now()
  RETURNING id INTO v_cart_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Item added to cart successfully',
    'cart_item_id', v_cart_item_id,
    'new_quantity', v_current_cart_quantity + p_quantity,
    'remaining_stock', v_available_quantity - p_quantity
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM)
    );
END;
$$;

-- Function to remove item from cart with quantity restore
CREATE OR REPLACE FUNCTION remove_from_cart_with_quantity_restore(
  p_user_id uuid,
  p_cart_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_menu_item_id uuid;
  v_quantity integer;
  v_result jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized access'
    );
  END IF;

  -- Get cart item details and lock the row
  SELECT menu_item_id, quantity INTO v_menu_item_id, v_quantity
  FROM cart_items
  WHERE id = p_cart_item_id AND user_id = p_user_id
  FOR UPDATE;

  -- Check if cart item exists
  IF v_menu_item_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart item not found'
    );
  END IF;

  -- Restore quantity to menu item
  UPDATE menu_items 
  SET quantity_available = quantity_available + v_quantity,
      updated_at = now()
  WHERE id = v_menu_item_id;

  -- Remove cart item
  DELETE FROM cart_items 
  WHERE id = p_cart_item_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Item removed from cart successfully',
    'restored_quantity', v_quantity
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM)
    );
END;
$$;

-- Function to update cart quantity with stock check
CREATE OR REPLACE FUNCTION update_cart_quantity_with_stock_check(
  p_user_id uuid,
  p_cart_item_id uuid,
  p_new_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_menu_item_id uuid;
  v_current_quantity integer;
  v_available_quantity integer;
  v_quantity_diff integer;
  v_result jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized access'
    );
  END IF;

  -- Validate new quantity
  IF p_new_quantity <= 0 THEN
    -- If new quantity is 0 or less, remove the item
    RETURN remove_from_cart_with_quantity_restore(p_user_id, p_cart_item_id);
  END IF;

  -- Get current cart item details and lock the row
  SELECT menu_item_id, quantity INTO v_menu_item_id, v_current_quantity
  FROM cart_items
  WHERE id = p_cart_item_id AND user_id = p_user_id
  FOR UPDATE;

  -- Check if cart item exists
  IF v_menu_item_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart item not found'
    );
  END IF;

  -- Get available quantity and lock menu item
  SELECT quantity_available INTO v_available_quantity
  FROM menu_items 
  WHERE id = v_menu_item_id
  FOR UPDATE;

  -- Calculate quantity difference
  v_quantity_diff := p_new_quantity - v_current_quantity;

  -- If increasing quantity, check if we have enough stock
  IF v_quantity_diff > 0 AND v_available_quantity < v_quantity_diff THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Only %s additional items available', v_available_quantity)
    );
  END IF;

  -- Update menu item quantity (decrease if adding more, increase if reducing)
  UPDATE menu_items 
  SET quantity_available = quantity_available - v_quantity_diff,
      updated_at = now()
  WHERE id = v_menu_item_id;

  -- Update cart item quantity
  UPDATE cart_items 
  SET quantity = p_new_quantity,
      created_at = now()
  WHERE id = p_cart_item_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cart quantity updated successfully',
    'old_quantity', v_current_quantity,
    'new_quantity', p_new_quantity,
    'remaining_stock', v_available_quantity - v_quantity_diff
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM)
    );
END;
$$;

-- Function to place order with cart clear
CREATE OR REPLACE FUNCTION place_order_with_cart_clear(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_total_amount numeric := 0;
  v_cart_item record;
  v_result jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized access'
    );
  END IF;

  -- Check if cart has items
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;

  -- Calculate total amount
  SELECT COALESCE(SUM(ci.quantity * mi.price), 0) INTO v_total_amount
  FROM cart_items ci
  JOIN menu_items mi ON ci.menu_item_id = mi.id
  WHERE ci.user_id = p_user_id;

  -- Create order
  INSERT INTO orders (user_id, total_amount, status, payment_status)
  VALUES (p_user_id, v_total_amount, 'pending', 'pending')
  RETURNING id INTO v_order_id;

  -- Create order items from cart items
  FOR v_cart_item IN 
    SELECT ci.menu_item_id, ci.quantity, mi.price
    FROM cart_items ci
    JOIN menu_items mi ON ci.menu_item_id = mi.id
    WHERE ci.user_id = p_user_id
  LOOP
    INSERT INTO order_items (order_id, menu_item_id, quantity, price)
    VALUES (v_order_id, v_cart_item.menu_item_id, v_cart_item.quantity, v_cart_item.price);
  END LOOP;

  -- Clear cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order placed successfully',
    'order_id', v_order_id,
    'total_amount', v_total_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- If there's an error, the transaction will be rolled back automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to place order: %s', SQLERRM)
    );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_to_cart_with_quantity_check(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_cart_with_quantity_restore(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cart_quantity_with_stock_check(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION place_order_with_cart_clear(uuid) TO authenticated;