/**
 * Keyboard Shortcuts Component
 * Provides Trello-like keyboard shortcuts and enhanced interactions
 */

import { useEffect, useRef } from 'react';
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

  const lastKeyTime = useRef(0);
  const cardSetupInterval = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent multiple rapid key events
      const now = Date.now();
      if (now - lastKeyTime.current < 50) {
        return;
      }
      lastKeyTime.current = now;

      // Don't trigger shortcuts when typing in input fields
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.tagName === 'SELECT' ||
          event.target.contentEditable === 'true') {
        return;
      }

      // Build key combination for logging
      const modifiers = [];
      if (event.ctrlKey) modifiers.push('Ctrl');
      if (event.metaKey) modifiers.push('Cmd');
      if (event.shiftKey) modifiers.push('Shift');
      if (event.altKey) modifiers.push('Alt');
      
      const keyComboString = [...modifiers, event.key.toUpperCase()].join('+');
      console.log('Key combo:', keyComboString);

      // Ctrl/Cmd + S: Quick search (Search)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        console.log('Search shortcut triggered');
        const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]');
        if (searchInput) {
          searchInput.focus();
        } else {
          console.log('Search input not found');
        }
        return;
      }

      // Ctrl/Cmd + T: Create new card in Sales column (Task)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        console.log('Create card shortcut triggered');
        const salesColumn = columns.find(col => col.type === 'sales');
        if (salesColumn) {
          // Try to find create button in sales column using multiple approaches
          const columnElement = document.querySelector(`[data-column-id="${salesColumn.id}"]`);
          if (columnElement) {
            // Try different selectors to find the create button
            let createButton = columnElement.querySelector('.create-card-button button') ||
                              columnElement.querySelector('button[title*="Add"]') ||
                              columnElement.querySelector('button[title*="Create"]') ||
                              columnElement.querySelector('button[title*="New"]') ||
                              columnElement.querySelector('button[title="Add new card"]');
            
            // If still not found, try to find by text content
            if (!createButton) {
              const buttons = columnElement.querySelectorAll('button');
              createButton = Array.from(buttons).find(button => 
                button.textContent.toLowerCase().includes('add card') ||
                button.textContent.toLowerCase().includes('add') ||
                button.textContent.toLowerCase().includes('create') ||
                button.textContent.toLowerCase().includes('new')
              );
            }
            
            if (createButton) {
              createButton.click();
            } else {
              console.log('Create button not found for sales column');
            }
          } else {
            console.log('Sales column element not found in DOM');
          }
        } else {
          console.log('Sales column not found');
        }
        return;
      }

      // Escape: Close modals, dropdowns, etc.
      if (event.key === 'Escape') {
        console.log('Escape shortcut triggered');
        // Close any open dropdowns or modals
        const dropdowns = document.querySelectorAll('.dropdown-menu, .modal-overlay, .help-panel');
        dropdowns.forEach(dropdown => {
          if (dropdown.style.display !== 'none') {
            dropdown.style.display = 'none';
          }
        });
        return;
      }

      // Arrow keys: Navigate between cards
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        console.log('Arrow key navigation triggered');
        const selectedCard = document.querySelector('[data-card-id].selected, .kanban-card.selected, .card.selected');
        if (selectedCard) {
          const currentColumn = selectedCard.closest('[data-column-id], .kanban-column');
          const cardIndex = Array.from(currentColumn.querySelectorAll('[data-card-id], .kanban-card, .card')).indexOf(selectedCard);
          
          if (event.key === 'ArrowLeft') {
            // Move to previous column
            const prevColumn = currentColumn.previousElementSibling;
            if (prevColumn && (prevColumn.hasAttribute('data-column-id') || prevColumn.classList.contains('kanban-column'))) {
              const targetCard = prevColumn.querySelectorAll('[data-card-id], .kanban-card, .card')[cardIndex];
              if (targetCard) {
                selectedCard.classList.remove('selected');
                targetCard.classList.add('selected');
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          } else if (event.key === 'ArrowRight') {
            // Move to next column
            const nextColumn = currentColumn.nextElementSibling;
            if (nextColumn && (nextColumn.hasAttribute('data-column-id') || nextColumn.classList.contains('kanban-column'))) {
              const targetCard = nextColumn.querySelectorAll('[data-card-id], .kanban-card, .card')[cardIndex];
              if (targetCard) {
                selectedCard.classList.remove('selected');
                targetCard.classList.add('selected');
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }
        } else {
          console.log('No selected card found for navigation');
        }
        return;
      }

      // Space: Open selected card (more intuitive than Enter)
      if (event.key === ' ') {
        event.preventDefault();
        console.log('Space shortcut triggered');
        const selectedCard = document.querySelector('[data-card-id].selected, .kanban-card.selected, .card.selected');
        if (selectedCard) {
          selectedCard.click();
        } else {
          console.log('No selected card found to open');
        }
        return;
      }

      // Ctrl/Cmd + Delete: Delete selected card (with confirmation)
      if ((event.ctrlKey || event.metaKey) && (event.key === 'Delete' || event.key === 'Backspace')) {
        console.log('Delete shortcut triggered');
        const selectedCard = document.querySelector('[data-card-id].selected, .kanban-card.selected, .card.selected');
        if (selectedCard) {
          event.preventDefault();
          const cardId = selectedCard.dataset.cardId;
          if (cardId && confirm('Are you sure you want to delete this card?')) {
            deleteCard(cardId);
          }
        } else {
          console.log('No selected card found to delete');
        }
        return;
      }

      // Number keys: Quick priority setting
      if (event.key >= '1' && event.key <= '4') {
        console.log('Priority shortcut triggered:', event.key);
        const selectedCard = document.querySelector('[data-card-id].selected, .kanban-card.selected, .card.selected');
        if (selectedCard) {
          const priorities = ['low', 'medium', 'high', 'urgent'];
          const priority = priorities[parseInt(event.key) - 1];
          const cardId = selectedCard.dataset.cardId;
          if (cardId) {
            updateCard(cardId, { priority });
          }
        } else {
          console.log('No selected card found for priority setting');
        }
        return;
      }

      // Ctrl/Cmd + F: Toggle filters panel (Filter)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        console.log('Filters shortcut triggered');
        const filtersPanel = document.querySelector('.filters-panel, [data-testid="filters-panel"]');
        if (filtersPanel) {
          const isExpanded = filtersPanel.classList.contains('expanded');
          if (isExpanded) {
            filtersPanel.classList.remove('expanded');
          } else {
            filtersPanel.classList.add('expanded');
          }
        } else {
          console.log('Filters panel not found');
        }
        return;
      }

      // Ctrl/Cmd + H: Toggle help/shortcuts panel (Help)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        console.log('Help shortcut triggered');
        const helpPanel = document.querySelector('.help-panel, [data-testid="help-panel"]');
        if (helpPanel) {
          helpPanel.classList.toggle('hidden');
        } else {
          console.log('Help panel not found');
        }
        return;
      }

      // Ctrl/Cmd + R: Refresh board data (Refresh)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        console.log('Refresh shortcut triggered');
        // Trigger a board refresh - you might want to add this to your context
        window.location.reload();
        return;
      }

      // Ctrl/Cmd + E: Edit selected card (Edit)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        console.log('Edit shortcut triggered');
        const selectedCard = document.querySelector('[data-card-id].selected, .kanban-card.selected, .card.selected');
        if (selectedCard) {
          // Get the card ID and trigger edit mode
          const cardId = selectedCard.dataset.cardId;
          if (cardId) {
            // Find the card data and trigger edit modal
            const cardData = cards.find(card => card.id === cardId);
            if (cardData) {
              // Dispatch a custom event to trigger edit mode
              const editEvent = new CustomEvent('editCard', { 
                detail: { card: cardData } 
              });
              document.dispatchEvent(editEvent);
            } else {
              console.log('Card data not found for editing');
            }
          } else {
            console.log('No card ID found on selected card');
          }
        } else {
          console.log('No selected card found to edit');
        }
        return;
      }

      // Ctrl/Cmd + M: Move selected card to next column (Move)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        console.log('Move shortcut triggered');
        const selectedCard = document.querySelector('[data-card-id].selected, .kanban-card.selected, .card.selected');
        if (selectedCard) {
          const cardId = selectedCard.dataset.cardId;
          const currentColumn = selectedCard.closest('[data-column-id], .kanban-column');
          const nextColumn = currentColumn.nextElementSibling;
          
          if (nextColumn && (nextColumn.hasAttribute('data-column-id') || nextColumn.classList.contains('kanban-column'))) {
            const targetColumnId = nextColumn.dataset.columnId;
            if (cardId && targetColumnId) {
              moveCard(cardId, targetColumnId);
            }
          }
        } else {
          console.log('No selected card found to move');
        }
        return;
      }

      // Ctrl/Cmd + B: Move selected card to previous column (Back)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        console.log('Back shortcut triggered');
        const selectedCard = document.querySelector('[data-card-id].selected, .kanban-card.selected, .card.selected');
        if (selectedCard) {
          const cardId = selectedCard.dataset.cardId;
          const currentColumn = selectedCard.closest('[data-column-id], .kanban-column');
          const prevColumn = currentColumn.previousElementSibling;
          
          if (prevColumn && (prevColumn.hasAttribute('data-column-id') || prevColumn.classList.contains('kanban-column'))) {
            const targetColumnId = prevColumn.dataset.columnId;
            if (cardId && targetColumnId) {
              moveCard(cardId, targetColumnId);
            }
          }
        } else {
          console.log('No selected card found to move back');
        }
        return;
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [columns, cards, createCard, updateCard, deleteCard, moveCard, setFilters, filters]);

  // Setup card selection with polling to handle dynamic content
  useEffect(() => {
    const setupCards = () => {
      // Find all cards in the DOM
      const cards = document.querySelectorAll('[data-card-id], .kanban-card, .card');
      console.log('Found cards for keyboard navigation:', cards.length);
      
      cards.forEach((card, index) => {
        // Ensure card has proper data attributes
        if (!card.dataset.cardId) {
          card.setAttribute('data-card-id', `card-${index}`);
        }
        card.setAttribute('tabindex', '0');
        
        // Add click handler for selection
        const handleCardClick = (e) => {
          // Don't select if clicking on interactive elements
          if (e.target.closest('button, input, textarea, select')) {
            return;
          }
          
          // Remove selection from other cards
          document.querySelectorAll('[data-card-id], .kanban-card, .card').forEach(c => c.classList.remove('selected'));
          // Add selection to clicked card
          card.classList.add('selected');
          console.log('Card selected:', card.dataset.cardId);
        };
        
        // Remove existing listener to prevent duplicates
        card.removeEventListener('click', handleCardClick);
        card.addEventListener('click', handleCardClick);
      });
    };

    // Initial setup
    setupCards();

    // Set up polling to handle dynamic content
    cardSetupInterval.current = setInterval(setupCards, 2000); // Check every 2 seconds

    return () => {
      if (cardSetupInterval.current) {
        clearInterval(cardSetupInterval.current);
      }
    };
  }, [cards]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;
