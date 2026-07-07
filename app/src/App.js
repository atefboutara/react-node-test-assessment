import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import Pusher from 'pusher-js';
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);
  
  useEffect(() => {
    const pusherKey = process.env.REACT_APP_PUSHER_KEY;
    const pusherCluster = process.env.REACT_APP_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher is not configured. Realtime updates are disabled.');
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe('messages');

    const handleNewMessage = (newMessage) => {
      setMessages((previousMessages) => {
        const alreadyExists = previousMessages.some(
          (message) => message.id === newMessage.id
        );

        if (alreadyExists) {
          return previousMessages;
        }

        return [...previousMessages, newMessage];
      });
    };

    const handleDeletedMessage = (deletedMessage) => { 
      setMessages((previousMessages) =>
        previousMessages.filter(
          (message) => message.id !== deletedMessage.id
        )
      );
      setSearchResults((previousResults) => // in case we receive a delete event while searching, we also remove it from the search results
        previousResults.filter(
          (message) => message.id !== deletedMessage.id
        )
      );
    };

    channel.bind('new-message', handleNewMessage);
    channel.bind('message-deleted', handleDeletedMessage);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      channel.unbind('message-deleted', handleDeletedMessage);
      pusher.unsubscribe('messages');
      pusher.disconnect();
    };
  }, []);
  // Added a small debounced useeffect that waits until you stop typing for 300ms before sending the request
  useEffect(() => {
    const trimmedQuery = searchTerm.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController(); // AbortController to cancel the request if the user types again before the request completes
    const timeoutId = setTimeout(async () => { // Debounce the search request
      try {
        setSearchLoading(true);
        setSearchError('');

        const response = await axios.get( // the request itself
          `${API_BASE_URL}/api/messages/search`,
          {
            params: {
              q: trimmedQuery,
            },
            signal: controller.signal,
          }
        );

        setSearchResults(response.data.messages || []); // we set the results to the state
      } catch (err) {
        if (err.code === 'ERR_CANCELED') {
          return;
        }

        console.error('Error searching messages:', err);
        setSearchError(
          err.response?.data?.error || 'Failed to search messages'
        );
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false); // we only set loading to false if the request was not aborted
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm]);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/messages`);
      setMessages(response.data.messages || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!messageText.trim() && !selectedImage) {
      setError('Please enter a message or select an image');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let createdMessage = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('username', username.trim());
        formData.append('message', messageText.trim());
        formData.append('image', selectedImage);

        const response = await axios.post(`${API_BASE_URL}/api/messages/with-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        createdMessage = response.data?.message;
        removeImage();
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/messages`, {
          username: username.trim(),
          message: messageText.trim(),
        });
        createdMessage = response.data?.message;
      }

      setMessageText('');

      // Refresh messages to show the new one
      if (createdMessage) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === createdMessage.id)) {
            return prev;
          }
          return [...prev, createdMessage];
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/messages/${messageId}`);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setSearchResults((prev) => // in case I want to delete a message while searching, we also remove it from the search results
        prev.filter((msg) => msg.id !== messageId)
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete message');
      console.error('Error deleting message:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSearching = searchTerm.trim().length > 0;

  const displayedMessages = isSearching
    ? searchResults
    : messages;

  const renderMessages = () => { //Function to render messages based on search state and loading/error states
    if (isSearching) {
      if (searchLoading) {
        return <div className="loading">Searching...</div>;
      }

      if (searchError) {
        return <div className="error-message">{searchError}</div>;
      }

      if (displayedMessages.length === 0) {
        return (
          <div className="no-messages">
            No messages match your search.
          </div>
        );
      }
    } else {
      if (loading && messages.length === 0) {
        return <div className="loading">Loading messages...</div>;
      }

      if (messages.length === 0) {
        return (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        );
      }
    }

    return displayedMessages.map((msg) => (
      <div key={msg.id} className="message-item">
        <div className="message-header">
          <span className="message-username">{msg.username}</span>
          <span className="message-time">
            {formatTime(msg.created_at)}
          </span>
        </div>

        {msg.image_url && (
          <div className="message-image">
            <img
              src={`${API_BASE_URL}${msg.image_url}`}
              alt="Shared"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {msg.message && (
          <div className="message-text">{msg.message}</div>
        )}

        <button
          className="delete-message-btn"
          onClick={() => handleDeleteMessage(msg.id)}
          title="Delete message"
        >
          ×
        </button>
      </div>
    ));
  };  
  return (
    <div className="App">
      <header className="App-header">
        <h1>💬 Chat App</h1>
        <p>Send messages and share images</p>
      </header>

      <main className="chat-container">
      <div className="search-container">
        {/* Our search input field */}
        <input
          type="search"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
        <div className="chat-messages" id="messages-container">
          {/* New method: Render messages based on search state and loading/error states */}
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="input-group">
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input"
              disabled={loading}
            />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" onClick={removeImage} className="remove-image-btn">
                Remove
              </button>
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="message-input"
              disabled={loading}
            />
            <label className="image-upload-label">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={loading}
                style={{ display: 'none' }}
              />
              📷
            </label>
          </div>

          <button
            type="submit"
            className="send-button"
            disabled={loading || (!messageText.trim() && !selectedImage)}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
