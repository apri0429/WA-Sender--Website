import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BASE_URL = "";
let _socket = null;

function getSocket() {
  if (!_socket) {
    _socket = io(BASE_URL, { transports: ["websocket", "polling"] });
  }
  return _socket;
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function formatTimeFull(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ name, size = 40 }) {
  const initials = name
    ? name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
    : "?";
  const colors = ["#1f4e8c", "#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function ChatListItem({ chat, active, onClick }) {
  const last = chat.lastMessage;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left",
        background: active ? "rgba(31,78,140,0.09)" : "transparent",
        borderLeft: active ? "3px solid #1f4e8c" : "3px solid transparent",
        transition: "background 0.15s",
      }}
    >
      <Avatar name={chat.name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {chat.name || chat.phone}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, marginLeft: 6 }}>
            {formatTime(last?.timestamp)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
          <span style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {last ? (last.from === "me" ? "Anda: " : "") + (last.body || "📎 Media") : "Belum ada pesan"}
          </span>
          {chat.unread > 0 && (
            <span style={{
              background: "#25d366", color: "#fff", borderRadius: 10, fontSize: 11,
              fontWeight: 700, padding: "1px 6px", marginLeft: 6, flexShrink: 0,
            }}>
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg }) {
  const isMe = msg.from === "me";
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 4 }}>
      <div style={{
        maxWidth: "72%", padding: "8px 12px", borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: isMe ? "#1f4e8c" : "#fff",
        color: isMe ? "#fff" : "#1e293b",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        fontSize: 13.5, lineHeight: 1.5,
        wordBreak: "break-word",
      }}>
        <div>{msg.body || <em style={{ opacity: 0.6 }}>📎 Media</em>}</div>
        <div style={{ fontSize: 10.5, marginTop: 3, opacity: 0.7, textAlign: "right" }}>
          {formatTimeFull(msg.timestamp)}
          {isMe && <span style={{ marginLeft: 4 }}>✓</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const loadChats = () => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((d) => { if (d.success) setChats(d.chats); })
      .catch(() => {});
  };

  useEffect(() => {
    loadChats();

    const socket = getSocket();

    socket.on("chat:new-message", ({ chatId, name, phone, message }) => {
      // Refresh chat list supaya urutan & unread count update dari WA
      loadChats();
      // Kalau chat yang aktif dapat pesan baru, tambah ke messages
      setMessages((prev) => {
        if (activeChatId === chatId) return [...prev, message];
        return prev;
      });
    });

    return () => {
      socket.off("chat:new-message");
    };
  }, [activeChatId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const openChat = async (chatId) => {
    setActiveChatId(chatId);
    setMessages([]);
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, unread: 0 } : c));
    try {
      const r = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`);
      const d = await r.json();
      if (d.success) setMessages(d.messages);
    } catch {}
    inputRef.current?.focus();
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeChatId || sending) return;
    setSending(true);
    try {
      await fetch(`/api/chats/${encodeURIComponent(activeChatId)}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      setReply("");
    } catch {}
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const filtered = chats.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", minHeight: 400, overflow: "hidden" }}>
      {/* Left panel - Chat list */}
      <div style={{
        width: 300, flexShrink: 0, borderRight: "1px solid rgba(226,232,240,0.9)",
        display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(226,232,240,0.9)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 8 }}>Pesan Masuk</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kontak..."
            style={{
              width: "100%", padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
              fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              {chats.length === 0 ? "Belum ada pesan masuk" : "Tidak ditemukan"}
            </div>
          )}
          {filtered.map((c) => (
            <ChatListItem
              key={c.id}
              chat={c}
              active={c.id === activeChatId}
              onClick={() => openChat(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Right panel - Messages */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "rgba(248,250,252,0.7)" }}>
        {!activeChatId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#94a3b8" }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <div style={{ fontSize: 14 }}>Pilih percakapan untuk mulai</div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: "10px 18px", borderBottom: "1px solid rgba(226,232,240,0.9)",
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)",
            }}>
              <Avatar name={activeChat?.name} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{activeChat?.name || activeChat?.phone}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{activeChat?.phone}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column" }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 32 }}>
                  Belum ada pesan dalam sesi ini
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            <div style={{
              padding: "10px 14px", borderTop: "1px solid rgba(226,232,240,0.9)",
              display: "flex", gap: 8, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)",
            }}>
              <textarea
                ref={inputRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan... (Enter untuk kirim)"
                rows={1}
                style={{
                  flex: 1, resize: "none", border: "1px solid #e2e8f0", borderRadius: 20,
                  padding: "9px 16px", fontSize: 13.5, outline: "none", background: "#f8fafc",
                  fontFamily: "inherit", lineHeight: 1.5,
                }}
              />
              <button
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                style={{
                  background: reply.trim() && !sending ? "#1f4e8c" : "#e2e8f0",
                  color: reply.trim() && !sending ? "#fff" : "#94a3b8",
                  border: "none", borderRadius: "50%", width: 40, height: 40,
                  cursor: reply.trim() && !sending ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s", flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
