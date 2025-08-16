/**
 * Keyboard Shortcuts Component
 * Provides Trello-like keyboard shortcuts and enhanced interactions
 */

import { useEffect } from 'react';
import { useKanban } from '../contexts/KanbanContext';

/**
 * Keyboard Shortcuts Component
 */
const KeyboardShortcuts = () => {
  const { 
    createCard, 
    updateCard, 
    deleteCard, 
    moveCard, 
    columns, 
    cards,
    setFilters,
    filters 
  } = useKanban();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.tagName === 'SELECT' ||
          event.target.contentEditable === 'true') {
        return;
      }

      // Ctrl/Cmd + K: Quick search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + N: Create new card in Sales column
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        const salesColumn = columns.find(col => col.type === 'sales');
        if (salesColumn) {
          // Trigger card creation in Sales column
          const createButton = document.querySelector(`[data-column-id="${salesColumn.id}"] .create-card-button`);
          if (createButton) {
            createButton.click();
          }
        }
      }

      // Escape: Close modals, dropdowns, etc.
      if (event.key === 'Escape') {
        // Close any open dropdowns or modals
        const dropdowns = document.querySelectorAll('.dropdown-menu, .modal-overlay');
        dropdowns.forEach(dropdown => {
          if (dropdown.style.display !== 'none') {
            dropdown.style.display = 'none';
          }
        });
      }

      // Arrow keys: Navigate between cards
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const selectedCard = document.querySelector('.card.selected');
        if (selectedCard) {
          const currentColumn = selectedCard.closest('.kanban-column');
          const cardIndex = Array.from(currentColumn.querySelectorAll('.kanban-card')).indexOf(selectedCard);
          
          if (event.key === 'ArrowLeft') {
            // Move to previous column
            const prevColumn = currentColumn.previousElementSibling;
            if (prevColumn && prevColumn.classList.contains('kanban-column')) {
              const targetCard = prevColumn.querySelectorAll('.kanban-card')[cardIndex];
              if (targetCard) {
                selectedCard.classList.remove('selected');
                targetCard.classList.add('selected');
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          } else if (event.key === 'ArrowRight') {
            // Move to next column
            const nextColumn = currentColumn.nextElementSibling;
            if (nextColumn && nextColumn.classList.contains('kanban-column')) {
              const targetCard = nextColumn.querySelectorAll('.kanban-card')[cardIndex];
              if (targetCard) {
                selectedCard.classList.remove('selected');
                targetCard.classList.add('selected');
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }
        }
      }

      // Enter: Open selected card
      if (event.key === 'Enter') {
        const selectedCard = document.querySelector('.card.selected');
        if (selectedCard) {
          selectedCard.click();
        }
      }

      // Delete/Backspace: Delete selected card (with confirmation)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedCard = document.querySelector('.card.selected');
        if (selectedCard && !event.target.tagName === 'INPUT') {
          event.preventDefault();
          const cardId = selectedCard.dataset.cardId;
          if (cardId && confirm('Are you sure you want to delete this card?')) {
            deleteCard(cardId);
          }
        }
      }

      // Number keys: Quick priority setting
      if (event.key >= '1' && event.key <= '4') {
        const selectedCard = document.querySelector('.card.selected');
        if (selectedCard) {
          const priorities = ['low', 'medium', 'high', 'urgent'];
          const priority = priorities[parseInt(event.key) - 1];
          const cardId = selectedCard.dataset.cardId;
          if (cardId) {
            updateCard(cardId, { priority });
          }
        }
      }

      // F: Toggle filters panel
      if (event.key === 'f') {
        event.preventDefault();
        const filtersPanel = document.querySelector('.filters-panel');
        if (filtersPanel) {
          const isExpanded = filtersPanel.classList.contains('expanded');
          if (isExpanded) {
            filtersPanel.classList.remove('expanded');
          } else {
            filtersPanel.classList.add('expanded');
          }
        }
      }

      // H: Toggle help/shortcuts panel
      if (event.key === 'h') {
        event.preventDefault();
        const helpPanel = document.querySelector('.help-panel');
        if (helpPanel) {
          helpPanel.classList.toggle('hidden');
        }
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [columns, cards, createCard, updateCard, deleteCard, moveCard, setFilters, filters]);

  // Add data attributes to cards for keyboard navigation
  useEffect(() => {
    const cards = document.querySelectorAll('.kanban-card');
    cards.forEach((card, index) => {
      card.setAttribute('data-card-id', card.dataset.cardId || `card-${index}`);
      card.setAttribute('tabindex', '0');
      
      // Add click handler for selection
      card.addEventListener('click', (e) => {
        // Don't select if clicking on interactive elements
        if (e.target.closest('button, input, textarea, select')) {
          return;
        }
        
        // Remove selection from other cards
        document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('selected'));
        // Add selection to clicked card
        card.classList.add('selected');
      });
    });
  }, [cards]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;
