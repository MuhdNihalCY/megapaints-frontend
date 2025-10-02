/**
 * CommentsSection Component
 * Handles comments with @mentions functionality
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Edit3, 
  Trash2, 
  AtSign,
  User,
  Clock
} from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';

const CommentsSection = ({ card, onCommentAdd, onCommentUpdate, onCommentDelete }) => {
  const { users, addComment } = useKanban();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const textareaRef = useRef(null);
  const mentionRef = useRef(null);

  // Filter users for mentions
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle text change with mention detection
  const handleTextChange = (e) => {
    const text = e.target.value;
    setNewComment(text);

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(cursorPos);
    } else {
      setShowMentions(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (user) => {
    const textBeforeMention = newComment.substring(0, mentionPosition - mentionQuery.length - 1);
    const textAfterMention = newComment.substring(mentionPosition);
    const mentionText = `@${user.name || user.email}`;
    
    const newText = textBeforeMention + mentionText + ' ' + textAfterMention;
    setNewComment(newText);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = textBeforeMention.length + mentionText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const commentData = {
        text: newComment.trim(),
        mentions: extractMentions(newComment),
        createdAt: new Date().toISOString()
      };

      await addComment(card.id, commentData);
      setNewComment('');
      setShowMentions(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedUser = users.find(user => 
        user.name === match[1] || user.email === match[1]
      );
      if (mentionedUser) {
        mentions.push({
          userId: mentionedUser.id,
          userName: mentionedUser.name || mentionedUser.email,
          position: match.index
        });
      }
    }
    
    return mentions;
  };

  // Handle comment edit
  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  // Handle comment update
  const handleUpdateComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await onCommentUpdate(commentId, {
        text: editText.trim(),
        mentions: extractMentions(editText),
        updatedAt: new Date().toISOString()
      });
      
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await onCommentDelete(commentId);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  // Render text with mentions highlighted
  const renderTextWithMentions = (text, mentions = []) => {
    if (!mentions.length) return text;

    let result = text;
    mentions.forEach((mention, index) => {
      const mentionText = `@${mention.userName}`;
      result = result.replace(
        mentionText,
        `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded">${mentionText}</span>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  // Close mentions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentionRef.current && !mentionRef.current.contains(event.target)) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-4">
        {card?.comments?.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {comment.author?.name || comment.author?.email || 'Unknown User'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(comment.createdAt).toLocaleString()}
                    {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                      <span>(edited)</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditComment(comment)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500 dark:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateComment(comment.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditText('');
                    }}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {renderTextWithMentions(comment.text, comment.mentions)}
              </div>
            )}

            {/* Show mentions */}
            {comment.mentions && comment.mentions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {comment.mentions.map((mention, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    <AtSign className="w-3 h-3" />
                    {mention.userName}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Comment Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextChange}
              placeholder="Add a comment... Use @ to mention someone"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            
            {/* Mentions Dropdown */}
            <AnimatePresence>
              {showMentions && (
                <motion.div
                  ref={mentionRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
                >
                  <div className="p-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Mention someone:
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleMentionSelect(user)}
                          className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{user.name || user.email}</div>
                              {user.name && user.email && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                          No users found
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </div>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentsSection;
