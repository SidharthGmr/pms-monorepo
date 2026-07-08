// app/components/about/AboutSection.tsx
import React from 'react';
import { Users, Zap, Globe, Heart } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
}

interface AboutSectionProps {
  title?: string;
  subtitle?: string;
  mission?: string;
  vision?: string;
  stats?: Array<{ value: string; label: string; icon: React.ReactNode }>;
  team?: TeamMember[];
  className?: string;
}

const AboutSection: React.FC<AboutSectionProps> = ({
  title = "Building the Future of Frontend Development",
  subtitle = "We're a passionate team of developers, designers, and innovators creating tools that empower developers to build amazing interfaces faster.",
  mission = "To democratize frontend development by providing accessible, powerful tools that help developers focus on what matters most: creating exceptional user experiences.",
  vision = "We envision a world where building beautiful, performant interfaces is effortless and accessible to every developer, regardless of their experience level.",
  stats = [
    { value: "10K+", label: "Active Users", icon: <Users className="w-6 h-6" /> },
    { value: "500+", label: "Components", icon: <Zap className="w-6 h-6" /> },
    { value: "50+", label: "Countries", icon: <Globe className="w-6 h-6" /> },
    { value: "99%", label: "Satisfaction", icon: <Heart className="w-6 h-6" /> },
  ],
  team = [
    {
      name: "Alex Johnson",
      role: "Lead Developer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      description: "10+ years in frontend development"
    },
    {
      name: "Sarah Chen",
      role: "Design Director",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w-400&h=400&fit=crop",
      description: "Expert in design systems"
    },
    {
      name: "Marcus Lee",
      role: "Product Manager",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      description: "Focus on developer experience"
    },
    {
      name: "Priya Patel",
      role: "Community Lead",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      description: "Building our developer community"
    },
  ],
  className = "",
}) => {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-4">
            <span className="text-sm font-medium text-blue-400">About Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className=" text-gray-400 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center hover:border-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800/50 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-gray-400 leading-relaxed">{mission}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800/50 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-gray-400 leading-relaxed">{vision}</p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-white">Meet Our Team</h3>
            <p className="text-gray-400   text-center">
              The talented individuals behind our platform, dedicated to making your development experience exceptional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="relative mb-6 overflow-hidden rounded-xl">
                  <div className="aspect-square w-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h4 className="text-xl font-bold mb-1">{member.name}</h4>
                <div className="text-blue-400 mb-2">{member.role}</div>
                <p className="text-gray-400 text-sm">{member.description}</p>

                <div className="flex space-x-3 mt-4">
                  {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
                    <div
                      key={social}
                      className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-500/20 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium">{social[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-2xl p-8 md:p-12">
          <h3 className="text-3xl font-bold mb-8 text-center text-white">Our Core Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Innovation First",
                description: "We constantly push boundaries to deliver cutting-edge solutions",
                icon: "🚀"
              },
              {
                title: "Developer Love",
                description: "Everything we build is designed with developers in mind",
                icon: "❤️"
              },
              {
                title: "Quality Matters",
                description: "We maintain the highest standards in code and design",
                icon: "✨"
              },
            ].map((value, index) => (
              <div key={index} className="text-center p-6">
                <div className="text-3xl mb-4">{value.icon}</div>
                <h4 className="text-xl font-bold mb-3 text-white">{value.title}</h4>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;