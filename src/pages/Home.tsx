import { useMemo, useState } from 'react'
import { Calendar, Filter, MapPin, Search, Banknote } from 'lucide-react'
import { workshops as allWorkshops } from '../data/workshops'
import type { Workshop } from '../types/workshop'

function formatMoney(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterPrice, setFilterPrice] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  const uniqueLocations = useMemo(() => {
    const set = new Set(allWorkshops.map((w) => w.location))
    return Array.from(set).sort()
  }, [])

  const filtered = useMemo(() => {
    return allWorkshops.filter((w) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !w.title.toLowerCase().includes(q) &&
          !w.description.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (filterDate && w.date !== filterDate) return false
      if (filterLocation && w.location !== filterLocation) return false
      if (filterPrice) {
        if (filterPrice === 'free' && w.price > 0) return false
        if (filterPrice === 'under500' && w.price >= 500_000) return false
        if (
          filterPrice === '500to1000' &&
          (w.price < 500_000 || w.price > 1_000_000)
        )
          return false
        if (filterPrice === 'over1000' && w.price <= 1_000_000) return false
      }
      return true
    })
  }, [searchQuery, filterDate, filterPrice, filterLocation])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f9f9f5] pb-24">
      <section className="mx-auto max-w-4xl px-4 pb-8 pt-10 text-center sm:px-6">
        <h1
          className="text-4xl font-semibold tracking-tight text-[#1a1a1a] sm:text-5xl"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Khám phá Workshop
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
          Tham gia các buổi workshop thú vị, học hỏi kỹ năng mới và kết nối với
          những người cùng đam mê.
        </p>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6">
        <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-[#1a1a1a]">
            <Filter className="h-5 w-5 text-[#4a4e31]" aria-hidden />
            <h2 className="text-base font-semibold">Tìm kiếm & Bộ lọc</h2>
          </div>

          <div className="relative mb-4">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm workshop theo tên hoặc mô tả..."
              className="w-full rounded-xl border border-stone-200 bg-[#fafaf8] py-3 pl-11 pr-4 text-sm outline-none ring-[#4a4e31]/20 focus:border-[#4a4e31]/50 focus:ring-2"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-stone-500">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Ngày diễn ra
              </span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4a4e31]/25"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-stone-500">
                <Banknote className="h-3.5 w-3.5" aria-hidden />
                Mức giá
              </span>
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4a4e31]/25"
              >
                <option value="">Tất cả mức giá</option>
                <option value="free">Miễn phí</option>
                <option value="under500">Dưới 500.000 ₫</option>
                <option value="500to1000">500.000 – 1.000.000 ₫</option>
                <option value="over1000">Trên 1.000.000 ₫</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-stone-500">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Địa điểm
              </span>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4a4e31]/25"
              >
                <option value="">Tất cả địa điểm</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
          {filtered.length === 0 ? (
            <EmptySearch />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-1">
              {filtered.map((w) => (
                <WorkshopCard key={w.id} workshop={w} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function EmptySearch() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-stone-100 p-6">
        <Search className="h-14 w-14 text-stone-300" strokeWidth={1.25} aria-hidden />
      </div>
      <p className="text-lg font-medium text-stone-700">Không tìm thấy kết quả</p>
      <p className="mt-2 max-w-sm text-sm text-stone-500">
        Vui lòng thử lại với từ khóa hoặc bộ lọc khác.
      </p>
    </div>
  )
}

function WorkshopCard({ workshop: w }: { workshop: Workshop }) {
  return (
    <li className="overflow-hidden rounded-2xl border border-stone-100 bg-[#fafaf8] transition hover:border-[#4a4e31]/25">
      <div className="flex flex-col sm:flex-row">
        <div className="aspect-[16/10] shrink-0 sm:aspect-auto sm:w-52">
          <img
            src={w.imageUrl}
            alt=""
            className="h-full w-full object-cover sm:h-40"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">{w.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">{w.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {formatDate(w.date)} · {w.time}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {w.location}
            </span>
            <span className="font-medium text-[#4a4e31]">
              {w.price === 0 ? 'Miễn phí' : formatMoney(w.price)}
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}
