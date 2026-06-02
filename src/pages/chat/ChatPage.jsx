import { useState, useEffect, useRef } from 'react';
import { chatApi, usersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function ChatPage() {
  const { user: me } = useAuth();
  const { toast } = useApp();
  
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      const [rConv, rUsers] = await Promise.all([
        chatApi.conversations(),
        usersApi.list()
      ]);
      setConversations(rConv.data);
      setUsers(rUsers.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { loadConversations(); }, []);

  const loadMessages = async (chatId) => {
    try {
      const r = await chatApi.messages(chatId, { limit: 100 });
      setMessages(r.data.data ? r.data.data.reverse() : r.data.reverse()); // Assume backend returns { data: [] } or just []
      chatApi.markRead(chatId).catch(() => {});
    } catch (e) {
      toast('Failed to load messages');
    }
  };

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      // Optional: Set up polling here if no WebSocket
      const interval = setInterval(() => loadMessages(activeChat.id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const content = newMessage;
    setNewMessage('');
    
    // Optimistic UI update
    const tempMsg = {
      _id: Date.now().toString(),
      chatId: activeChat.id,
      fromId: me._id,
      fromName: me.name,
      content,
      type: 'text',
      ts: new Date()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await chatApi.send({
        chatId: activeChat.id,
        toId: activeChat.isGroup ? null : activeChat.otherUserId,
        groupId: activeChat.isGroup ? activeChat.id : null,
        type: 'text',
        content
      });
      loadMessages(activeChat.id);
    } catch (err) {
      toast('Failed to send message');
    }
  };

  const startNewChat = (otherUser) => {
    const chatId = [me._id, otherUser._id].sort().join('_');
    setActiveChat({
      id: chatId,
      name: otherUser.name,
      otherUserId: otherUser._id,
      isGroup: false
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Left Pane - Conversations */}
      <div style={{ width: 300, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
          Messages
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length > 0 && <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--mu)', background: 'var(--bgt)' }}>RECENT CHATS</div>}
          {conversations.map(c => (
            <div 
              key={c.id} 
              onClick={() => setActiveChat(c)}
              style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--border)', 
                cursor: 'pointer',
                background: activeChat?.id === c.id ? 'rgba(var(--p-rgb), 0.1)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {c.name?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--mu)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {c.lastMessage || 'No messages yet'}
                </div>
              </div>
              {c.unread > 0 && (
                <div style={{ background: 'var(--p)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                  {c.unread}
                </div>
              )}
            </div>
          ))}

          <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--mu)', background: 'var(--bgt)', marginTop: 10 }}>ALL USERS</div>
          {users.filter(u => u._id !== me._id).map(u => (
            <div 
              key={u._id} 
              onClick={() => startNewChat(u)}
              style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                {u.name.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: 13 }}>{u.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {activeChat.name?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              {activeChat.name}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--mu)', fontSize: 14 }}>Send a message to start chatting</div>
              ) : (
                messages.map(m => {
                  const isMe = m.fromId === me._id;
                  return (
                    <div key={m._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '10px 14px', 
                        borderRadius: 16, 
                        borderBottomRightRadius: isMe ? 4 : 16,
                        borderBottomLeftRadius: !isMe ? 4 : 16,
                        background: isMe ? 'var(--p)' : 'var(--bgt)',
                        color: isMe ? '#fff' : 'inherit',
                        fontSize: 14
                      }}>
                        {!isMe && activeChat.isGroup && <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: 'var(--p)' }}>{m.fromName}</div>}
                        {m.content}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 4 }}>
                        {new Date(m.ts || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                style={{ flex: 1, padding: '12px 16px', borderRadius: 20, border: '1px solid var(--border)', outline: 'none' }}
              />
              <button type="submit" className="btn btn-p" style={{ borderRadius: 20, padding: '0 24px' }}>Send</button>
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', color: 'var(--mu)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            Select a conversation or user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
