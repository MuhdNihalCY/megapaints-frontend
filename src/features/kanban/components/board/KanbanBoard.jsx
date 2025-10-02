/**
 * KanbanBoard Component
 * Main container for the Kanban board system with enhanced drag and drop
 * Consolidated from PragmaticKanbanBoard for better organization
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, HelpCircle, Settings } from 'lucide-react';

import { useKanban } from '../../contexts/KanbanContext';
import { usePragmaticDragAndDrop, useDragMonitor } from '../../hooks/usePragmaticDragAndDrop';
import PragmaticKanbanCard from '../cards/PragmaticKanbanCard';
import KanbanColumn from '../columns/KanbanColumn';
import FiltersPanel from '../ui/FiltersPanel';
import HelpPanel from '../ui/HelpPanel';
import KeyboardShortcuts from '../ui/KeyboardShortcuts';
import CardModal from '../cards/CardModal';

import { LoadingOverlay } from '../../../../components';

const KanbanBoard = () => {
  return <PragmaticKanbanBoard />;
};

export default KanbanBoard;