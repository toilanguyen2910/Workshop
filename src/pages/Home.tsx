import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  price: number;
  imageUrl: string;
  capacity: number;
  bookedCount: number;
  location: string;
}

const MotionLink = motion.create(Link);

export default function Home() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'workshops'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workshop[];
      setWorkshops(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workshops:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Derived unique locations for the dropdown
  const uniqueLocations = useMemo(() => {
    const locations = workshops.map(w => w.location);
    return Array.from(new Set(locations)).sort();
  }, [workshops]);

  // Filtered workshops
  const filteredWorkshops = useMemo(() => {
    return workshops.filter(w => {
      // Search filter
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const titleMatch = w.title.toLowerCase().includes(queryLower);
        const descMatch = w.description.toLowerCase().includes(queryLower);
        if (!titleMatch && !descMatch) return false;
      }

      // Date filter
      if (filterDate && w.date !== filterDate) return false;

      // Location filter
      if (filterLocation && w.location !== filterLocation) return false;

      // Price filter
      if (filterPrice) {
        if (filterPrice === 'free' && w.price > 0) return false;
        if (filterPrice === 'under500' && w.price >= 500000) return false;
        if (filterPrice === '500to1000' && (w.price < 500000 || w.price > 1000000)) return false;
        if (filterPrice === 'over1000' && w.price <= 1000000) return false;
      }

      return true;
    });
  }, [workshops, searchQuery, filterDate, filterLocation, filterPrice]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A5A40]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-5xl font-bold text-[#1a1a1a] mb-4">Khám phá Workshop</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tham gia các buổi workshop thú vị, học hỏi kỹ năng mới và kết nối với những người cùng đam mê.
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm mb-10 border border-[#e5e5e5]">
        <div className="flex items-center gap-2 mb-6 text-[#1a1a1a] font-semibold">
          <Filter className="w-5 h-5" />
          <span className="text-lg">Tìm kiếm & Bộ lọc</span>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm workshop theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-gray-700 bg-gray-50 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày diễn ra</label>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-gray-700 bg-gray-50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mức giá</label>
            <select 
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-gray-700 bg-gray-50 transition-all"
            >
              <option value="">Tất cả mức giá</option>
              <option value="free">Miễn phí</option>
              <option value="under500">Dưới 500.000đ</option>
              <option value="500to1000">500.000đ - 1.000.000đ</option>
              <option value="over1000">Trên 1.000.000đ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa điểm</label>
            <select 
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-gray-700 bg-gray-50 transition-all"
            >
              <option value="">Tất cả địa điểm</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {(searchQuery || filterDate || filterPrice || filterLocation) && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilterDate('');
                setFilterPrice('');
                setFilterLocation('');
              }}
              className="text-sm text-[#5A5A40] hover:text-[#3a3a29] hover:underline font-medium transition-colors"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {filteredWorkshops.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-[#e5e5e5]">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-serif font-bold text-[#1a1a1a] mb-2">Không tìm thấy kết quả</h3>
          <p className="text-gray-500">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWorkshops.map((workshop) => (
            <MotionLink 
              key={workshop.id} 
              to={`/workshop/${workshop.id}`}
              whileHover={{ y: -8, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#5A5A40]/15 transition-all duration-300 ease-out flex flex-col border border-[#e5e5e5]/50 hover:border-[#5A5A40]/20"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={workshop.imageUrl} 
                  alt={workshop.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-[#5A5A40] shadow-sm">
                  {workshop.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(workshop.price)}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-serif text-2xl font-bold mb-3 text-[#1a1a1a] line-clamp-2 group-hover:text-[#5A5A40] transition-colors">{workshop.title}</h3>
                
                <div className="space-y-2 mb-6 flex-grow">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{format(new Date(workshop.date), 'dd/MM/yyyy')} • {workshop.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="line-clamp-1">{workshop.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{workshop.bookedCount} / {workshop.capacity} người</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <span className="inline-block w-full text-center bg-[#f5f5f0] text-[#5A5A40] font-medium py-3 rounded-full group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                    Xem chi tiết
                  </span>
                </div>
              </div>
            </MotionLink>
          ))}
        </div>
      )}
    </div>
  );
}
