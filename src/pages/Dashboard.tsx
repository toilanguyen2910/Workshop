import { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, runTransaction, addDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Camera, User as UserIcon, Edit2, Check, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface BookingWithWorkshop {
  bookingId: string;
  status: string;
  createdAt: string;
  cancelledAt?: string;
  workshop: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    imageUrl: string;
  };
}

interface UserProfile {
  name: string;
  email: string;
  photoUrl?: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithWorkshop[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Photo upload states
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Name edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch User Profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setUserProfile(data);
          setEditNameValue(data.name);
        }

        // Fetch Bookings
        const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const bookingsData: BookingWithWorkshop[] = [];
        
        for (const document of querySnapshot.docs) {
          const bookingData = document.data();
          const workshopRef = doc(db, 'workshops', bookingData.workshopId);
          const workshopSnap = await getDoc(workshopRef);
          
          if (workshopSnap.exists()) {
            const workshopData = workshopSnap.data();
            bookingsData.push({
              bookingId: document.id,
              status: bookingData.status,
              createdAt: bookingData.createdAt,
              cancelledAt: bookingData.cancelledAt,
              workshop: {
                id: workshopSnap.id,
                title: workshopData.title,
                date: workshopData.date,
                time: workshopData.time,
                location: workshopData.location,
                imageUrl: workshopData.imageUrl
              }
            });
          }
        }
        
