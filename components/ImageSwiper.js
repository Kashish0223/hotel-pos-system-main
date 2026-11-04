"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import Image from "next/image"

// type ImageCarouselProps = {
//   images: string[]
// }

// export default function ImageCarousel({ images }: ImageCarouselProps) {
export default function ImageCarousel({ images }) {
  if (!images || images.length === 0) return null

  return (
   <Swiper
  modules={[Navigation, Pagination]}
  loop={true}
  navigation
  pagination={{ clickable: true }}
  className="w-full h-64 rounded-lg overflow-hidden custom-swiper"
>
  {images.map((src, idx) => (
    <SwiperSlide key={idx} className="flex items-center justify-center bg-black">
      <Image
        src={src}
        alt={`Slide ${idx}`}
        width={600}
        height={400}
        // className="object-contain max-h-64 w-full"
        className="object-cover w-full h-full"
      />
    </SwiperSlide>
  ))}
</Swiper>

  )
}
