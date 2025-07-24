import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, CheckCircle, AlertCircle, Package, X, DollarSign, Users, Package2, Crown } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Toast from '../../components/Common/Toast';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Common/Footer';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState(new Set());
  const [savingMenuItem, setSavingMenuItem] = useState(false);
  const [deletingMenuItem, setDeletingMenuItem] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Real-time subscriptions
  useRealtimeSubscription({
    table: 'menu_items',
    filter: `canteen_name=eq.${user?.full_name}`,
    onUpdate: (payload) => {
      setMenuItems(prev => prev.map(item =>
        item.id === payload.new.id ? { ...item, ...payload.new } : item
      ));
    }
  });

  useRealtimeSubscription({
    table: 'orders',
    onUpdate: () => fetchOrders(),
    onInsert: () => {
      fetchOrders();
      showToast('New order received!', 'success');
    }
  });

  useRealtimeSubscription({
    table: 'cart_items',
    onUpdate: () => fetchMenuItems(),
    onInsert: () => fetchMenuItems(),
    onDelete: () => fetchMenuItems()
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'main_course',
    serves: '1',
    canteen_name: '',
    quantity_available: '0'
  });

  const showToast = (message, type) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
  }, [user]);

  useEffect(() => {
    if (editingItem) {
      setEditForm({
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price.toString(),
        image_url: editingItem.image_url,
        category: editingItem.category,
        serves: editingItem.serves.toString(),
        canteen_name: editingItem.canteen_name,
        quantity_available: editingItem.quantity_available.toString()
      });
    } else {
      setEditForm({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: 'main_course',
        serves: '1',
        canteen_name: user?.full_name || '',
        quantity_available: '0'
      });
    }
  }, [editingItem, user]);

  const fetchOrders = async () => {
    try {
      if (!user?.full_name) {
        setLoading(false);
        return;
      }

      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      if (!allOrders) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(allOrders.map(order => order.user_id))];
      const { data: users, error: usersError } = await supabase.from('users').select('*').in('id', userIds);
      if (usersError) throw usersError;

      const orderIds = allOrders.map(order => order.id);
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`*, menu_item:menu_items(*)`)
        .in('order_id', orderIds);
      if (orderItemsError) throw orderItemsError;

      const userMap = new Map(users?.map(u => [u.id, u]));

      const relevantOrders = allOrders.filter(order => {
        const itemsForOrder = orderItems?.filter(item => item.order_id === order.id) || [];
        return itemsForOrder.some(item => item.menu_item?.canteen_name === user.full_name);
      });

      const finalOrders = relevantOrders.map(order => {
        const canteenOrderItems = orderItems?.filter(item =>
          item.order_id === order.id && item.menu_item?.canteen_name === user.full_name
        ) || [];
        const canteenTotal = canteenOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { ...order, user: userMap.get(order.user_id) || null, order_items: canteenOrderItems, total_amount: canteenTotal };
      });

      setOrders(finalOrders);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      showToast('Failed to fetch orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      if (!user?.full_name) return;
      const { data, error } = await supabase.from('menu_items').select('*').eq('canteen_name', user.full_name).order('name');
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const updateKey = `${orderId}-${status}`;
    if (updatingOrders.has(updateKey)) return;
    setUpdatingOrders(prev => new Set(prev).add(updateKey));
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      showToast(`Order status updated to ${status}`, 'success');
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status.', 'error');
    } finally {
      setUpdatingOrders(prev => { const newSet = new Set(prev); newSet.delete(updateKey); return newSet; });
    }
  };

  const handleSaveMenuItem = async () => {
    if (savingMenuItem) return;
    if (!editForm.name.trim() || !editForm.description.trim() || !editForm.price || !editForm.serves || !editForm.quantity_available) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    setSavingMenuItem(true);
    try {
      const menuItemData = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: parseFloat(editForm.price),
        image_url: editForm.image_url.trim() || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        category: editForm.category || 'main_course',
        serves: parseInt(editForm.serves),
        canteen_name: user?.full_name || '',
        quantity_available: parseInt(editForm.quantity_available)
      };
      const { error } = editingItem
        ? await supabase.from('menu_items').update(menuItemData).eq('id', editingItem.id)
        : await supabase.from('menu_items').insert([menuItemData]);
      if (error) throw new Error(error.message);
      showToast(editingItem ? 'Menu item updated!' : 'Menu item created!', 'success');
      await fetchMenuItems();
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving menu item:', error);
      showToast('Failed to save menu item.', 'error');
    } finally {
      setSavingMenuItem(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (deletingMenuItem === itemId) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    setDeletingMenuItem(itemId);
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
      if (error) throw error;
      showToast('Menu item deleted!', 'success');
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showToast('Failed to delete menu item.', 'error');
    } finally {
      setDeletingMenuItem(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    const className = "w-4 h-4";
    switch (status) {
      case 'pending': return <Clock className={className} />;
      case 'processing': return <Package className={className} />;
      case 'ready': return <CheckCircle className={className} />;
      case 'completed': return <CheckCircle className={className} />;
      case 'cancelled': return <AlertCircle className={className} />;
      default: return <Clock className={className} />;
    }
  };

  const isOrderUpdating = (orderId, status) => updatingOrders.has(`${orderId}-${status}`);

  const formatStudentInfo = (orderUser) => {
    if (!orderUser) return 'Unknown Student';
    return `${orderUser.full_name || 'Unknown'} (${orderUser.registration_number || 'No Reg. No.'})`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-12 h-12 text-emerald-500 mx-auto animate-pulse" />
          <span className="text-xl font-medium text-gray-700 dark:text-gray-300">Loading Command Center...</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      <Header title={`${user?.full_name || 'Staff'} Command Center`} />
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="text-left">
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 -mb-px">
              <button
                onClick={() => setActiveTab('orders')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}
              >
                Orders Management
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'menu' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}
              >
                Menu Management
              </button>
            </nav>
          </div>
          {activeTab === 'orders' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orders for {user?.full_name}</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">No orders yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">New orders will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Order #{order.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{formatStudentInfo(order.user)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{order.total_amount.toFixed(2)}</p>
                          <div className={`inline-flex items-center gap-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                      <div>
                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Items:</h5>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              <span className="text-gray-700 dark:text-gray-300">{item.menu_item?.name || 'Unknown Item'} x {item.quantity}</span>
                              <span className="font-medium text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <button onClick={() => updateOrderStatus(order.id, 'processing')} disabled={order.status !== 'pending' || isOrderUpdating(order.id, 'processing')} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isOrderUpdating(order.id, 'processing') ? 'Updating...' : 'Start Processing'}
                        </button>
                        <button onClick={() => updateOrderStatus(order.id, 'ready')} disabled={order.status !== 'processing' || isOrderUpdating(order.id, 'ready')} className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isOrderUpdating(order.id, 'ready') ? 'Updating...' : 'Mark Ready'}
                        </button>
                        <button onClick={() => updateOrderStatus(order.id, 'completed')} disabled={order.status !== 'ready' || isOrderUpdating(order.id, 'completed')} className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isOrderUpdating(order.id, 'completed') ? 'Updating...' : 'Complete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h2>
                <button onClick={() => { setEditingItem(null); setIsEditModalOpen(true); }} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>Add New Item</span>
                </button>
              </div>
              {menuItems.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <Plus className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">No menu items yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Add your first item to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuItems.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden flex flex-col">
                      <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{item.price}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow">{item.description}</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mt-auto">
                          <div className="flex justify-between">
                            <span className={`font-medium ${item.quantity_available <= 0 ? 'text-red-500' : item.quantity_available <= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                              Available: {item.quantity_available}
                            </span>
                            <span>Serves: {item.serves}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button onClick={() => { setEditingItem(item); setIsEditModalOpen(true); }} className="flex-1 text-sm flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleDeleteMenuItem(item.id)} disabled={deletingMenuItem === item.id} className="flex-1 text-sm flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                            <span>{deletingMenuItem === item.id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button onClick={() => setIsEditModalOpen(false)} disabled={savingMenuItem} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name *</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Masala Dosa" disabled={savingMenuItem} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="A short, tasty description" disabled={savingMenuItem} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹) *</label>
                  <input type="number" step="1" min="0" value={editForm.price} onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0" disabled={savingMenuItem} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serves *</label>
                  <input type="number" min="1" value={editForm.serves} onChange={(e) => setEditForm(prev => ({ ...prev, serves: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="1" disabled={savingMenuItem} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Qty *</label>
                  <input type="number" min="0" value={editForm.quantity_available} onChange={(e) => setEditForm(prev => ({ ...prev, quantity_available: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0" disabled={savingMenuItem} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500" disabled={savingMenuItem}>
                    <option value="main_course">Main Course</option>
                    <option value="snacks">Snacks</option>
                    <option value="beverages">Beverages</option>
                    <option value="south_indian">South Indian</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Canteen Name</label>
                  <input type="text" value={user?.full_name || ''} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg" disabled readOnly />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL (Optional)</label>
                <input type="text" value={editForm.image_url} onChange={(e) => setEditForm(prev => ({ ...prev, image_url: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="https://example.com/image.jpg" disabled={savingMenuItem} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setIsEditModalOpen(false)} disabled={savingMenuItem} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleSaveMenuItem} disabled={savingMenuItem} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{savingMenuItem ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;