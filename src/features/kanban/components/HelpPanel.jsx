/**
 * Help Panel Component
 * Displays keyboard shortcuts and help information
 */

import { useState } from 'react';
import { X, Keyboard, HelpCircle, Info } from 'lucide-react';

/**
 * Help Panel Component
 */
const HelpPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Ctrl/Cmd + K', description: 'Quick search' },
    { key: 'Ctrl/Cmd + N', description: 'Create new card in Sales column' },
    { key: 'Escape', description: 'Close modals and dropdowns' },
    { key: 'Arrow Keys', description: 'Navigate between cards' },
    { key: 'Enter', description: 'Open selected card' },
    { key: 'Delete/Backspace', description: 'Delete selected card' },
    { key: '1-4', description: 'Set priority (Low, Medium, High, Urgent)' },
    { key: 'F', description: 'Toggle filters panel' },
    { key: 'H', description: 'Toggle this help panel' },
  ];

  const features = [
    { title: 'Inline Card Creation', description: 'Click "Add card" to create cards directly in columns' },
    { title: 'Drag & Drop', description: 'Drag cards between columns to move them' },
    { title: 'Quick Actions', description: 'Hover over cards to see quick action buttons' },
    { title: 'Priority Indicators', description: 'Cards show priority levels with color coding' },
    { title: 'Due Date Tracking', description: 'Cards with due dates show status indicators' },
    { title: 'Labels & Assignees', description: 'Add labels and assign team members to cards' },
    { title: 'Comments & Attachments', description: 'Add comments and attachments to cards' },
    { title: 'Filtering', description: 'Filter cards by priority, labels, assignees, and due dates' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors z-50"
        title="Keyboard shortcuts and help"
      >
        <HelpCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Keyboard className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts & Help
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Keyboard size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Keyboard Shortcuts</span>
              </h3>
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Info size={18} className="text-green-600 dark:text-green-400" />
                <span>Features</span>
              </h3>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Pro Tips
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use keyboard shortcuts to navigate quickly between cards</li>
              <li>• Drag cards between columns to update their status</li>
              <li>• Add labels and assignees during card creation for better organization</li>
              <li>• Use filters to focus on specific types of work</li>
              <li>• Set due dates to track deadlines and get visual reminders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
