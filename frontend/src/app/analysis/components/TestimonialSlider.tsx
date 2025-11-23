"use client";

import { useEffect, useRef, useState } from "react";

interface Testimonial {
  id: number;
  channelName: string;
  channelImage: string;
  content: string;
  rating: number;
  subscribers: string;
  category: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    channelName: "TechReview Pro",
    channelImage: "/placeholder-channel-1.jpg",
    content: "GetSentimate completely changed how I understand my audience. The sentiment analysis helped me create content that resonates 10x better.",
    rating: 5,
    subscribers: "2.5M",
    category: "Technology"
  },
  {
    id: 2,
    channelName: "Gaming Central",
    channelImage: "/placeholder-channel-2.jpg",
    content: "The AI insights are game-changing. I discovered content ideas I never would have thought of based on my comments analysis.",
    rating: 4,
    subscribers: "1.8M",
    category: "Gaming"
  },
  {
    id: 3,
    channelName: "Cooking with Maria",
    channelImage: "/placeholder-channel-3.jpg",
    content: "This tool transformed my community engagement. I now know exactly what my viewers want to see next.",
    rating: 5,
    subscribers: "850K",
    category: "Food & Cooking"
  },
  {
    id: 4,
    channelName: "Fitness Guru",
    channelImage: "/placeholder-channel-4.jpg",
    content: "The persona analysis helped me understand my audience demographics better than any analytics tool I've ever used.",
    rating: 5,
    subscribers: "1.2M",
    category: "Fitness"
  },
  {
    id: 5,
    channelName: "Travel Stories",
    channelImage: "/placeholder-channel-5.jpg",
    content: "GetSentimate helped me double my engagement rate by understanding what content truly resonates with my audience.",
    rating: 5,
    subscribers: "3.1M",
    category: "Travel"
  },
  {
    id: 6,
    channelName: "Music Beats",
    channelImage: "/placeholder-channel-6.jpg",
    content: "The sentiment analysis is incredibly accurate. I can now predict which content will perform best before I even create it.",
    rating: 4,
    subscribers: "950K",
    category: "Music"
  }
];

export function TestimonialSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>();
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .fade-edge {
        position: relative;
      }
      .fade-edge::before,
      .fade-edge::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 100px;
        z-index: 10;
        pointer-events: none;
      }
      .fade-edge::before {
        left: 0;
        background: linear-gradient(to right, rgba(255, 255, 255, 0.8), transparent);
      }
      .fade-edge::after {
        right: 0;
        background: linear-gradient(to left, rgba(248, 250, 252, 0.8), transparent);
      }
      @media (max-width: 640px) {
        .fade-edge::before,
        .fade-edge::after {
          width: 60px;
        }
      }
      /* Ensure smooth infinite scroll */
      .slider-container {
        display: flex;
        width: fit-content;
        will-change: transform;
      }
      /* Hide scrollbar */
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Animation loop for smooth scrolling
  const animate = () => {
    if (!sliderRef.current || isDragging) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const now = Date.now();
    const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = now;

    if (!isPaused) {
      // Auto-scroll speed (pixels per second)
      const autoScrollSpeed = 50; // Adjust this for faster/slower scrolling
      positionRef.current -= autoScrollSpeed * deltaTime;
      
      // Reset position when we've scrolled through half the content
      const maxScroll = sliderRef.current.scrollWidth / 2;
      if (Math.abs(positionRef.current) >= maxScroll) {
        positionRef.current = 0;
      }
    }

    // Apply smooth deceleration when dragging stops
    if (!isDragging && Math.abs(velocityRef.current) > 0.1) {
      positionRef.current += velocityRef.current;
      velocityRef.current *= 0.95; // Friction
      
      if (Math.abs(velocityRef.current) < 0.1) {
        velocityRef.current = 0;
      }
    }

    // Apply the transform
    sliderRef.current.style.transform = `translateX(${positionRef.current}px)`;
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, isPaused]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeft(positionRef.current);
    setIsPaused(true);
    velocityRef.current = 0;
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Resume animation after a short delay to allow momentum to finish
    setTimeout(() => setIsPaused(false), 100);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 100);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const deltaX = x - startX;
    const newPosition = scrollLeft + deltaX;
    
    // Update position and calculate velocity for momentum
    positionRef.current = newPosition;
    velocityRef.current = deltaX * 0.5; // Store velocity for smooth momentum
    setStartX(x);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setScrollLeft(positionRef.current);
    setIsPaused(true);
    velocityRef.current = 0;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 100);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const x = e.touches[0].pageX;
    const deltaX = x - startX;
    const newPosition = scrollLeft + deltaX;
    
    positionRef.current = newPosition;
    velocityRef.current = deltaX * 0.5;
    setStartX(x);
  };

  return (
    <div className="w-full py-20">
      <div className="max-w-7xl mx-auto w-full">
        {/* Testimonials Slider */}
        <div className="fade-edge relative overflow-hidden">
          <div
            ref={sliderRef}
            className="slider-container overflow-x-auto scrollbar-hide"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: isDragging ? 'none' : 'auto'
            }}
          >
            {/* Triple testimonials for extra seamless loop */}
            {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={`${testimonial.id}-${index}`}
                className="flex-shrink-0 w-64 sm:w-72 md:w-80 mx-2 sm:mx-4"
              >
                <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-neutral-200 p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                  {/* Category Badge */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {testimonial.category}
                    </span>
                  </div>

                  {/* Channel Info */}
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full mr-2 sm:mr-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={testimonial.channelImage}
                          alt={testimonial.channelName}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/seed/${testimonial.channelName}/48/48.jpg`;
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                        {testimonial.channelName}
                      </h3>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="flex items-center">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <svg
                              key={i}
                              className="w-3 h-3 text-yellow-400 fill-current"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-neutral-500 hidden sm:inline">• {testimonial.subscribers} subscribers</span>
                        <span className="text-xs text-neutral-500 sm:hidden">• {testimonial.subscribers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial Content */}
                  <blockquote className="text-xs sm:text-sm text-neutral-700 leading-relaxed line-clamp-3 sm:line-clamp-none">
                    "{testimonial.content}"
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}