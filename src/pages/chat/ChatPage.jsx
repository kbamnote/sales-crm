import { useState, useEffect, useMemo, useRef } from 'react';
import { chatApi, usersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

// 1:1 chat ids are "idA_idB" (sorted); group ids are Mongo ObjectIds (no "_").
const isGroupId = (id) => !String(id).includes('_');
const makeChatId = (a, b) => [String(a), String(b)].sort().join('_');

const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
const fmtConvTime = (t) => {
  if (!t) return '';
  const d = new Date(t);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};
// Message type previews for the conversation list (mirrors the app).
const msgPreview = (m) =>
  m?.type === 'image' ? '📷 Photo'
    : m?.type === 'voice' ? '🎤 Voice note'
    : (m?.content || 'No messages yet');

export default function ChatPage() {
  const { user: me } = useAuth();
  const { toast } = useApp();
  const myId = String(me?._id || '');

  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // userId -> user map, for resolving the other party's name/avatar in 1:1 chats.
  const usersMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => { map[String(u._id)] = u; });
    return map;
  }, [users]);

  const loadConversations = async () => {
    try {
      const [rConv, rUsers] = await Promise.all([
        chatApi.conversations(),
        usersApi.contacts().catch(() => ({ data: [] })),
      ]);
      setConversations(rConv.data || []);
      setUsers(rUsers.data || []);
    } catch {
      // conversation list is not critical — keep whatever we have
    }
  };

  useEffect(() => {
    loadConversations();
    // Keep unread counts / last-message previews fresh without sockets.
    const t = setInterval(loadConversations, 15000);
    return () => clearInterval(t);
  }, []);

  const loadMessages = async (chatId) => {
    if (!chatId) return;
    try {
      const r = await chatApi.messages(chatId, { limit: 100 });
      // Backend returns { messages: [...], roster } (already chronological);
      // older plain-array responses are handled for backward compatibility.
      const data = r.data || {};
      setMessages(Array.isArray(data) ? data : (data.messages || []));
      chatApi.markRead(chatId).catch(() => {});
    } catch (e) {
      toast('Failed to load messages');
    }
  };

  useEffect(() => {
    if (!activeChat) return;
    loadMessages(activeChat.id);
    // Poll for new messages (web equivalent of the app's socket listener).
    const interval = setInterval(() => loadMessages(activeChat.id), 5000);
    return () => clearInterval(interval);
  }, [activeChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Conversations arrive as { _id: chatId, last: <message>, unread }. Map them to
  // what the UI needs (display name, other party id, group flag, preview text).
  const convList = useMemo(() => (conversations || []).map((c) => {
    const chatId = String(c._id);
    const isGroup = isGroupId(chatId);
    const otherId = isGroup ? null : chatId.split('_').find((id) => id !== myId);
    const name = isGroup
      ? (c.last?.groupName || 'Group')
      : (usersMap[otherId]?.name || c.last?.fromName || 'Chat');
    return {
      id: chatId,
      name,
      otherUserId: otherId,
      isGroup,
      lastMessage: msgPreview(c.last),
      lastAt: c.last?.createdAt,
      unread: c.unread || 0,
    };
  }), [conversations, usersMap, myId]);

  const openChat = (c) => {
    setActiveChat(c);
    setMessages([]);
  };

  const startNewChat = (otherUser) => {
    openChat({
      id: makeChatId(myId, otherUser._id),
      name: otherUser.name,
      otherUserId: otherUser._id,
      isGroup: false,
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || sending) return;
    const content = newMessage;
    setNewMessage('');
    setSending(true);

    // Optimistic bubble, matching the app's instant local echo.
    const tempMsg = {
      _id: 'temp-' + Date.now(),
      chatId: activeChat.id,
      fromId: myId,
      fromName: me?.name,
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      // Backend derives the 1:1 chatId from (me, toId) — same id we opened with.
      const payload = activeChat.isGroup
        ? { groupId: activeChat.id, content }
        : { toId: activeChat.otherUserId, content };
      await chatApi.send(payload);
      await loadMessages(activeChat.id); // replaces optimistic bubble with the server copy
      loadConversations();
    } catch (err) {
      // Mark the optimistic bubble as failed so the user can resend.
      setMessages(prev => prev.map(m => (m._id === tempMsg._id ? { ...m, failed: true } : m)));
      toast('Failed to send message');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u => String(u._id) !== myId);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Left Pane - Conversations */}
      <div style={{ width: 300, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
          Messages
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convList.length > 0 && <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--mu)', background: 'var(--bgt)' }}>RECENT CHATS</div>}
          {convList.map(c => (
            <div
              key={c.id}
              onClick={() => openChat(c)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: activeChat?.id === c.id ? 'rgba(var(--p-rgb), 0.1)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.isGroup ? '#8B5CF6' : 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                {c.isGroup ? '👥' : (c.name?.substring(0, 2).toUpperCase() || 'U')}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', flex: 1 }}>{c.name}</div>
                  {c.lastAt && <div style={{ fontSize: 10, color: 'var(--mu)', flexShrink: 0 }}>{fmtConvTime(c.lastAt)}</div>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mu)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {c.lastMessage}
                </div>
              </div>
              {c.unread > 0 && (
                <div style={{ background: 'var(--p)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10, flexShrink: 0 }}>
                  {c.unread}
                </div>
              )}
            </div>
          ))}

          <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--mu)', background: 'var(--bgt)', marginTop: 10 }}>ALL USERS</div>
          {filteredUsers.map(u => (
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
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: activeChat.isGroup ? '#8B5CF6' : 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {activeChat.isGroup ? '👥' : (activeChat.name?.substring(0, 2).toUpperCase() || 'U')}
              </div>
              {activeChat.name}
              {activeChat.isGroup && <span style={{ fontSize: 11, color: 'var(--mu)' }}>Group</span>}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--mu)', fontSize: 14 }}>Send a message to start chatting</div>
              ) : (
                messages.map(m => {
                  const isMe = String(m.fromId || m.sender?._id || '') === myId;
                  return (
                    <div key={m._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && activeChat.isGroup && (
                        <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: 'var(--p)', marginLeft: 4 }}>{m.fromName || 'Unknown'}</div>
                      )}
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: 16,
                        borderBottomRightRadius: isMe ? 4 : 16,
                        borderBottomLeftRadius: !isMe ? 4 : 16,
                        background: isMe ? 'var(--p)' : 'var(--bgt)',
                        color: isMe ? '#fff' : 'inherit',
                        fontSize: 14,
                        opacity: m.pending ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {m.content}
                        <span style={{ fontSize: 10, opacity: 0.8, whiteSpace: 'nowrap' }}>
                          {m.failed ? '⚠️' : m.pending ? '🕐' : '✓✓'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 4 }}>
                        {fmtTime(m.createdAt || m.ts)}
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
              <button type="submit" className="btn btn-p" style={{ borderRadius: 20, padding: '0 24px' }} disabled={sending || !newMessage.trim()}>
                Send
              </button>
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
