/**
 * Drop Zone Indicator Component
 * Visual feedback for drop zones during drag operations
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

const DropZoneIndicator = memo(({ 
  target, 
  isActive = false, 
  cardCount = 0,
  getDropZoneStyles 
}) => {
  const getIndicatorContent = () => {
    if (target.type === 'column') {
      return {
        icon: <Plus size={20} />,
        text: `Drop in ${target.title}`,
        subtext: `${cardCount} cards`
      };
    } else if (target.type === 'subcolumn') {
      return {
        icon: <ArrowDown size={20} />,
        text: `Drop in ${target.title}`,
        subtext: `${cardCount} cards`
      };
    }
    return {
      icon: <Plus size={20} />,
      text: 'Drop here',
      subtext: ''
    };
  };

  const content = getIndicatorContent();

  const animationVariants = {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      y: -10
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  if (!isActive) return null;

  return (
    <motion.div
      className={clsx(
        'fixed inset-0 pointer-events-none z-50',
        'flex items-center justify-center'
      )}
      variants={animationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm" />
      
      {/* Indicator */}
      <motion.div
        className={clsx(
          'relative bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed',
          'border-blue-400 dark:border-blue-500 shadow-lg',
          'px-6 py-4 min-w-[200px] text-center',
          'flex flex-col items-center space-y-2'
        )}
        style={getDropZoneStyles?.(isActive, true)}
        variants={pulseVariants}
        animate="animate"
      >
        {/* Icon */}
        <div className="text-blue-500 dark:text-blue-400">
          {content.icon}
        </div>

        {/* Text */}
        <div className="space-y-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {content.text}
          </p>
          {content.subtext && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {content.subtext}
            </p>
          )}
        </div>

        {/* Animated Border */}
        <div className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-pulse" />
      </motion.div>
    </motion.div>
  );
});

DropZoneIndicator.displayName = 'DropZoneIndicator';

export default DropZoneIndicator;
