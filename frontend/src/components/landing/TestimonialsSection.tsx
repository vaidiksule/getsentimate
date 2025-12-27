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
    const doubledTestimonials = [...testimonials, ...testimonials];

    return (
        <section className="py-24 overflow-hidden bg-white">
            <div className="relative flex overflow-hidden">
                <motion.div
                    className="flex whitespace-nowrap"
                    animate={{
                        x: ["0%", "-50%"],
                    }}
                    transition={{
                        duration: 80,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                >
                    {doubledTestimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="inline-block mx-6 w-[350px] apple-card p-10 whitespace-normal bg-white"
                        >
                            <div className="flex items-center gap-5 mb-8">
                                <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-body font-bold text-black truncate tracking-tight">
                                            {testimonial.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="flex">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-3 w-3 fill-yellow-primary text-yellow-primary"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-micro text-gray-400 font-medium">
                                            · {testimonial.subscribers}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-secondary leading-relaxed text-gray-600 font-medium italic">
                                "{testimonial.text}"
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
