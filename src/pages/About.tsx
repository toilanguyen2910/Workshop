import { motion } from 'motion/react';
import { Users, Target, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h1 className="font-serif text-5xl font-bold text-[#1a1a1a] mb-6">Về Workshop Discovery</h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Chúng tôi tin rằng mỗi người đều có một niềm đam mê tiềm ẩn chờ được đánh thức. 
          Workshop Discovery ra đời với sứ mệnh kết nối những tâm hồn đồng điệu, tạo ra không gian 
          để mọi người cùng học hỏi, sáng tạo và chia sẻ những trải nghiệm đáng nhớ.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-3xl shadow-sm text-center"
        >
          <div className="w-16 h-16 bg-[#f5f5f0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#5A5A40]">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold mb-4 text-[#1a1a1a]">Sứ mệnh</h3>
          <p className="text-gray-600">
            Mang đến những trải nghiệm workshop chất lượng cao, đa dạng chủ đề, giúp mọi người dễ dàng tiếp cận và phát triển kỹ năng mới.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-3xl shadow-sm text-center"
        >
          <div className="w-16 h-16 bg-[#f5f5f0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#5A5A40]">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold mb-4 text-[#1a1a1a]">Cộng đồng</h3>
          <p className="text-gray-600">
            Xây dựng một cộng đồng gắn kết, nơi những người yêu thích sáng tạo có thể giao lưu, kết bạn và truyền cảm hứng cho nhau.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-3xl shadow-sm text-center"
        >
          <div className="w-16 h-16 bg-[#f5f5f0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#5A5A40]">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold mb-4 text-[#1a1a1a]">Giá trị</h3>
          <p className="text-gray-600">
            Đề cao sự tận tâm, sáng tạo và chất lượng trong từng buổi workshop. Niềm vui của bạn là thành công lớn nhất của chúng tôi.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl overflow-hidden h-[400px] relative"
      >
        <img 
          src="https://picsum.photos/seed/workshop-about/1200/600" 
          alt="Workshop Community" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h2 className="text-white font-serif text-4xl md:text-5xl font-bold text-center px-4">
            Cùng nhau tạo nên những khoảnh khắc ý nghĩa
          </h2>
        </div>
      </motion.div>
    </div>
  );
}
