/**
 * TrelloAttachments Component
 * Complete Trello-style attachments system
 * - Upload from computer
 * - Add from link
 * - Drag-and-drop support
 * - Image preview
 * - Make cover
 * - Download/delete actions
 */

import React, { useState, useRef } from 'react';
import { Paperclip, Upload, Link as LinkIcon, X, Download, Image as ImageIcon, File, Trash2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Image thumbnail component with error handling
const ImageThumbnail = ({ attachment }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (imageError) {
    // Fallback to file icon if image fails to load
    return (
      <div 
        className="w-20 h-14 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer"
        onClick={() => window.open(attachment.url, '_blank')}
        title={attachment.name}
      >
        <File className="w-6 h-6 text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className="w-20 h-14 rounded bg-gray-200 dark:bg-gray-700 cursor-pointer overflow-hidden relative"
      onClick={() => window.open(attachment.url, '_blank')}
      title={attachment.name}
    >
      <img
        src={attachment.url}
        alt={attachment.name}
        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.warn('Image failed to load:', attachment.url, e);
          setImageError(true);
        }}
        crossOrigin="anonymous"
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const TrelloAttachments = ({ attachments = [], onAdd, onDelete, onMakeCover }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const fileInputRef = useRef(null);
  
  // Handle file upload from computer
  const handleFileUpload = (files) => {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: e.target.result, // DataURL for preview
          type: file.type.startsWith('image/') ? 'image' : 'file',
          size: file.size,
          dateAdded: new Date().toISOString(),
          mimeType: file.type,
          isUploadedToCard: true,
          file: file // Add the actual File object for upload
        };
        
        onAdd(attachment);
      };
      
      reader.readAsDataURL(file);
    });
    
    setShowAddMenu(false);
  };
  
  // Handle link attachment
  const handleAddLink = () => {
    if (linkUrl.trim()) {
      const attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: linkName.trim() || linkUrl,
        url: linkUrl.trim(),
        type: 'link',
        size: 0,
        dateAdded: new Date().toISOString(),
        mimeType: 'text/html',
        isUploadedToCard: false
      };
      
      onAdd(attachment);
      setLinkUrl('');
      setLinkName('');
      setShowLinkInput(false);
      setShowAddMenu(false);
    }
  };
  
  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="mb-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Attachments</h3>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Add
          </button>
          
          {showAddMenu && (
            <div className="absolute right-0 top-8 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
              <div className="p-2">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Computer</span>
                </button>
                <button
                  onClick={() => {
                    setShowLinkInput(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm">Link</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      
      {/* Link Input Form */}
      <AnimatePresence>
        {showLinkInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/file.pdf"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="My Document"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl('');
                    setLinkName('');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Drag-and-drop zone indicator */}
      {isDragging && (
        <div className="mb-4 p-8 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
          <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Drop files here</p>
        </div>
      )}
      
      {/* Attachments List */}
      <div className="space-y-3">
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No attachments yet</p>
            <p className="text-xs mt-1">Drop files here or click Add button</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
            >
              {/* Thumbnail/Icon */}
              <div className="flex-shrink-0">
                {attachment.type === 'image' ? (
                  <ImageThumbnail attachment={attachment} />
                ) : (
                  <div className="w-20 h-14 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <File className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {attachment.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {attachment.size > 0 && (
                    <span>{formatFileSize(attachment.size)}</span>
                  )}
                  {attachment.type === 'link' && (
                    <>
                      {attachment.size > 0 && <span>•</span>}
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open link
                      </a>
                    </>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {attachment.type === 'image' && onMakeCover && (
                  <button
                    onClick={() => onMakeCover(attachment)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Make cover"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => onDelete(attachment.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrelloAttachments;

