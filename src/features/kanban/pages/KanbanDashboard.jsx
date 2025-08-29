/**
 * Kanban Dashboard Page
 * Main dashboard page for non-admin users with Kanban board
 */

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { useAuth } from '../../../contexts/AuthContext';
import { KanbanProvider } from '../contexts/KanbanContext';
import KanbanBoard from '../components/KanbanBoard';
import CardModal from '../components/CardModal';
import Header from '../../user/components/Header';
import AuthGuard from '../components/AuthGuard';
import DebugAuth from '../../../components/DebugAuth';

/**
 * Kanban Dashboard Page Component
 */
const KanbanDashboard = () => {
  const { user } = useAuth();
  const [modalState, setModalState] = useState({
    isOpen: false,
    card: null,
    mode: 'view'
  });

  // Set page title
  useEffect(() => {
    document.title = 'Kanban Board - Megapaints';
  }, []);

  const handleCloseModal = () => {
    setModalState({ isOpen: false, card: null, mode: 'view' });
  };

  const handleCardClick = (card) => {
    setModalState({ isOpen: true, card, mode: 'view' });
  };

  const handleCreateCard = (columnId, subcolumnId) => {
    setModalState({ isOpen: true, card: null, mode: 'create' });
  };

  const handleEditCard = (card) => {
    setModalState({ isOpen: true, card, mode: 'edit' });
  };

  // Listen for edit card events from keyboard shortcuts
  useEffect(() => {
    const handleEditCardEvent = (event) => {
      handleEditCard(event.detail.card);
    };

    document.addEventListener('editCard', handleEditCardEvent);
    return () => {
      document.removeEventListener('editCard', handleEditCardEvent);
    };
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <Header />
        
        {/* Debug Auth Info - Development Only */}
        {process.env.NODE_ENV === 'development' && <DebugAuth />}
        
        {/* Main Content */}
        <div className="flex-1 h-[calc(100vh-64px)]">
          <KanbanProvider>
            <KanbanBoard onCardClick={handleCardClick} onCreateCard={handleCreateCard} />
            <CardModal 
              isOpen={modalState.isOpen}
              card={modalState.card}
              mode={modalState.mode}
              onClose={handleCloseModal}
            />
          </KanbanProvider>
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthGuard>
  );
};

export default KanbanDashboard;