        // Sort by date descending
        bookingsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(bookingsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh.');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { photoUrl: dataUrl });

          setUserProfile(prev => prev ? { ...prev, photoUrl: dataUrl } : null);
          setUploading(false);
        };
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Có lỗi xảy ra khi tải ảnh lên.");
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editNameValue.trim() || !user) return;
    setSavingName(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: editNameValue.trim() });
      setUserProfile(prev => prev ? { ...prev, name: editNameValue.trim() } : null);
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
      alert("Có lỗi xảy ra khi cập nhật tên.");
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelBooking = async (bookingId: string, workshopId: string, workshopTitle: string) => {
    if (!user) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy vé tham gia "${workshopTitle}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    const cancelledTime = new Date().toISOString();

    try {
      await runTransaction(db, async (transaction) => {
        const workshopRef = doc(db, 'workshops', workshopId);
        const bookingRef = doc(db, 'bookings', bookingId);

        const workshopDoc = await transaction.get(workshopRef);
        if (!workshopDoc.exists()) {
          throw new Error("Workshop không tồn tại!");
        }

        const currentBookedCount = workshopDoc.data().bookedCount || 0;
        const newBookedCount = Math.max(0, currentBookedCount - 1);

        // Update workshop count
        transaction.update(workshopRef, { bookedCount: newBookedCount });
        
        // Update booking status
        transaction.update(bookingRef, { 
          status: 'cancelled',
          cancelledAt: cancelledTime
        });
      });

      // Send cancellation email
      await addDoc(collection(db, 'mail'), {
        to: user.email,
        message: {
          subject: `Xác nhận hủy vé: ${workshopTitle}`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2 style="color: #5A5A40;">Xác nhận hủy vé</h2>
              <p>Xin chào ${userProfile?.name || 'bạn'},</p>
              <p>Bạn đã hủy thành công vé tham gia workshop <strong>${workshopTitle}</strong>.</p>
              <p>Rất tiếc vì bạn không thể tham gia lần này. Hẹn gặp lại bạn ở những workshop tiếp theo của chúng tôi!</p>
              <br/>
              <p>Trân trọng,</p>
              <p><strong>Đội ngũ Workshop Discovery</strong></p>
            </div>
          `
        }
      });

      // Update local state
      setBookings(prev => prev.map(b => 
        b.bookingId === bookingId ? { ...b, status: 'cancelled', cancelledAt: cancelledTime } : b
      ));

      alert("Đã hủy vé thành công! Bạn có thể hoàn tác trong vòng 1 giờ nếu đổi ý.");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Có lỗi xảy ra khi hủy vé. Vui lòng thử lại sau.");
    }
  };

  const handleUndoCancel = async (bookingId: string, workshopId: string, workshopTitle: string) => {
    if (!user) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        const workshopRef = doc(db, 'workshops', workshopId);
        const bookingRef = doc(db, 'bookings', bookingId);

        const workshopDoc = await transaction.get(workshopRef);
        if (!workshopDoc.exists()) {
          throw new Error("Workshop không tồn tại!");
        }

        const workshopData = workshopDoc.data();
        if (workshopData.bookedCount >= workshopData.capacity) {
          throw new Error("Workshop đã hết chỗ, không thể hoàn tác!");
        }

        // Update workshop count
        transaction.update(workshopRef, { bookedCount: workshopData.bookedCount + 1 });
        
        // Update booking status back to confirmed and remove cancelledAt
        transaction.update(bookingRef, { 
          status: 'confirmed',
          cancelledAt: deleteField()
        });
      });

      // Send re-confirmation email
      await addDoc(collection(db, 'mail'), {
        to: user.email,
        message: {
          subject: `Hoàn tác hủy vé thành công: ${workshopTitle}`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2 style="color: #5A5A40;">Hoàn tác hủy vé thành công</h2>
              <p>Xin chào ${userProfile?.name || 'bạn'},</p>
              <p>Bạn đã hoàn tác hủy vé thành công cho workshop <strong>${workshopTitle}</strong>.</p>
              <p>Vé của bạn đã được xác nhận lại. Rất vui vì bạn vẫn có thể tham gia cùng chúng tôi!</p>
              <br/>
              <p>Trân trọng,</p>
              <p><strong>Đội ngũ Workshop Discovery</strong></p>
            </div>
          `
        }
      });

      // Update local state
      setBookings(prev => prev.map(b => {
        if (b.bookingId === bookingId) {
          const { cancelledAt, ...rest } = b;
          return { ...rest, status: 'confirmed' };
        }
        return b;
      }));

      alert("Hoàn tác hủy vé thành công!");
    } catch (error: any) {
      console.error("Error undoing cancellation:", error);
      alert(error.message || "Có lỗi xảy ra khi hoàn tác. Vui lòng thử lại sau.");
    }
  };

  const isWithinOneHour = (dateStr?: string) => {
    if (!dateStr) return false;
    const cancelTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return (now - cancelTime) < 60 * 60 * 1000; // 1 hour in milliseconds
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A5A40]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Profile Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-8 border border-[#e5e5e5]">
        <div className="relative group flex-shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">
            {userProfile?.photoUrl ? (
              <img src={userProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 bg-[#5A5A40] text-white p-2.5 rounded-full shadow-lg hover:bg-[#4a4a35] transition-colors disabled:opacity-50"
            title="Thay đổi ảnh đại diện"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div className="text-center md:text-left flex-grow">
          {isEditingName ? (
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <input 
                type="text" 
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="font-serif text-2xl font-bold text-[#1a1a1a] border-b-2 border-[#5A5A40] outline-none bg-transparent px-1 py-0.5 w-full max-w-[250px]"
                autoFocus
                disabled={savingName}
              />
              <button 
                onClick={handleSaveName}
                disabled={savingName || !editNameValue.trim()}
                className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                title="Lưu"
              >
                <Check className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setIsEditingName(false);
                  setEditNameValue(userProfile?.name || '');
                }}
                disabled={savingName}
                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Hủy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h2 className="font-serif text-3xl font-bold text-[#1a1a1a]">{userProfile?.name || 'Người dùng'}</h2>
              <button 
                onClick={() => setIsEditingName(true)}
                className="p-1.5 text-gray-400 hover:text-[#5A5A40] hover:bg-gray-100 rounded-lg transition-colors"
                title="Đổi tên"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-gray-500">{userProfile?.email}</p>
          {uploading && <p className="text-sm text-[#5A5A40] mt-2 animate-pulse">Đang tải ảnh lên...</p>}
        </div>
      </div>

      <h1 className="font-serif text-3xl font-bold text-[#1a1a1a] mb-8">Vé của tôi</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-[#e5e5e5]">
          <p className="text-gray-500 text-lg mb-6">Bạn chưa đặt chỗ workshop nào.</p>
          <Link to="/" className="inline-block bg-[#5A5A40] text-white px-8 py-3 rounded-full font-medium hover:bg-[#4a4a35] transition-colors">
            Khám phá ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((item) => (
            <div key={item.bookingId} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center border border-[#e5e5e5]">
              <div className="w-full md:w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                <img 
                  src={item.workshop.imageUrl} 
                  alt={item.workshop.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">
                    <Link to={`/workshop/${item.workshop.id}`} className="hover:text-[#5A5A40] transition-colors">
                      {item.workshop.title}
                    </Link>
                  </h3>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      item.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
                    </span>
                    {item.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(item.bookingId, item.workshop.id, item.workshop.title)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                      >
                        Hủy vé
                      </button>
                    )}
                    {item.status === 'cancelled' && isWithinOneHour(item.cancelledAt) && (
                      <button
                        onClick={() => handleUndoCancel(item.bookingId, item.workshop.id, item.workshop.title)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Hoàn tác hủy
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{format(new Date(item.workshop.date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{item.workshop.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm sm:col-span-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{item.workshop.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
