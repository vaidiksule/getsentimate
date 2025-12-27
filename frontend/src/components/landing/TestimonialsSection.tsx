"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Gaming Central",
        subscribers: "1.8M subscribers",
        category: "Gaming",
        rating: 5,
        text: "The AI insights are game-changing. I discovered content ideas I never would have thought of just by analyzing my community's sentiment.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=gaming",
    },
    {
        name: "Cooking with Maria",
        subscribers: "850K subscribers",
        category: "Food & Cooking",
        rating: 5,
        text: "This tool transformed my community engagement. I now know exactly what my viewers love and what they want to see next!",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=cooking",
    },
    {
        name: "Fitness Guru",
        subscribers: "1.2M subscribers",
        category: "Health & Fitness",
        rating: 5,
        text: "The persona analysis helped me understand my audience demographics better than YouTube analytics ever did. Truly impressive.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=fitness",
    },
    {
        name: "Tech Today",
        subscribers: "500K subscribers",
        category: "Technology",
        rating: 5,
        text: "GetSentimate saves me hours of manual comment reading. The automated topic extraction is incredibly accurate.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=tech",
    },
    {
        name: "Travel Tales",
        subscribers: "2.1M subscribers",
        category: "Travel",
        rating: 5,
        text: "Finally, a tool that actually understands the Nuance of comments! The sentiment analysis is spot-on for every video.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=travel",
    },
];

export function TestimonialsSection() {
    // Multiply the testimonials to create an infinite scroll effect
    const doubledTestimonials = [...testimonials, ...testimonials];

    return (
        <section className="pb-12 pt-0 overflow-hidden bg-white">

            <div className="relative flex overflow-hidden py-10">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent" />
                <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent" />

                <motion.div
                    className="flex whitespace-nowrap"
                    animate={{
                        x: ["0%", "-50%"],
                    }}
                    transition={{
                        duration: 50,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                >
                    {doubledTestimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="inline-block mx-4 w-[280px] sm:w-[350px] bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] whitespace-normal"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-neutral-100 overflow-hidden flex-shrink-0">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-semibold text-neutral-900 truncate">
                                            {testimonial.name}
                                        </h3>
                                        {/* <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-700/10">
                                            {testimonial.category}
                                        </span> */}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className="flex">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[11px] text-neutral-400">
                                            · {testimonial.subscribers}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-neutral-600 italic italic">
                                "{testimonial.text}"
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
