import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle, Star, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

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
  avgRating?: number;
  reviewCount?: number;
}

interface Review {
  id: string;
  workshopId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function WorkshopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hasBooked, setHasBooked] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetchWorkshopAndReviews = async () => {
      if (!id) return;
      try {
        // Fetch workshop
        const docRef = doc(db, 'workshops', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWorkshop({ id: docSnap.id, ...docSnap.data() } as Workshop);
        }

        // Fetch reviews
        const reviewsQuery = query(
          collection(db, 'reviews'), 
          where('workshopId', '==', id)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        // Sort by date descending client-side since we don't have a composite index yet
        reviewsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(reviewsData);

        if (user) {
          const userReview = reviewsData.find(r => r.userId === user.uid);
          if (userReview) setHasReviewed(true);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkUserStatus = async () => {
      if (!id || !user) return;
      try {
        // Check booking
        const bookingId = `${user.uid}_${id}`;
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (bookingSnap.exists() && bookingSnap.data().status === 'confirmed') {
          setHasBooked(true);
        }

        // Fetch user profile for review submission
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    };

    fetchWorkshopAndReviews();
    checkUserStatus();
  }, [id, user]);

  const handleBook = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để đặt chỗ!");
      return;
    }
    if (!workshop || !id) return;

    if (workshop.bookedCount >= workshop.capacity) {
      alert("Workshop đã hết chỗ!");
      return;
    }

    setBookingLoading(true);
    try {
      const bookingId = `${user.uid}_${id}`;
      const bookingRef = doc(db, 'bookings', bookingId);
      
      // Create booking
      await setDoc(bookingRef, {
        userId: user.uid,
        workshopId: id,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      // Update workshop count
      const workshopRef = doc(db, 'workshops', id);
      await updateDoc(workshopRef, {
        bookedCount: increment(1)
      });

      setWorkshop(prev => prev ? { ...prev, bookedCount: prev.bookedCount + 1 } : null);
      setBookingSuccess(true);
      setHasBooked(true);

      // Asynchronously queue email notification
      addDoc(collection(db, 'mail'), {
        to: user.email,
        message: {
          subject: `Xác nhận đặt chỗ: ${workshop.title}`,
          html: `
            <div style="font-family: sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #5A5A40;">Xác nhận đặt chỗ thành công!</h2>
              <p>Chào ${user.displayName || 'bạn'},</p>
              <p>Bạn đã đặt thành công vé tham gia workshop <strong>${workshop.title}</strong>.</p>
              <div style="background-color: #f5f5f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>📅 Thời gian:</strong> ${workshop.time} - ${format(new Date(workshop.date), 'dd/MM/yyyy')}</p>
                <p style="margin: 0;"><strong>📍 Địa điểm:</strong> ${workshop.location}</p>
              </div>
              <p>Bạn có thể xem chi tiết và quản lý vé của mình tại trang quản lý.</p>
              <br/>
              <a href="${window.location.origin}/dashboard" style="display: inline-block; background-color: #5A5A40; color: white; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold;">Xem vé của tôi</a>
            </div>
          `
        }
      }).catch(error => {
        console.error("Error queueing email:", error);
      });

    } catch (error) {
      console.error("Error booking workshop:", error);
      alert("Có lỗi xảy ra khi đặt chỗ. Vui lòng thử lại.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workshop || !id || !userProfile) return;
    
    if (!comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    setSubmittingReview(true);
    try {
      const newReview = {
        workshopId: id,
        userId: user.uid,
        userName: userProfile.name || user.displayName || 'Người dùng',
        userPhotoUrl: userProfile.photoUrl || null,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      // Remove undefined/null values for Firestore
      const cleanReview = Object.fromEntries(Object.entries(newReview).filter(([_, v]) => v != null));

      const reviewRef = await addDoc(collection(db, 'reviews'), cleanReview);
      
      // Calculate new average rating
      const currentCount = workshop.reviewCount || 0;
      const currentAvg = workshop.avgRating || 0;
      const newCount = currentCount + 1;
      const newAvg = ((currentAvg * currentCount) + rating) / newCount;

      // Update workshop
      const workshopRef = doc(db, 'workshops', id);
      await updateDoc(workshopRef, {
        avgRating: newAvg,
        reviewCount: newCount
      });

      // Update local state
      setReviews([{ id: reviewRef.id, ...newReview } as Review, ...reviews]);
      setWorkshop(prev => prev ? { ...prev, avgRating: newAvg, reviewCount: newCount } : null);
      setHasReviewed(true);
      setComment('');
      
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A5A40]"></div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy workshop</h2>
        <button onClick={() => navigate('/')} className="text-[#5A5A40] underline">Quay lại trang chủ</button>
      </div>
    );
  }

  const isFull = workshop.bookedCount >= workshop.capacity;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-gray-500 hover:text-[#1a1a1a] mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </button>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-12">
        <div className="relative h-[400px]">
          <img 
            src={workshop.imageUrl} 
            alt={workshop.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-grow">
              <h1 className="font-serif text-4xl font-bold text-[#1a1a1a] mb-4">{workshop.title}</h1>
              
              {/* Rating Summary */}
              {workshop.reviewCount ? (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="ml-1 font-bold text-[#1a1a1a]">{workshop.avgRating?.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-500">({workshop.reviewCount} đánh giá)</span>
                </div>
              ) : null}
              
              <div className="prose prose-lg text-gray-600 mb-8 whitespace-pre-wrap">
                {workshop.description}
              </div>
            </div>

            <div className="md:w-80 flex-shrink-0">
              <div className="bg-[#f5f5f0] rounded-2xl p-6 sticky top-24">
                <div className="text-3xl font-bold text-[#5A5A40] mb-6">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(workshop.price)}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-[#5A5A40]" />
                    <span>{format(new Date(workshop.date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-3 text-[#5A5A40]" />
                    <span>{workshop.time}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-[#5A5A40]" />
                    <span>{workshop.location}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-[#5A5A40]" />
                    <span>{workshop.bookedCount} / {workshop.capacity} người</span>
                  </div>
                </div>

                {bookingSuccess || hasBooked ? (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-center font-medium">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Đã đặt chỗ thành công
                  </div>
                ) : (
                  <button
                    onClick={handleBook}
                    disabled={bookingLoading || isFull}
                    className={`w-full py-4 rounded-full font-bold text-lg transition-colors ${
                      isFull 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#5A5A40] text-white hover:bg-[#4a4a35]'
                    }`}
                  >
                    {bookingLoading ? 'Đang xử lý...' : isFull ? 'Đã hết chỗ' : 'Đặt chỗ ngay'}
                  </button>
                )}
                
                {!user && !hasBooked && (
                  <p className="text-sm text-center text-gray-500 mt-4">
                    Vui lòng đăng nhập để đặt chỗ
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-[#1a1a1a] mb-8">Đánh giá từ người tham gia</h2>

        {/* Review Form (Only show if booked and hasn't reviewed yet) */}
        {user && hasBooked && !hasReviewed && (
          <div className="bg-[#f5f5f0] rounded-2xl p-6 mb-10">
            <h3 className="font-bold text-lg mb-4">Chia sẻ trải nghiệm của bạn</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-700 mr-2">Đánh giá:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Workshop này như thế nào? Hãy chia sẻ cảm nhận của bạn nhé..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none mb-4 min-h-[100px]"
                required
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-[#5A5A40] text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#4a4a35] transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {review.userPhotoUrl ? (
                      <img src={review.userPhotoUrl} alt={review.userName} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-[#1a1a1a]">{review.userName}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(review.createdAt), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Chưa có đánh giá nào cho workshop này. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!</p>
        )}
      </div>
    </div>
  );
}
