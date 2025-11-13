import React, { useEffect, useRef, useState } from 'react';

const Reveal = ({ 
  children, 
  animation = 'fade-in', 
  delay = 0, 
  duration = 600,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-out';
    const durationClass = `duration-${duration}`;
    
    switch (animation) {
      case 'fade-in':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`;
      case 'slide-up':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`;
      case 'slide-left':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 translate-x-8'
        }`;
      case 'slide-right':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 -translate-x-8'
        }`;
      case 'scale':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`;
      case 'rotate':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 rotate-0' 
            : 'opacity-0 rotate-3'
        }`;
      default:
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100' 
            : 'opacity-0'
        }`;
    }
  };

  return (
    <div 
      ref={ref} 
      className={`${getAnimationClasses()} ${className}`}
    >
      {children}
    </div>
  );
};

export default Reveal;


