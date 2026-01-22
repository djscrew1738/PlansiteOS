import { useState } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  Star,
  Archive,
  Trash2,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Mock data for conversations
const mockConversations = [
  {
    id: 1,
    name: 'John Smith',
    company: 'Smith Plumbing Co.',
    avatar: null,
    lastMessage: 'Thanks for the estimate! We\'ll review it and get back to you by Friday.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    unread: 2,
    status: 'online',
    starred: true,
    phone: '(555) 123-4567',
    email: 'john@smithplumbing.com',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    company: 'Metro Construction',
    avatar: null,
    lastMessage: 'Can you send me the updated blueprint analysis?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: 0,
    status: 'offline',
    starred: false,
    phone: '(555) 234-5678',
    email: 'sarah@metroconstruction.com',
  },
  {
    id: 3,
    name: 'Mike Davis',
    company: 'Davis & Sons',
    avatar: null,
    lastMessage: 'The materials look good. Let\'s schedule the installation.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unread: 1,
    status: 'away',
    starred: true,
    phone: '(555) 345-6789',
    email: 'mike@davisandsons.com',
  },
  {
    id: 4,
    name: 'Emily Chen',
    company: 'Pacific Builders',
    avatar: null,
    lastMessage: 'Perfect! I\'ve attached the signed contract.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    unread: 0,
    status: 'offline',
    starred: false,
    phone: '(555) 456-7890',
    email: 'emily@pacificbuilders.com',
  },
];

const mockMessages = [
  {
    id: 1,
    sender: 'them',
    text: 'Hi! I received your estimate for the commercial project. The pricing looks reasonable.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'read',
  },
  {
    id: 2,
    sender: 'me',
    text: 'Great to hear! Let me know if you have any questions about the fixture selections or the timeline.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    status: 'read',
  },
  {
    id: 3,
    sender: 'them',
    text: 'Actually, I was wondering if we could swap out some of the standard fixtures for premium ones. What would that add to the total?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    status: 'read',
  },
  {
    id: 4,
    sender: 'me',
    text: 'Of course! For the premium line, we\'re looking at an additional $2,400 for the faucets and $1,800 for the toilets. I can send you a revised estimate.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    status: 'delivered',
  },
  {
    id: 5,
    sender: 'them',
    text: 'Thanks for the estimate! We\'ll review it and get back to you by Friday.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'read',
  },
];

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageText, setMessageText] = useState('');
  const [filterStarred, setFilterStarred] = useState(false);

  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStarred = !filterStarred || conv.starred;
    return matchesSearch && matchesStarred;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    // In a real app, this would send the message to the backend
    setMessageText('');
  };

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 border-b border-teal-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg shadow-teal-500/30">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-sm text-gray-600">
                {mockConversations.filter(c => c.unread > 0).length} unread conversations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)]">
        {/* Conversation List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 bg-gray-50"
              />
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => setFilterStarred(!filterStarred)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterStarred
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Star className={`w-4 h-4 ${filterStarred ? 'fill-current' : ''}`} />
                <span>Starred</span>
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {conv.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(conv.status)} rounded-full border-2 border-white`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 truncate flex items-center">
                        {conv.name}
                        {conv.starred && <Star className="w-3 h-3 ml-1 text-amber-500 fill-current" />}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(conv.timestamp, { addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.company}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedConversation.name}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Building className="w-3 h-3 mr-1" />
                      {selectedConversation.company}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                    <Mail className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender === 'me'
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm sm:text-base">{msg.text}</p>
                      <div className={`flex items-center justify-end space-x-1 mt-1 ${
                        msg.sender === 'me' ? 'text-teal-100' : 'text-gray-400'
                      }`}>
                        <span className="text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender === 'me' && (
                          msg.status === 'read' ? (
                            <CheckCheck className="w-4 h-4" />
                          ) : msg.status === 'delivered' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 input bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-teal-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
