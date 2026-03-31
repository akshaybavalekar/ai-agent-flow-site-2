'use client';

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

/**
 * Registration form template for collecting user information.
 */
export function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (hasSubmitted) return;
    
    setHasSubmitted(true);
    console.log('Registration submitted:', formData);
    
    // Auto-dismiss after submit
    setTimeout(() => {
      console.log('RegistrationForm should dismiss now');
    }, 500);
  }, [hasSubmitted, formData]);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const isValid = formData.name.trim() && formData.email.trim();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md px-4"
      >
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Create Your Profile
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={hasSubmitted}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 outline-none focus:border-white/40 transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={hasSubmitted}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 outline-none focus:border-white/40 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={hasSubmitted}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 outline-none focus:border-white/40 transition-colors"
                placeholder="Enter your phone number"
              />
            </div>
            
            <button
              type="submit"
              disabled={!isValid || hasSubmitted}
              className={`
                w-full py-3 rounded-lg font-semibold text-base transition-all duration-200
                ${isValid && !hasSubmitted
                  ? 'bg-white/20 hover:bg-white/25 text-white border border-white/30'
                  : 'bg-white/10 text-white/50 border border-white/20 cursor-not-allowed'
                }
              `}
            >
              {hasSubmitted ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}