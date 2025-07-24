import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import {
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  CreditCard,
  User,
  LogOut,
  Search,
  Filter,
  Trash2,
  X,
  ChefHat,
  Coffee
} from 'lucide-react';
import Toast from '../../components/Common/Toast';
import ThemeToggle from '../../components/Common/ThemeToggle';
import Loading from '../../components/Common/Loading';
import Footer from '../../components/Common/Footer';

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState(null);

  // Real-time subscriptions for menu items and cart
  useRealtimeSubscription({
    table: 'menu_items',
    onUpdate: (payload) => {
      console.log('Menu item updated:', payload);
      setMenuItems(prev => prev.map(item =>
        item.id === payload.new.id ? { ...item, ...payload.new } : item
      ));
    }
  });

  useRealtimeSubscription({
    table: 'cart_items',
    filter: `user_id=eq.${user?.id}`,
    onUpdate: (payload) => {
      console.log('Cart item updated:', payload);
      fetchCartItems();
    },
    onInsert: (payload) => {
      console.log('Cart item added:', payload);
      fetchCartItems();
    },
    onDelete: (payload) => {
      console.log('Cart item removed:', payload);
      fetchCartItems();
    }
  });

  const categories = ['all', 'main_course', 'snacks', 'beverages', 'south_indian', 'desserts'];

  useEffect(() => {
    fetchMenuItems();
    fetchCartItems();
    fetchOrders();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      showToast('Failed to load menu items', 'error');
    }
  };

  const fetchCartItems = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          menu_items (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      showToast('Failed to load cart items', 'error');
    }
  };

  const fetchOrders = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (menuItem) => {
    try {
      if (!user) return;
      const { data, error } = await supabase.rpc('add_to_cart_with_quantity_check', {
        p_user_id: user.id,
        p_menu_item_id: menuItem.id,
        p_quantity: 1
      });

      if (error) throw error;

      if (data.success) {
        showToast(data.message, 'success');
        await fetchCartItems();
        await fetchMenuItems();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add item to cart', 'error');
    }
  };

  const updateCartQuantity = async (cartItemId, newQuantity) => {
    try {
      if (!user) return;
      const { data, error } = await supabase.rpc('update_cart_quantity_with_stock_check', {
        p_user_id: user.id,
        p_cart_item_id: cartItemId,
        p_new_quantity: newQuantity
      });

      if (error) throw error;

      if (data.success) {
        showToast(data.message, 'success');
        await fetchCartItems();
        await fetchMenuItems();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      showToast('Failed to update quantity', 'error');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      if (!user) return;
      const { data, error } = await supabase.rpc('remove_from_cart_with_quantity_restore', {
        p_user_id: user.id,
        p_cart_item_id: cartItemId
      });

      if (error) throw error;

      if (data.success) {
        showToast(data.message, 'success');
        await fetchCartItems();
        await fetchMenuItems();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      showToast('Failed to remove item', 'error');
    }
  };

  const placeOrder = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase.rpc('place_order_with_cart_clear', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data.success) {
        showToast(data.message, 'success');
        setActiveTab('orders');
        await fetchOrders();
        await fetchCartItems();
        await fetchMenuItems();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Failed to place order', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ChummaOrder</h1>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <button
                onClick={signOut}
                className="hidden sm:flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>

              {/* Mobile sign out - icon only */}
              <button
                onClick={signOut}
                className="sm:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'menu', label: 'Menu', icon: Search },
              { id: 'cart', label: 'Cart', icon: ShoppingCart },
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'profile', label: 'Profile', icon: User }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center sm:justify-start space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === id
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{label}</span>
                {id === 'cart' && cartItems.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="relative">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                    {item.quantity_available <= 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                          Out of Stock
                        </div>
                      </div>
                    )}
                    {item.quantity_available > 0 && item.quantity_available <= 5 && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                        Only {item.quantity_available} left!
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">₹{item.price}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 flex-grow">{item.description}</p>
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${item.quantity_available <= 0
                            ? 'text-red-600 dark:text-red-400'
                            : item.quantity_available <= 5
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                          Available: {item.quantity_available}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Serves {item.serves}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.canteen_name}</span>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={item.quantity_available <= 0}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-white font-medium ${item.quantity_available <= 0
                              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                              : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>{item.quantity_available <= 0 ? 'Out of Stock' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredMenuItems.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No items found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Cart</h2>

            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
                <p className="text-gray-500 dark:text-gray-400">Add some delicious items from the menu</p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center space-x-4 flex-grow min-w-[200px]">
                          <img
                            src={item.menu_items.image_url}
                            alt={item.menu_items.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.menu_items.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">₹{item.menu_items.price} each</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.menu_items.canteen_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end flex-wrap gap-x-4 gap-y-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-3">
                            <p className="text-lg font-bold text-gray-900 dark:text-white w-24 text-right">
                              ₹{(item.menu_items.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center text-xl font-bold mb-4">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-orange-600 dark:text-orange-400">
                      ₹{cartItems.reduce((sum, item) => sum + (item.menu_items.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Place Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Place your first order from the menu</p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {new Date(order.created_at).toLocaleDateString()} at{' '}
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.order_items.map((item, itemIndex) => (
                        <div
                          key={item.id}
                          className={`flex justify-between items-center py-2 ${itemIndex !== 0 ? 'border-t border-gray-200 dark:border-gray-600' : ''}`}
                        >
                          <div className="flex items-center space-x-3">
                            <img src={item.menu_items.image_url} alt={item.menu_items.name} className="w-10 h-10 object-cover rounded" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.menu_items.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 mt-4 pt-4 flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>₹{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {/* ===== MODIFICATION START ===== */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* ===== MODIFICATION END ===== */}
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.full_name || 'Student'}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
                  {user?.registration_number && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reg: {user.registration_number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.full_name || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value="Student"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={user?.registration_number || 'Not provided'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={user?.mobile_number || 'Not provided'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Created
                  </label>
                  <input
                    type="text"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;