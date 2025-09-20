/**
 * Multi-Select Overlay Component
 * Shows selected cards during multi-drag operations
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { X, Move, Copy } from 'lucide-react';
import clsx from 'clsx';

const MultiSelectOverlay = memo(({ 
  cards = [], 
  count = 0,
  onClose,
  onMove,
  onCopy 
}) => {
  const animationVariants = {
    initial: { 
      scale: 0.9, 
      opacity: 0,
      y: 20
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    },
    exit: {
      scale: 0.9,
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const cardVariants = {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      x: -20
    },
    animate: {
      scale: 1,
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      variants={animationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Overlay Content */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        variants={animationVariants}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Move size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Moving {count} cards
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select destination column or subcolumn
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onCopy}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Copy cards"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cards Preview */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className={clsx(
                  'bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600',
                  'p-3 space-y-2'
                )}
                variants={cardVariants}
                style={{ zIndex: cards.length - index }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                    {card.title}
                  </h4>
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Meta */}
                <div className="space-y-1">
                  {card.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {card.description}
                    </p>
                  )}
                  
                  {/* Labels */}
                  {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.labels.slice(0, 2).map((label, labelIndex) => (
                        <span
                          key={labelIndex}
                          className="px-2 py-1 text-xs rounded text-white"
                          style={{ backgroundColor: label.color || '#6b7280' }}
                        >
                          {label.name || label}
                        </span>
                      ))}
                      {card.labels.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                          +{card.labels.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Priority */}
                  {card.priority && card.priority !== 'medium' && (
                    <div className={clsx(
                      'inline-block px-2 py-1 text-xs rounded font-medium',
                      {
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': card.priority === 'urgent',
                        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': card.priority === 'high',
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': card.priority === 'low'
                      }
                    )}>
                      {card.priority}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {count} card{count !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onMove}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Move Cards
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

MultiSelectOverlay.displayName = 'MultiSelectOverlay';

export default MultiSelectOverlay;
