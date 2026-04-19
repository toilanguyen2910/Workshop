import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarPlus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../adminConfig';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'workshops' | 'users'>('workshops');
  
  // Workshop states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    price: '',
    imageUrl: '',
    capacity: '',
    location: ''
  });

  // User management states
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string, email: string) => {
    // Prevent removing the super admin
    if (SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL) {
      alert("Không thể thay đổi quyền của Quản trị viên tối cao.");
      return;
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = newRole === 'admin' 
      ? `Bạn có chắc chắn muốn cấp quyền Quản trị viên cho ${email}?` 
      : `Bạn có chắc chắn muốn gỡ quyền Quản trị viên của ${email}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Có lỗi xảy ra khi cập nhật quyền.");
    }
  };

  if (loading || !isAdmin) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      await addDoc(collection(db, 'workshops'), {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        price: Number(formData.price),
        imageUrl: formData.imageUrl,
        capacity: Number(formData.capacity),
        bookedCount: 0,
        location: formData.location
      });
      setSuccess(true);
      setFormData({
        title: '', description: '', date: '', time: '', price: '', imageUrl: '', capacity: '', location: ''
      });
    } catch (error) {
      console.error("Error adding workshop:", error);
      alert("Lỗi khi thêm workshop");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-serif text-4xl font-bold mb-8 text-[#1a1a1a]">Bảng Điều Khiển Quản Trị</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('workshops')}
          className={`pb-4 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${
            activeTab === 'workshops' ? 'text-[#5A5A40]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          Thêm Workshop
          {activeTab === 'workshops' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#5A5A40] rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${
            activeTab === 'users' ? 'text-[#5A5A40]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Quản lý Người dùng
          {activeTab === 'users' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#5A5A40] rounded-t-full"></span>
          )}
        </button>
      </div>

      {/* Tab Content: Add Workshop */}
      {activeTab === 'workshops' && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5e5] max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 text-[#1a1a1a]">Thêm Workshop Mới</h2>
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium">
              Thêm workshop thành công!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề</label>
              <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all"></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày diễn ra</label>
                <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Giờ bắt đầu</label>
                <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá (VNĐ)</label>
                <input required type="number" min="0" name="price" value={formData.price} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng tối đa (người)</label>
                <input required type="number" min="1" name="capacity" value={formData.capacity} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa điểm</label>
              <input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Hình ảnh</label>
              <input required type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none bg-gray-50 transition-all" />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#4a4a35] transition-colors disabled:bg-gray-400 mt-4"
            >
              {submitting ? 'Đang xử lý...' : 'Thêm Workshop'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl shadow-sm border border-[#e5e5e5] overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-[#1a1a1a]">Danh sách Người dùng</h2>
            <p className="text-sm text-gray-500 mt-1">Quản lý quyền truy cập của các thành viên trong hệ thống.</p>
          </div>
          
          {loadingUsers ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A5A40]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                    <th className="p-4 font-medium">Tên người dùng</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Vai trò</th>
                    <th className="p-4 font-medium text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-[#1a1a1a]">{u.name}</td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {!(SUPER_ADMIN_EMAIL && u.email === SUPER_ADMIN_EMAIL) ? (
                          <button
                            onClick={() => toggleUserRole(u.id, u.role, u.email)}
                            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              u.role === 'admin' 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-[#5A5A40] hover:bg-[#5A5A40]/10'
                            }`}
                          >
                            {u.role === 'admin' ? 'Gỡ quyền Admin' : 'Cấp quyền Admin'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic px-3 py-1.5">Super Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        Không có dữ liệu người dùng.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
