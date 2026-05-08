import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import api from "../services/api";
import socket from "../services/socket";

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";
const MESSAGE_PAGE_SIZE = 50;
const MESSAGE_INITIAL_LIMIT = 100;
const MESSAGE_MAX_LIMIT = 300;

const T = {
  brand: "#233971",
  brandLight: "#eaeff7",
  brandBorder: "#b3c1d8",
  brandDark: "#1c2f5c",
  blue: "#2e5bba",
  blueBg: "#eef2f9",
  green: "#0f766e",
  greenBg: "#ecfdf5",
  ink: "#0c111b",
  ink2: "#1c2433",
  text: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  line: "#e5e7eb",
  surface: "#f9fafb",
  canvas: "#f3f4f6",
  white: "#ffffff",
};

function Panel({ children, sx = {} }) {
  return (
    <Box
      sx={{
        background: T.white,
        borderRadius: "18px",
        border: `1px solid ${T.line}`,
        boxShadow: "0 18px 40px rgba(12,17,27,0.06)",
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

function initialsOf(name = "", fallback = "") {
  const source = String(name || fallback || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "?";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function normalizeChat(chat = {}) {
  const phone = chat.phone || String(chat.id || "").replace("@c.us", "").replace("@g.us", "");
  return {
    id: chat.id || "",
    name: chat.name || phone || "Chat",
    phone,
    isGroup: !!chat.isGroup,
    unread: Number(chat.unread) || 0,
    lastMessage: chat.lastMessage || null,
  };
}

function mergeChatLists(current = [], incoming = []) {
  const map = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    const normalized = normalizeChat(item);
    map.set(normalized.id, { ...map.get(normalized.id), ...normalized });
  });

  return Array.from(map.values()).sort((a, b) => {
    const aTime = Number(a.lastMessage?.timestamp) || 0;
    const bTime = Number(b.lastMessage?.timestamp) || 0;
    return bTime - aTime;
  });
}

function upsertMessage(list = [], nextMessage) {
  if (!nextMessage?.id) return list;
  if (list.find((item) => item.id === nextMessage.id)) return list;
  return [...list, nextMessage].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

export default function ChatInboxPage() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [messageLimit, setMessageLimit] = useState(MESSAGE_INITIAL_LIMIT);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyNote, setHistoryNote] = useState("");
  const [search, setSearch] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const listBottomRef = useRef(null);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  const filteredChats = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return chats;
    return chats.filter((chat) => {
      const haystack = `${chat.name} ${chat.phone}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [chats, search]);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const fetchChats = async ({ preserveSelection = true } = {}) => {
    try {
      setLoadingChats(true);
      setErrorText("");
      const res = await api.get("/chats");
      const incoming = Array.isArray(res?.data?.chats) ? res.data.chats : [];
      const normalizedIncoming = incoming.map(normalizeChat);
      let mergedChats = [];

      setChats((prev) => {
        mergedChats = mergeChatLists(prev, normalizedIncoming);
        return mergedChats;
      });

      setSelectedChatId((prevSelected) => {
        if (!preserveSelection) return mergedChats[0]?.id || "";
        if (prevSelected && mergedChats.some((chat) => chat.id === prevSelected)) return prevSelected;
        return mergedChats[0]?.id || "";
      });
    } catch (error) {
      const message = error?.response?.data?.message || "Gagal memuat inbox WhatsApp";
      setErrorText(message);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (chatId, limit = messageLimit) => {
    if (!chatId) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chats/${encodeURIComponent(chatId)}/messages`, {
        params: { limit },
      });
      const list = Array.isArray(res?.data?.messages) ? res.data.messages : [];
      setMessages(list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
      setHasMoreHistory(!!res?.data?.hasMore && limit < MESSAGE_MAX_LIMIT);
      setHistoryNote(res?.data?.note || "");
      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat))
      );
    } catch (error) {
      showToast(error?.response?.data?.message || "Gagal memuat percakapan", "error");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchChats({ preserveSelection: false });
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId, messageLimit);
    } else {
      setMessages([]);
      setHasMoreHistory(false);
      setHistoryNote("");
    }
  }, [selectedChatId, messageLimit]);

  useEffect(() => {
    listBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const onNewMessage = (payload) => {
      const entry = payload?.message;
      const chatId = payload?.chatId;
      if (!chatId || !entry) return;

      setChats((prev) => {
        const existing = prev.find((chat) => chat.id === chatId);
        const nextChat = {
          ...(existing || {}),
          id: chatId,
          name: payload?.name || existing?.name || payload?.phone || "Chat",
          phone: payload?.phone || existing?.phone || "",
          unread: selectedChatId === chatId ? 0 : Number(payload?.unread) || 0,
          lastMessage: {
            id: entry.id,
            from: entry.from,
            body: entry.body,
            timestamp: entry.timestamp,
            type: entry.type,
          },
        };
        return mergeChatLists(prev, [nextChat]);
      });

      if (selectedChatId === chatId) {
        setMessages((prev) => upsertMessage(prev, entry));
      }
    };

    socket.on("chat:new-message", onNewMessage);
    return () => {
      socket.off("chat:new-message", onNewMessage);
    };
  }, [selectedChatId]);

  const handleSelectChat = (chatId) => {
    setMessageLimit(MESSAGE_INITIAL_LIMIT);
    setSelectedChatId(chatId);
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat))
    );
  };

  const handleLoadOlder = () => {
    setMessageLimit((prev) => Math.min(MESSAGE_MAX_LIMIT, prev + MESSAGE_PAGE_SIZE));
  };

  const handleSend = async () => {
    if (!selectedChatId || !messageText.trim() || sending) return;

    try {
      setSending(true);
      const text = messageText.trim();
      await api.post(`/chats/${encodeURIComponent(selectedChatId)}/reply`, { message: text });
      setMessageText("");
      showToast("Pesan terkirim", "success");
      await fetchMessages(selectedChatId, messageLimit);
      await fetchChats();
    } catch (error) {
      showToast(error?.response?.data?.message || "Gagal mengirim balasan", "error");
    } finally {
      setSending(false);
    }
  };

  const isInboxEmpty = !loadingChats && filteredChats.length === 0;

  return (
    <Box
      sx={{
        minHeight: "100%",
        p: { xs: 1.5, sm: 2.5, lg: 3 },
        fontFamily: FONT_SANS,
      }}
    >
      <Stack spacing={2.5}>
        <Panel
          sx={{
            p: { xs: 2, sm: 2.5 },
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(234,239,247,0.96) 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: FONT_SANS,
                  fontSize: { xs: 22, sm: 28 },
                  fontWeight: 800,
                  color: T.brand,
                  letterSpacing: "-0.04em",
                }}
              >
                Inbox WhatsApp
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  color: T.muted,
                  fontSize: 13.5,
                  lineHeight: 1.7,
                }}
              >
                Mode ringan untuk baca chat, cek riwayat terbaru, dan balas pesan tanpa buka WhatsApp
                Web terus-menerus.
              </Typography>
            </Box>

            <Button
              onClick={() => fetchChats()}
              startIcon={<RefreshRoundedIcon />}
              variant="outlined"
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontFamily: FONT_SANS,
                fontWeight: 700,
                borderColor: T.brandBorder,
                color: T.brand,
                background: "rgba(255,255,255,0.8)",
              }}
            >
              Refresh Inbox
            </Button>
          </Stack>
        </Panel>

        {errorText ? (
          <Alert severity="warning" sx={{ borderRadius: "14px" }}>
            {errorText}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "360px minmax(0, 1fr)" },
            gap: 2,
            minHeight: { xs: "auto", lg: "70vh" },
          }}
        >
          <Panel sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${T.line}` }}>
              <TextField
                fullWidth
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau nomor"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: T.subtle, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: T.surface,
                    fontFamily: FONT_SANS,
                  },
                }}
              />
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", background: T.white }}>
              {loadingChats ? (
                <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              ) : null}

              {isInboxEmpty ? (
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    color: T.muted,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    alignItems: "center",
                  }}
                >
                  <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 34, color: T.subtle }} />
                  <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 700, color: T.ink2 }}>
                    Belum ada chat yang bisa ditampilkan
                  </Typography>
                  <Typography sx={{ fontSize: 13, lineHeight: 1.7 }}>
                    Setelah pesan masuk atau keluar, inbox akan mulai terisi di sini.
                  </Typography>
                </Box>
              ) : null}

              {filteredChats.map((chat) => {
                const isActive = chat.id === selectedChatId;
                return (
                  <Box
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      borderBottom: `1px solid ${T.line}`,
                      background: isActive ? T.brandLight : T.white,
                      transition: "background 0.2s ease",
                      "&:hover": {
                        background: isActive ? T.brandLight : T.surface,
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          fontSize: 14,
                          fontWeight: 700,
                          bgcolor: isActive ? T.brand : T.blueBg,
                          color: isActive ? T.white : T.brand,
                        }}
                      >
                        {initialsOf(chat.name, chat.phone)}
                      </Avatar>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography
                            sx={{
                              fontFamily: FONT_SANS,
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: T.ink2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {chat.name}
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: T.subtle, flexShrink: 0 }}>
                            {formatDay(chat.lastMessage?.timestamp)}
                          </Typography>
                        </Stack>

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 0.4 }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12.25,
                              color: T.muted,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              minWidth: 0,
                            }}
                          >
                            {chat.lastMessage?.body || chat.phone || "Belum ada pesan"}
                          </Typography>

                          {chat.unread > 0 ? (
                            <Box
                              sx={{
                                minWidth: 22,
                                height: 22,
                                px: 0.8,
                                borderRadius: "999px",
                                bgcolor: T.brand,
                                color: T.white,
                                fontSize: 11,
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {chat.unread > 99 ? "99+" : chat.unread}
                            </Box>
                          ) : null}
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Panel>

          <Panel sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            {selectedChat ? (
              <>
                <Box
                  sx={{
                    px: 2.25,
                    py: 1.75,
                    borderBottom: `1px solid ${T.line}`,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.98) 100%)",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        fontSize: 14,
                        fontWeight: 700,
                        bgcolor: T.brandLight,
                        color: T.brand,
                      }}
                    >
                      {initialsOf(selectedChat.name, selectedChat.phone)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: FONT_SANS,
                          fontSize: 15,
                          fontWeight: 800,
                          color: T.ink2,
                        }}
                      >
                        {selectedChat.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, color: T.muted }}>
                        {selectedChat.phone || selectedChat.id}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: 2,
                    background:
                      "radial-gradient(circle at top left, rgba(234,239,247,0.95) 0%, rgba(249,250,251,0.95) 55%, rgba(255,255,255,0.98) 100%)",
                  }}
                >
                  {loadingMessages ? (
                    <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : null}

                  {!loadingMessages && messages.length === 0 ? (
                    <Box
                      sx={{
                        py: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.25,
                        color: T.muted,
                      }}
                    >
                      <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 34, color: T.subtle }} />
                      <Typography sx={{ fontWeight: 700, color: T.ink2 }}>
                        Belum ada riwayat pesan
                      </Typography>
                      <Typography sx={{ fontSize: 13 }}>
                        Percakapan terbaru akan muncul di panel ini.
                      </Typography>
                    </Box>
                  ) : null}

                  {!loadingMessages && messages.length > 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                      <Stack spacing={1} alignItems="center">
                        {hasMoreHistory ? (
                          <Button
                            onClick={handleLoadOlder}
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: "999px",
                              textTransform: "none",
                              fontFamily: FONT_SANS,
                              fontWeight: 700,
                              borderColor: T.brandBorder,
                              color: T.brand,
                              background: "rgba(255,255,255,0.78)",
                            }}
                          >
                            Lihat pesan lebih lama
                          </Button>
                        ) : null}

                        {historyNote ? (
                          <Typography sx={{ fontSize: 11.5, color: T.subtle, textAlign: "center" }}>
                            {historyNote}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Box>
                  ) : null}

                  <Stack spacing={1.25}>
                    {messages.map((message) => {
                      const fromMe = message.from === "me";
                      return (
                        <Box
                          key={message.id}
                          sx={{
                            display: "flex",
                            justifyContent: fromMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: { xs: "90%", md: "72%" },
                              px: 1.5,
                              py: 1.2,
                              borderRadius: fromMe ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                              bgcolor: fromMe ? T.brand : T.white,
                              color: fromMe ? T.white : T.text,
                              border: fromMe ? "none" : `1px solid ${T.line}`,
                              boxShadow: "0 10px 24px rgba(12,17,27,0.06)",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 13.5,
                                lineHeight: 1.65,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {message.body || "(pesan non-teks)"}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.8,
                                fontSize: 11,
                                color: fromMe ? "rgba(255,255,255,0.72)" : T.subtle,
                                textAlign: "right",
                                fontFamily: FONT_MONO,
                              }}
                            >
                              {formatTime(message.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                    <div ref={listBottomRef} />
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderTop: `1px solid ${T.line}`,
                    background: T.white,
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      maxRows={5}
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Tulis balasan pesan..."
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          backgroundColor: T.surface,
                          fontFamily: FONT_SANS,
                          alignItems: "flex-end",
                        },
                      }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sending}
                      variant="contained"
                      startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                      sx={{
                        minWidth: { xs: "100%", sm: 140 },
                        borderRadius: "14px",
                        textTransform: "none",
                        fontFamily: FONT_SANS,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #233971 0%, #2e5bba 100%)",
                        boxShadow: "none",
                      }}
                    >
                      Kirim
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  minHeight: { xs: 320, lg: "70vh" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  p: 4,
                  color: T.muted,
                  background:
                    "radial-gradient(circle at top left, rgba(234,239,247,0.95) 0%, rgba(249,250,251,0.98) 65%, rgba(255,255,255,1) 100%)",
                }}
              >
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 46, color: T.brandBorder, mb: 1.5 }} />
                <Typography
                  sx={{
                    fontFamily: FONT_SANS,
                    fontSize: 18,
                    fontWeight: 800,
                    color: T.ink2,
                  }}
                >
                  Pilih chat untuk mulai membaca pesan
                </Typography>
                <Typography sx={{ mt: 1, maxWidth: 420, fontSize: 13.5, lineHeight: 1.8 }}>
                  Halaman ini sengaja dibuat ringan. Fokusnya hanya inbox, riwayat singkat, dan balasan
                  cepat supaya tetap stabil saat dipakai dari domain.
                </Typography>
              </Box>
            )}
          </Panel>
        </Box>
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: "12px", fontFamily: FONT_SANS, fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
