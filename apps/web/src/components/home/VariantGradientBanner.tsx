// app/components/gradient-banner/VariantGradientBanner.tsx
import React from 'react';

interface VariantGradientBannerProps {
    variant?: 'default' | 'animated' | 'minimal';
    className?: string;
}

const VariantGradientBanner: React.FC<VariantGradientBannerProps> = ({
    variant = 'default',
    className = ''
}) => {
    // Variant styles
    const variants = {
        default: {
            bg: 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500',
            textGradient: 'from-white via-blue-100 to-purple-100'
        },
        animated: {
            bg: 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 animate-gradient',
            textGradient: 'from-white via-cyan-100 to-purple-100'
        },
        minimal: {
            bg: 'bg-gradient-to-br from-blue-600 to-purple-700',
            textGradient: 'from-white to-gray-200'
        }
    };

    const currentVariant = variants[variant];

    return (
        <div className={`relative overflow-hidden ${currentVariant.bg} ${className}`}>
            {/* Optional overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>

            <div className="relative z-10 min-h-[500px] flex items-center justify-center p-8">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    {/* First Line - Subtle */}
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-white/90 tracking-tight">
                            More Than Components,
                        </h1>
                    </div>

                    {/* Second Line - Bold with Gradient */}
                    <div className="space-y-4">
                        <h2 className={`text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r ${currentVariant.textGradient} bg-clip-text text-transparent leading-tight`}>
                            It&apos;s Your Frontend Universe
                        </h2>
                    </div>

                    {/* Third Paragraph */}
                    <div className="pt-4">
                        <p className="text-lg md:text-xl text-white/85 max-w-3xl mx-auto leading-relaxed font-light backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
                            UI toyouts isn&apos;t just a library, it&apos;s a complete toolkit with components,
                            effects, design tools, and ready-to-use blocks, everything you need to
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariantGradientBanner;