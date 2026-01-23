import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

// Mock data
const conversations = [
  {
    id: 1,
    name: 'John Builder',
    avatar: null,
    lastMessage: 'Sounds good, I\'ll review the estimate this afternoon.',
    timestamp: '10m ago',
    unread: 2,
    type: 'builder'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    avatar: null,
    lastMessage: 'When can you schedule the walkthrough?',
    timestamp: '1h ago',
    unread: 0,
    type: 'homeowner'
  },
  {
    id: 3,
    name: 'Mike Williams',
    avatar: null,
    lastMessage: 'Thanks for the quick turnaround on the quote!',
    timestamp: '3h ago',
    unread: 1,
    type: 'builder'
  },
  {
    id: 4,
    name: 'Emily Davis',
    avatar: null,
    lastMessage: 'Can you send me the updated blueprint?',
    timestamp: '1d ago',
    unread: 0,
    type: 'homeowner'
  }
];

const messages = [
  {
    id: 1,
    sender: 'them',
    text: 'Hi! I received the estimate for Westlake Apartments. Can we discuss the fixture pricing?',
    timestamp: '2:30 PM'
  },
  {
    id: 2,
    sender: 'me',
    text: 'Of course! The pricing is based on DFW market rates. Which fixtures would you like to discuss?',
    timestamp: '2:32 PM'
  },
  {
    id: 3,
    sender: 'them',
    text: 'The water heaters seem a bit high. Can you break down that cost?',
    timestamp: '2:35 PM'
  },
  {
    id: 4,
    sender: 'me',
    text: 'Sure! That includes 50-gallon units at $450 each plus installation. We can look at alternative models if needed.',
    timestamp: '2:37 PM'
  },
  {
    id: 5,
    sender: 'them',
    text: 'Sounds good, I\'ll review the estimate this afternoon.',
    timestamp: '2:40 PM'
  }
];

const quickReplies = [
  'Thanks for reaching out!',
  'I\'ll send that over shortly.',
  'When works best for you?',
  'Let me check and get back to you.'
];

export default function Messages() {
  const [activeConversation, setActiveConversation] = useState(1);
  const [messageInput, setMessageInput] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'builders' | 'homeowners'>('all');

  const filteredConversations = conversations.filter((conv) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return conv.unread > 0;
    if (filterType === 'builders') return conv.type === 'builder';
    if (filterType === 'homeowners') return conv.type === 'homeowner';
    return true;
  });

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Handle message send
      setMessageInput('');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn lg:space-y-0">
      <div className="lg:hidden mb-4">
        <h1 className="text-2xl font-bold text-slate-100">Messages</h1>
        <p className="text-slate-400 mt-1">Chat with builders and homeowners</p>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:h-[calc(100vh-8rem)]">
        {/* Conversation List - Mobile: Full screen, Desktop: Sidebar */}
        <div className={`lg:col-span-4 ${activeConversation ? 'hidden lg:block' : 'block'}`}>
          <Card className="h-full flex flex-col">
            {/* Search & Filters */}
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-slate-100">Messages</h1>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {(['all', 'unread', 'builders', 'homeowners'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      filterType === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <EmptyState
                  icon={<ChatBubbleLeftRightIcon className="w-12 h-12" />}
                  title="No messages"
                  description="No conversations match your filter"
                />
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className={`w-full p-4 text-left transition-colors ${
                        activeConversation === conv.id
                          ? 'bg-slate-800'
                          : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <Avatar fallback={conv.name.substring(0, 2)} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-medium text-slate-100 truncate">{conv.name}</h3>
                            {conv.unread > 0 && (
                              <Badge variant="blue" className="ml-2 flex-shrink-0">
                                {conv.unread}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate">{conv.lastMessage}</p>
                          <p className="text-xs text-slate-500 mt-1">{conv.timestamp}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Chat View - Mobile: Full screen when active, Desktop: Main area */}
        <div className={`lg:col-span-8 ${activeConversation ? 'block' : 'hidden lg:block'}`}>
          <Card className="h-full flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(0)}
                    className="lg:hidden text-slate-400 hover:text-slate-100"
                  >
                    ← Back
                  </button>
                  <Avatar fallback="JB" size="md" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-100">John Builder</h3>
                    <p className="text-xs text-slate-400">ABC Construction</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-md rounded-lg p-3 ${
                          message.sender === 'me'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === 'me' ? 'text-blue-200' : 'text-slate-500'
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Replies */}
                <div className="px-4 py-2 border-t border-slate-800">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => setMessageInput(reply)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full whitespace-nowrap transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-800">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <PaperClipIcon className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<ChatBubbleLeftRightIcon className="w-16 h-16" />}
                title="No conversation selected"
                description="Select a conversation from the list to start chatting"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
