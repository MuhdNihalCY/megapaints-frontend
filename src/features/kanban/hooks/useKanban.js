/**
 * Custom Hooks for Kanban Board
 * Reusable hooks for common Kanban functionality
 */

import { useMemo } from 'react';
import { CARD_PRIORITIES } from '../utils/constants';

/**
 * Hook for managing priority display
 * @param {string} priority - Priority level
 * @returns {Object} Priority display information
 */
export const usePriorityDisplay = (priority) => {
  return useMemo(() => {
    // CARD_PRIORITIES uses uppercase keys (LOW, MEDIUM, HIGH, URGENT)
    // but card priorities are lowercase (low, medium, high, urgent)
    // Find the matching priority by checking the id field
    const priorityKey = priority ? priority.toUpperCase() : 'MEDIUM';
    let priorityConfig = CARD_PRIORITIES[priorityKey];
    
    // If not found by key, search by id field
    if (!priorityConfig) {
      const found = Object.values(CARD_PRIORITIES).find(p => 
        p.id === priority || 
        p.id === priority?.toLowerCase() || 
        p.name?.toLowerCase() === priority?.toLowerCase() ||
        p.id?.toUpperCase() === priorityKey
      );
      priorityConfig = found || CARD_PRIORITIES.MEDIUM;
    }
    
    // Ensure we have a valid config
    if (!priorityConfig) {
      priorityConfig = CARD_PRIORITIES.MEDIUM;
    }
    
    return {
      level: priority || 'medium',
      label: priorityConfig.name || 'Medium', // CARD_PRIORITIES uses 'name', not 'label'
      color: priorityConfig.color || '#3B82F6',
      icon: priorityConfig.icon,
      bgColor: priorityConfig.bgColor || `${priorityConfig.color}20`,
      textColor: priorityConfig.textColor || priorityConfig.color
    };
  }, [priority]);
};

/**
 * Hook for managing labels display
 * @param {Array} labels - Array of label objects
 * @param {Array} availableLabels - Array of available labels
 * @returns {Object} Labels display information
 */
export const useLabelsDisplay = (labels, availableLabels = []) => {
  return useMemo(() => {
    if (!labels || labels.length === 0) {
      return {
        labels: [],
        hasLabels: false,
        labelCount: 0
      };
    }

    const labelInfo = labels.map(label => {
      const availableLabel = availableLabels.find(al => al.id === label.id);
      return {
        id: label.id,
        name: label.name || availableLabel?.name || 'Unknown',
        color: label.color || availableLabel?.color || '#6b7280',
        bgColor: `${label.color || availableLabel?.color || '#6b7280'}20`,
        textColor: label.color || availableLabel?.color || '#6b7280'
      };
    });

    return {
      labels: labelInfo,
      hasLabels: true,
      labelCount: labelInfo.length
    };
  }, [labels, availableLabels]);
};
