import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI class assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [enrolledClassIds, setEnrolledClassIds] = useState([]);

    const messagesEndRef = useRef(null);
    const location = useLocation();

    const { token, user } = useAuth();
    const id = localStorage.getItem('id'); // Alternatively `user?.id` depending on AuthContext

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Fetch user's enrolled/teaching classes to use as baseline context
    useEffect(() => {
        const fetchClasses = async () => {
            if (!user || !id || !token) return;
            try {
                const rolePath = user.role === 'TEACHER' ? 'teacher' : 'student';
                const response = await axios.get(`http://localhost:8080/api/classes/${rolePath}/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && Array.isArray(response.data)) {
                    setEnrolledClassIds(response.data.map(cls => cls.id));
                }
            } catch (err) {
                console.error('Error fetching classes for chatbot context:', err);
            }
        };

        if (isOpen && enrolledClassIds.length === 0) {
            fetchClasses();
        }
    }, [user, id, token, isOpen, enrolledClassIds.length]);

    // Helper to extract classId from URL if present
    const getClassIdFromUrl = () => {
        const pathParts = location.pathname.split('/');
        const classIndex = pathParts.indexOf('class');
        if (classIndex !== -1 && pathParts.length > classIndex + 1) {
            // Check if it's a valid ID (not 'create', etc.)
            const possibleId = pathParts[classIndex + 1];
            if (possibleId !== 'create' && possibleId !== 'join') {
                return possibleId;
            }
        }
        return null;
    };

    const currentClassId = getClassIdFromUrl();

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare context
            // If we are in a specific class page, restrict specifically to that class.
            // Otherwise, restrict to ALL classes the user is enrolled in.
            const allowedClassIds = currentClassId
                ? [currentClassId]
                : enrolledClassIds;

            const payload = {
                query: userMessage.content,
                allowedClassIds: allowedClassIds
            };

            const response = await axios.post('http://localhost:8080/api/ai/chat', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const aiMessage = { role: 'assistant', content: response.data };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to the AI service." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-10 duration-200">
                    {/* Header */}
                    <div className="bg-primary-600 p-4 text-white flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <div>
                                <h3 className="font-semibold text-sm">LearnSphere AI</h3>
                                {currentClassId && <span className="text-xs text-primary-100 block">Context: Class Context Active</span>}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your assignments..."
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                >
                    <MessageSquare className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                </button>
            )}
        </div>
    );
};

export default ChatBot;
