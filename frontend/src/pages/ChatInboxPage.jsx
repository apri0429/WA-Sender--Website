import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import MicIcon from "@mui/icons-material/Mic";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import TagFacesIcon from "@mui/icons-material/TagFaces";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import api from "../services/api";
import socket from "../services/socket";

const picCache = new Map();
const picSubs = new Map();

const API_RAW = import.meta.env.DEV ? "http://192.168.1.254:8098" : "";
function mkMediaUrl(serializedId, download = false) {
  const baseUrl = `${API_RAW}/api/messages/${encodeURIComponent(serializedId)}/media`;
  return download ? `${baseUrl}?download=1` : baseUrl;
}

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const WA = {
  sidebarBg: "#F0F2F5",
  sidebarHover: "#E8EAED",
  sidebarActive: "#FFFFFF",
  sidebarBorder: "#E9EDEF",
  sidebarText: "#111B21",
  sidebarSub: "#667781",
  chatBg: "#EFEAE2",
  sentBg: "#D9FDD3",
  recvBg: "#FFFFFF",
  msgText: "#111B21",
  msgMeta: "#667781",
  green: "#00A884",
  greenDark: "#017C63",
  inputBar: "#F0F2F5",
  inputField: "#FFFFFF",
  inputText: "#111B21",
  inputPlaceholder: "#8696A0",
};

const P = {
  brand: "#00A884",
  brandDark: "#017C63",
  brandLight: "#E7F8F4",
  brandBorder: "#99D5C9",
  line: "#E9EDEF",
  ink: "#111B21",
  text: "#334155",
  muted: "#667781",
  white: "#FFFFFF",
  surface: "#F0F2F5",
  amberBg: "#FFFBEB",
  amberBorder: "#FCD34D",
};

const MSG_TYPE = {
  image:                 { Icon: ImageOutlinedIcon,           label: "Foto" },
  video:                 { Icon: VideocamOutlinedIcon,         label: "Video" },
  audio:                 { Icon: HeadphonesIcon,               label: "Audio" },
  ptt:                   { Icon: MicIcon,                      label: "Pesan suara" },
  document:              { Icon: InsertDriveFileOutlinedIcon,  label: "Dokumen" },
  sticker:               { Icon: TagFacesIcon,                 label: "Stiker" },
  location:              { Icon: LocationOnOutlinedIcon,       label: "Lokasi" },
  contact:               { Icon: PersonOutlinedIcon,           label: "Kontak" },
  contact_card_multi:    { Icon: GroupOutlinedIcon,            label: "Beberapa kontak" },
  vcard:                 { Icon: PersonOutlinedIcon,           label: "Kontak" },
  revoked:               { Icon: BlockOutlinedIcon,            label: "Pesan dihapus" },
  e2e_notification:      { Icon: LockOutlinedIcon,             label: "Enkripsi end-to-end" },
  notification_template: { Icon: InfoOutlinedIcon,             label: "Notifikasi" },
  protocol:              { Icon: InfoOutlinedIcon,             label: "Pesan sistem" },
  poll_creation:         { Icon: InfoOutlinedIcon,             label: "Polling" },
  list:                  { Icon: InfoOutlinedIcon,             label: "Pesan daftar" },
  list_response:         { Icon: InfoOutlinedIcon,             label: "Respon daftar" },
  buttons_response:      { Icon: InfoOutlinedIcon,             label: "Respon tombol" },
};

const EMOJI_LIST = [
  "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","😘","🥰","😗",
  "😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐",
  "😯","😪","😫","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🤑","😲",
  "☹️","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱",
  "🥵","🥶","😳","🤪","😵","😡","😠","🤬","😷","🤒","🤕","🤢","🤮","🤧","😇","🥳",
  "🥺","🤠","🤡","🤥","🤫","🤭","🧐","🤓","😈","👿","👹","👺","💀","☠️","👻","👽",
  "👾","🤖","💩","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
  "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆",
  "🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️",
  "💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👁️",
  "👀","👅","👄","💋","🫦","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️",
  "💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎",
  "☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓",
  "🌟","⭐","🌠","💫","✨","🌙","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓",
  "🌔","🌙","🌞","🌝","🌛","⛅","🌤️","🌥️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","🌬️","💨",
  "🌈","🌂","☂️","🌊","🌀","🌪️","🌁","🌫️","🔥","💧","🌊",
  "🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬",
  "🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞",
  "🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫓","🥙","🧆","🌮","🌯","🫔",
  "🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘",
  "🍥","🥮","🍡","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯",
  "🧃","🥤","🧋","☕","🍵","🧉","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧊",
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
  "🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝",
  "⚽","🏀","🏈","⚾","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏",
  "🪃","🥅","⛳","🪁","🤿","🎿","🛷","🥌","🎯","🪃","🎣","🤿","🎽","🛹","🛼","🛷",
  "🏋️","🤸","🤺","🤼","🤾","🤽","🏊","🧘","🏄","🚴","🏇","🧗","🚵","🏌️",
  "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵",
  "✈️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","🚂","🚃","🚄","🚅","🚆",
  "📱","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💽","💾","💿","📀","📷","📸","📹","🎥","📽️",
  "🎬","📺","📻","📠","☎️","📟","📠","📺","📻","🧭","⏱️","⌚","⏰","📡","🔋","🪫",
  "💡","🔦","🕯️","🪔","💊","🩹","🩺","🔬","🔭","🩻","🩼","🩺","💉","🩸","🧬",
  "🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒",
  "🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🌄","🌅","🌆","🌇",
  "🎪","🎢","🎡","🎠","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🪘","🥁","🎷","🎺","🪗",
  "🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🕹️","🧩","🪆","🪅","🎠","🎡","🎢",
  "💯","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔷","🔶","🔹","🔸",
  "✅","❌","❎","🚫","⛔","📛","🔞","💤","🆗","🆙","🆒","🆕","🆓","🔟","🆘","ℹ️",
];

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  return sessions.map((s) => ({
    id: s?.id || "",
    label: s?.label || s?.id || "Akun WhatsApp",
    isActive: !!s?.isActive,
    runtimeReady: !!s?.runtimeReady,
    runtimeInitializing: !!s?.runtimeInitializing,
    runtimeHasQr: !!s?.runtimeHasQr,
    lastKnownName: s?.lastKnownName || "",
    lastKnownNumber: s?.lastKnownNumber || "",
  }));
}

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(ts) {
  if (!ts) return "";
  const d = new Date(typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(d); msgDay.setHours(0, 0, 0, 0);
  if (msgDay.getTime() === today.getTime()) return "Hari ini";
  if (msgDay.getTime() === yesterday.getTime()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function isSameDay(ts1, ts2) {
  if (!ts1 || !ts2) return false;
  const norm = (t) => { const n = typeof t === "number" && t < 1e12 ? t * 1000 : t; return new Date(n); };
  const a = norm(ts1); const b = norm(ts2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getPreviewText(msg = {}) {
  if (!msg) return "Belum ada pesan";
  const meta = MSG_TYPE[msg.type];
  if (meta) {
    const caption = String(msg.body || "").trim();
    return caption ? `${meta.label}: ${caption.length > 40 ? caption.slice(0, 40) + "…" : caption}` : meta.label;
  }
  const text = String(msg.body || "").trim();
  if (!text) return "Belum ada pesan";
  return text.length > 55 ? `${text.slice(0, 55)}…` : text;
}

function sortChatsByActivity(items = []) {
  return [...items].sort((a, b) => (b?.lastMessage?.timestamp || 0) - (a?.lastMessage?.timestamp || 0));
}

function forceDownload(url, filename = "") {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── WA text rendering ───────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

function parseWaText(text) {
  // Split by URLs first, then apply WA markdown
  const parts = [];
  let lastIdx = 0;
  let m;
  const re = new RegExp(URL_REGEX.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push({ type: "text", value: text.slice(lastIdx, m.index) });
    parts.push({ type: "url", value: m[0] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push({ type: "text", value: text.slice(lastIdx) });
  return parts;
}

function applyMarkdown(text) {
  // Returns array of {style, value} segments
  const segments = [];
  // Patterns: bold *x*, italic _x_, strikethrough ~x~, mono `x`
  const re = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~|`([^`]+)`)/g;
  let last = 0;
  let mt;
  while ((mt = re.exec(text)) !== null) {
    if (mt.index > last) segments.push({ style: "normal", value: text.slice(last, mt.index) });
    if (mt[2] !== undefined) segments.push({ style: "bold", value: mt[2] });
    else if (mt[3] !== undefined) segments.push({ style: "italic", value: mt[3] });
    else if (mt[4] !== undefined) segments.push({ style: "strike", value: mt[4] });
    else if (mt[5] !== undefined) segments.push({ style: "mono", value: mt[5] });
    last = mt.index + mt[0].length;
  }
  if (last < text.length) segments.push({ style: "normal", value: text.slice(last) });
  return segments;
}

function WaText({ text, fromMe }) {
  if (!text) return null;
  const urlColor = fromMe ? "#066B4F" : "#027EB5";
  const parts = parseWaText(text);
  return (
    <Typography component="span" sx={{
      fontFamily: FONT_SANS, fontSize: 13.5, lineHeight: 1.55,
      whiteSpace: "pre-wrap", wordBreak: "break-word", display: "block", color: WA.msgText,
    }}>
      {parts.map((part, pi) => {
        if (part.type === "url") {
          return (
            <Box key={pi} component="a" href={part.value} target="_blank" rel="noopener noreferrer"
              sx={{ color: urlColor, textDecoration: "underline", wordBreak: "break-all" }}>
              {part.value}
            </Box>
          );
        }
        const segs = applyMarkdown(part.value);
        return segs.map((seg, si) => {
          if (seg.style === "bold") return <Box key={`${pi}-${si}`} component="span" sx={{ fontWeight: 700 }}>{seg.value}</Box>;
          if (seg.style === "italic") return <Box key={`${pi}-${si}`} component="span" sx={{ fontStyle: "italic" }}>{seg.value}</Box>;
          if (seg.style === "strike") return <Box key={`${pi}-${si}`} component="span" sx={{ textDecoration: "line-through" }}>{seg.value}</Box>;
          if (seg.style === "mono") return <Box key={`${pi}-${si}`} component="span" sx={{ fontFamily: FONT_MONO, fontSize: 12.5, bgcolor: fromMe ? "rgba(0,0,0,0.07)" : "#F0F2F5", px: 0.5, borderRadius: "3px" }}>{seg.value}</Box>;
          return <span key={`${pi}-${si}`}>{seg.value}</span>;
        });
      })}
    </Typography>
  );
}

// ─── Date separator ──────────────────────────────────────────────────────────

function DateSeparator({ label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", my: 1.5 }}>
      <Box sx={{ px: 2, py: 0.4, borderRadius: "7px", bgcolor: "rgba(255,255,255,0.85)", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>
        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: WA.sidebarSub, fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Profile pic hook ─────────────────────────────────────────────────────────

function useProfilePic(chatId) {
  const initial = (() => {
    const v = picCache.get(chatId);
    return typeof v === "string" && v !== "pending" ? v : null;
  })();
  const [url, setUrl] = useState(initial);
  useEffect(() => {
    if (!chatId) { setUrl(null); return; }
    const cached = picCache.get(chatId);
    setUrl((typeof cached === "string" && cached !== "pending") ? cached : null);
    if (!picSubs.has(chatId)) picSubs.set(chatId, new Set());
    picSubs.get(chatId).add(setUrl);
    if (!picCache.has(chatId)) {
      picCache.set(chatId, "pending");
      api.get(`/profile-pic/${encodeURIComponent(chatId)}`)
        .then((res) => { const u = res?.data?.url || null; picCache.set(chatId, u); picSubs.get(chatId)?.forEach((fn) => fn(u)); })
        .catch(() => { picCache.set(chatId, null); picSubs.get(chatId)?.forEach((fn) => fn(null)); });
    }
    return () => { picSubs.get(chatId)?.delete(setUrl); };
  }, [chatId]);
  return url;
}

function ChatAvatar({ name = "", chatId = "", size = 42 }) {
  const picUrl = useProfilePic(chatId);
  const [imgError, setImgError] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
  const palette = ["#6B93D6","#A67BC0","#E56B6F","#F4A261","#2A9D8F","#00A884","#E76F51"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const bg = palette[Math.abs(h) % palette.length];
  return (
    <Box sx={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, bgcolor: bg }}>
      {picUrl && !imgError ? (
        <Box component="img" src={picUrl} alt={name} onError={() => setImgError(true)}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#fff",
          fontFamily: FONT_SANS, fontWeight: 700, fontSize: Math.round(size * 0.36), userSelect: "none" }}>
          {initials}
        </Box>
      )}
    </Box>
  );
}

// ─── Quoted message block ─────────────────────────────────────────────────────

function QuotedMsgBlock({ quotedMsg, fromMe }) {
  if (!quotedMsg) return null;
  const meta = MSG_TYPE[quotedMsg.type];
  const preview = meta ? meta.label : (String(quotedMsg.body || "").slice(0, 80) || "(pesan media)");
  const accent = fromMe ? "#0C6E58" : WA.green;
  const bg = fromMe ? "rgba(0,0,0,0.07)" : "#EEF2F5";
  const label = quotedMsg.from === "me" ? "Kamu" : (quotedMsg.authorName || "");
  return (
    <Box sx={{ borderLeft: `3px solid ${accent}`, bgcolor: bg, borderRadius: "4px", px: 1, py: 0.4, mb: 0.6, maxWidth: "100%", overflow: "hidden", cursor: "default" }}>
      {label && <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, color: accent, lineHeight: 1.4 }}>{label}</Typography>}
      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: WA.sidebarSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {preview}
      </Typography>
    </Box>
  );
}

// ─── Media bubble ─────────────────────────────────────────────────────────────

function MediaBubble({ msg, fromMe }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const meta = MSG_TYPE[msg?.type];
  if (!meta) return null;
  const { Icon } = meta;
  const caption = String(msg?.body || "").trim();
  const sid = msg?.serializedId;
  const downloadName = msg?.filename || caption || `${msg?.type || "media"}-${sid || "file"}`;
  const mediaCapableTypes = new Set(["image", "sticker", "video", "audio", "ptt", "document"]);
  const canTryMedia = sid && (msg?.hasMedia || mediaCapableTypes.has(msg?.type));
  const mUrl = canTryMedia ? mkMediaUrl(sid) : null;
  const downloadUrl = canTryMedia ? mkMediaUrl(sid, true) : null;
  const iconColor = fromMe ? "#057C5D" : WA.green;
  const bgColor = fromMe ? "rgba(0,0,0,0.08)" : "#F0F2F5";
  const handleDownload = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!downloadUrl) return;
    forceDownload(downloadUrl, downloadName);
  };

  if (msg.type === "revoked") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, py: 0.2 }}>
        <BlockOutlinedIcon sx={{ fontSize: 16, color: WA.msgMeta, flexShrink: 0 }} />
        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontStyle: "italic", color: WA.msgMeta }}>
          Pesan ini telah dihapus
        </Typography>
      </Box>
    );
  }

  if ((msg.type === "image" || msg.type === "sticker") && mUrl && !mediaError) {
    return (
      <Box sx={{ maxWidth: 280 }}>
        <Box onClick={() => setLightboxOpen(true)} sx={{ cursor: "pointer", borderRadius: "6px", overflow: "hidden", lineHeight: 0 }}>
          <Box component="img" src={mUrl} alt={meta.label} onError={() => setMediaError(true)}
            sx={{ width: "100%", display: "block", maxHeight: 300, objectFit: "cover", transition: "opacity 0.15s", "&:hover": { opacity: 0.88 } }} />
        </Box>
        {downloadUrl && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
            <Tooltip title="Download gambar">
              <IconButton size="small" onClick={handleDownload} sx={{ color: iconColor }}>
                <DownloadRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {caption && <WaText text={caption} fromMe={fromMe} />}
        <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth={false}
          PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.88)", boxShadow: "none", borderRadius: "12px", overflow: "visible" } }}>
          <Box sx={{ position: "relative", p: 1 }}>
            <IconButton onClick={() => setLightboxOpen(false)}
              sx={{ position: "absolute", top: -16, right: -16, color: "#fff", zIndex: 1, bgcolor: "rgba(255,255,255,0.18)", "&:hover": { bgcolor: "rgba(255,255,255,0.32)" } }}>
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            {downloadUrl && (
              <IconButton
                onClick={handleDownload}
                sx={{ position: "absolute", top: -16, right: 28, color: "#fff", zIndex: 1, bgcolor: "rgba(255,255,255,0.18)", "&:hover": { bgcolor: "rgba(255,255,255,0.32)" } }}
              >
                <DownloadRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <Box component="img" src={mUrl} alt={meta.label}
              sx={{ display: "block", maxWidth: "88vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }} />
          </Box>
        </Dialog>
      </Box>
    );
  }

  if (msg.type === "video" && mUrl && !mediaError) {
    return (
      <Box sx={{ maxWidth: 320 }}>
        <Box sx={{ borderRadius: "6px", overflow: "hidden", bgcolor: "#000", lineHeight: 0 }}>
          <Box component="video" src={mUrl} controls onError={() => setMediaError(true)}
            sx={{ width: "100%", display: "block", maxHeight: 280 }} />
        </Box>
        {downloadUrl && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
            <Tooltip title="Download video">
              <IconButton size="small" onClick={handleDownload} sx={{ color: iconColor }}>
                <DownloadRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {caption && <WaText text={caption} fromMe={fromMe} />}
      </Box>
    );
  }

  if ((msg.type === "audio" || msg.type === "ptt") && mUrl && !mediaError) {
    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.25 }}>
          <Icon sx={{ fontSize: 20, color: iconColor, flexShrink: 0 }} />
          <Box component="audio" controls src={mUrl} onError={() => setMediaError(true)}
            sx={{ height: 36, minWidth: 180, maxWidth: 240, display: "block" }} />
          {downloadUrl && (
            <Tooltip title="Download audio">
              <IconButton size="small" onClick={handleDownload} sx={{ color: iconColor, flexShrink: 0 }}>
                <DownloadRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {caption && <WaText text={caption} fromMe={fromMe} />}
      </Box>
    );
  }

  if (msg.type === "document") {
    const filename = msg.filename || caption || meta.label;
    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.25, bgcolor: bgColor, borderRadius: "8px", minWidth: 220 }}>
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 32, color: iconColor, flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: WA.msgText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename}</Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: WA.msgMeta }}>Dokumen</Typography>
          </Box>
          {mUrl ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
              <Tooltip title="Buka">
                <IconButton size="small" component="a" href={mUrl} target="_blank" rel="noopener noreferrer" sx={{ color: iconColor }}>
                  <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" onClick={handleDownload} sx={{ color: iconColor }}>
                  <DownloadRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ) : null}
        </Box>
        {caption && caption !== filename && <WaText text={caption} fromMe={fromMe} />}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.75, bgcolor: bgColor, borderRadius: "6px", mb: caption ? 0.75 : 0 }}>
        <Icon sx={{ fontSize: 18, color: iconColor, flexShrink: 0 }} />
        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, color: fromMe ? "#2D6A4F" : WA.msgMeta }}>{meta.label}</Typography>
      </Box>
      {caption && <WaText text={caption} fromMe={fromMe} />}
    </Box>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPickerPanel({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = search.trim() ? EMOJI_LIST.filter((e) => e.includes(search.trim())) : EMOJI_LIST;
  return (
    <Box sx={{
      position: "absolute", bottom: "100%", left: 0, mb: 0.5, zIndex: 200,
      width: 300, bgcolor: P.white, borderRadius: "14px",
      border: `1px solid ${WA.sidebarBorder}`, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      overflow: "hidden",
    }}>
      <Box sx={{ px: 1.25, py: 0.75, borderBottom: `1px solid ${WA.sidebarBorder}`, display: "flex", alignItems: "center", gap: 0.75 }}>
        <SearchRoundedIcon sx={{ fontSize: 16, color: WA.sidebarSub }} />
        <Box component="input" autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari emoji..."
          sx={{ flex: 1, border: "none", outline: "none", fontFamily: FONT_SANS, fontSize: 13, color: WA.msgText, bgcolor: "transparent", "::placeholder": { color: WA.inputPlaceholder } }} />
        <IconButton size="small" onClick={onClose} sx={{ p: 0.25, color: WA.sidebarSub }}>
          <CloseRoundedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", p: 0.75, maxHeight: 220, overflowY: "auto",
        scrollbarWidth: "thin", scrollbarColor: `${WA.sidebarBorder} transparent`,
        "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: WA.sidebarBorder, borderRadius: 2 } }}>
        {filtered.map((em, i) => (
          <Box key={i} onClick={() => onSelect(em)} component="button"
            sx={{ width: 36, height: 36, display: "grid", placeItems: "center", fontSize: 20, cursor: "pointer",
              bgcolor: "transparent", border: "none", borderRadius: "6px", transition: "background 0.1s",
              "&:hover": { bgcolor: WA.sidebarBg } }}>
            {em}
          </Box>
        ))}
        {filtered.length === 0 && (
          <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: WA.sidebarSub, p: 1.5, width: "100%", textAlign: "center" }}>
            Tidak ditemukan
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Tick status icon ─────────────────────────────────────────────────────────

function MsgTick({ ack }) {
  // ack: 0=pending, 1=sent, 2=delivered, 3=read, -1=error
  if (ack === undefined || ack === null) return <DoneAllIcon sx={{ fontSize: 14, color: "#53BDEB" }} />;
  if (ack === 0) return <DoneRoundedIcon sx={{ fontSize: 13, color: WA.msgMeta }} />;
  if (ack === 1) return <DoneRoundedIcon sx={{ fontSize: 13, color: WA.msgMeta }} />;
  if (ack === 2) return <DoneAllIcon sx={{ fontSize: 14, color: WA.msgMeta }} />;
  if (ack === 3) return <DoneAllIcon sx={{ fontSize: 14, color: "#53BDEB" }} />;
  return <DoneAllIcon sx={{ fontSize: 14, color: "#53BDEB" }} />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatInboxPage() {
  const [whatsappReady, setWhatsappReady] = useState(false);
  const [waInitializing, setWaInitializing] = useState(false);
  const [waQr, setWaQr] = useState("");
  const [waQrAt, setWaQrAt] = useState(null);
  const [waSessions, setWaSessions] = useState([]);
  const [activeWaSessionId, setActiveWaSessionId] = useState("");
  const [waAccount, setWaAccount] = useState({ name: "", number: "" });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageMeta, setMessageMeta] = useState({ source: "", note: "", limit: 0 });
  const [messageDraft, setMessageDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [ctxMenu, setCtxMenu] = useState({ open: false, anchorEl: null, msg: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, msg: null });
  const [mediaDialog, setMediaDialog] = useState({ open: false, file: null, previewUrl: null, type: "", caption: "" });
  const [sendingMedia, setSendingMedia] = useState(false);
  const [myPicUrl, setMyPicUrl] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [headerSlotEl, setHeaderSlotEl] = useState(null);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState(null);
  const messageListRef = useRef(null);
  const shouldSnapToLatestRef = useRef(true);
  const fileInputRef = useRef(null);
  const draftInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => { setHeaderSlotEl(document.getElementById("header-wa-slot")); }, []);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const applyWhatsappState = (data = {}) => {
    const sessions = normalizeSessions(data?.sessions);
    const activeSessionId = data?.activeSessionId || sessions.find((s) => s.isActive)?.id || sessions[0]?.id || "";
    setWhatsappReady(!!data?.whatsappReady);
    setWaInitializing(!!data?.meta?.initializing && !data?.whatsappReady);
    setWaQr(data?.qr || "");
    setWaQrAt(data?.meta?.lastQrAt || null);
    setWaSessions(sessions);
    setActiveWaSessionId(activeSessionId);
    setWaAccount({ name: data?.account?.name || "", number: data?.account?.number || "" });
  };

  const loadChats = useCallback(async ({ preserveSelection = true } = {}) => {
    try {
      setLoadingChats(true);
      const res = await api.get("/chats");
      const next = sortChatsByActivity(Array.isArray(res?.data?.chats) ? res.data.chats : []);
      setChats(next);
      if (preserveSelection && next.some((c) => c.id === selectedChatId)) return;
      setSelectedChatId(next[0]?.id || "");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal memuat daftar chat", "error");
    } finally {
      setLoadingChats(false);
    }
  }, [selectedChatId]);

  const loadMessages = useCallback(async (chatId, { forceRefresh = false, snapToLatest = true } = {}) => {
    if (!chatId) { setMessages([]); setMessageMeta({ source: "", note: "", limit: 0 }); return; }
    try {
      setLoadingMessages(true);
      shouldSnapToLatestRef.current = snapToLatest;
      const res = await api.get(`/chats/${encodeURIComponent(chatId)}/messages`, { params: { limit: "all", refresh: forceRefresh ? "1" : "0" } });
      setMessages(Array.isArray(res?.data?.messages) ? res.data.messages : []);
      setMessageMeta({ source: res?.data?.source || "", note: res?.data?.note || "", limit: Number(res?.data?.limit) || 0 });
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)));
      api.post(`/chats/${encodeURIComponent(chatId)}/mark-read`).catch(() => {});
    } catch (err) {
      const msg = err?.response?.data?.message || "Gagal memuat pesan";
      setMessageMeta({ source: "", note: msg, limit: 0 });
      showToast(msg, "error");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const ensureWhatsappSession = useCallback(async ({ showFeedback = false } = {}) => {
    try {
      setLoadingStatus(true);
      const statusRes = await api.get("/status");
      const data = statusRes?.data || {};
      applyWhatsappState(data);
      const sessions = normalizeSessions(data?.sessions);
      const fallbackId = data?.activeSessionId || sessions.find((s) => s.isActive)?.id || sessions[0]?.id || "";
      if (!data?.whatsappReady && fallbackId && !data?.qr && !data?.meta?.initializing) {
        const initRes = await api.post("/init-whatsapp", { sessionId: fallbackId, createNew: false });
        applyWhatsappState(initRes?.data || {});
        if (showFeedback) showToast(initRes?.data?.message || "Mencoba menyambungkan sesi", "info");
        return;
      }
      if (showFeedback) showToast(data?.whatsappReady ? "WhatsApp siap" : data?.qr ? "QR siap discan" : "Menyiapkan koneksi", data?.whatsappReady ? "success" : "info");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal memeriksa status WhatsApp", "error");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const handleReconnect = async () => {
    try {
      setLoadingStatus(true);
      const targetId = activeWaSessionId || waSessions.find((s) => s.isActive)?.id || waSessions[0]?.id || "";
      if (!targetId) { showToast("Belum ada sesi WhatsApp tersimpan", "warning"); return; }
      const res = await api.post("/init-whatsapp", { sessionId: targetId, createNew: false });
      applyWhatsappState(res?.data || {});
      showToast(res?.data?.message || "Menghubungkan WhatsApp", "info");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal menghubungkan", "error");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (!sessionId || sessionId === activeWaSessionId) return;
    try {
      setLoadingStatus(true);
      setChats([]); setMessages([]); setSelectedChatId("");
      const res = await api.post("/select-whatsapp-session", { sessionId });
      applyWhatsappState(res?.data || {});
      showToast(res?.data?.message || "Akun WhatsApp dipilih", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal memilih akun", "error");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChatId || !messageDraft.trim()) return;
    try {
      setSendingMessage(true);
      await api.post(`/chats/${encodeURIComponent(selectedChatId)}/reply`, {
        message: messageDraft.trim(),
        quotedMsgId: replyingTo?.serializedId || undefined,
      });
      setMessageDraft("");
      setReplyingTo(null);
      await loadMessages(selectedChatId);
      await loadChats({ preserveSelection: true });
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal mengirim pesan", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    setMediaDialog({ open: true, file, previewUrl: isImage ? URL.createObjectURL(file) : null, type: isImage ? "image" : "document", caption: "" });
    e.target.value = "";
  };

  const handleCloseMediaDialog = () => {
    if (mediaDialog.previewUrl) URL.revokeObjectURL(mediaDialog.previewUrl);
    setMediaDialog({ open: false, file: null, previewUrl: null, type: "", caption: "" });
  };

  const handleSendMediaFromDialog = async () => {
    if (!selectedChatId || !mediaDialog.file) return;
    try {
      setSendingMedia(true);
      const formData = new FormData();
      formData.append("file", mediaDialog.file);
      if (mediaDialog.caption.trim()) formData.append("caption", mediaDialog.caption.trim());
      if (replyingTo?.serializedId) formData.append("quotedMsgId", replyingTo.serializedId);
      await api.post(`/chats/${encodeURIComponent(selectedChatId)}/reply-media`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      handleCloseMediaDialog();
      setReplyingTo(null);
      await loadMessages(selectedChatId);
      await loadChats({ preserveSelection: true });
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal mengirim file", "error");
    } finally {
      setSendingMedia(false);
    }
  };

  const handleConfirmDelete = async () => {
    const msg = deleteConfirm.msg;
    setDeleteConfirm({ open: false, msg: null });
    if (!msg?.serializedId) return;
    try {
      await api.post(`/messages/${encodeURIComponent(msg.serializedId)}/delete`);
      setMessages((prev) => prev.map((m) => (
        m.serializedId === msg.serializedId
          ? { ...m, type: "revoked", body: "", hasMedia: false, quotedMsg: null }
          : m
      )));
      await loadChats({ preserveSelection: true });
      showToast("Pesan dihapus untuk semua", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Gagal menghapus pesan", "error");
    }
  };

  const scrollToBottom = (behavior = "smooth") => {
    if (messageListRef.current) messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior });
  };

  const handleMsgListScroll = () => {
    const el = messageListRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  };

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  useEffect(() => { ensureWhatsappSession(); }, []);
  useEffect(() => {
    if (!whatsappReady) return;
    loadChats();
    api.get("/my-profile").then((r) => setMyPicUrl(r?.data?.picUrl || null)).catch(() => {});
  }, [whatsappReady]);
  useEffect(() => {
    shouldSnapToLatestRef.current = true;
    loadMessages(selectedChatId, { forceRefresh: true, snapToLatest: true });
  }, [selectedChatId]);
  useEffect(() => {
    if (whatsappReady || (!waInitializing && !waQr)) return undefined;
    const t = window.setInterval(() => ensureWhatsappSession(), 5000);
    return () => window.clearInterval(t);
  }, [whatsappReady, waInitializing, waQr]);
  useEffect(() => {
    if (!messageListRef.current) return;
    if (shouldSnapToLatestRef.current) {
      shouldSnapToLatestRef.current = false;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => scrollToBottom("instant"));
      });
      return;
    }
    const el = messageListRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) scrollToBottom("instant");
  }, [messages]);

  useEffect(() => {
    const onWaReady = async (payload) => {
      applyWhatsappState({ whatsappReady: true, qr: "", activeSessionId: payload?.sessionId || activeWaSessionId, sessions: payload?.sessions || waSessions, account: payload?.account || waAccount, meta: { initializing: false, lastQrAt: null } });
      await loadChats({ preserveSelection: false });
      showToast("WhatsApp siap digunakan", "success");
    };
    const onWaQr = (payload) => {
      setWhatsappReady(false); setWaInitializing(false);
      setWaQr(payload?.qr || ""); setWaQrAt(payload?.time || null);
      if (payload?.sessionId) setActiveWaSessionId(payload.sessionId);
    };
    const onNewMessage = (payload) => {
      const msg = payload?.message;
      if (!msg?.id || !payload?.chatId) return;
      const isOpen = payload.chatId === selectedChatId;
      setChats((prev) => {
        const cur = prev.find((c) => c.id === payload.chatId);
        const next = { id: payload.chatId, name: payload.name || cur?.name || payload.phone || "Chat", phone: payload.phone || cur?.phone || "", isGroup: cur?.isGroup || false, unread: isOpen ? 0 : (typeof payload.unread === "number" ? payload.unread : (cur?.unread || 0) + 1), lastMessage: { id: msg.id, from: msg.from, body: msg.body || "", timestamp: msg.timestamp || Date.now(), type: msg.type || "chat" } };
        return sortChatsByActivity([next, ...prev.filter((c) => c.id !== payload.chatId)]);
      });
      if (isOpen) {
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        api.post(`/chats/${encodeURIComponent(payload.chatId)}/mark-read`).catch(() => {});
      }
    };
    socket.on("wa-ready", onWaReady);
    socket.on("wa-qr", onWaQr);
    socket.on("chat:new-message", onNewMessage);
    return () => {
      socket.off("wa-ready", onWaReady);
      socket.off("wa-qr", onWaQr);
      socket.off("chat:new-message", onNewMessage);
    };
  }, [activeWaSessionId, selectedChatId, waAccount, waSessions]);

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;
  const filteredChats = chats.filter((c) => {
    const kw = chatSearch.trim().toLowerCase();
    if (!kw) return true;
    return [c?.name, c?.phone, c?.lastMessage?.body].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw));
  });

  // Build messages with date separators
  const messagesWithSeparators = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    if (!prev || !isSameDay(prev.timestamp, msg.timestamp)) {
      messagesWithSeparators.push({ type: "separator", ts: msg.timestamp, key: `sep-${i}` });
    }
    messagesWithSeparators.push({ type: "message", msg, key: msg.id || `${msg.timestamp}-${i}` });
  });

  // ─── Header portal ──────────────────────────────────────────────────────────

  const headerPortalContent = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "nowrap" }}>
      {waSessions.length > 0 && (() => {
        const activeSession = waSessions.find((s) => s.id === activeWaSessionId);
        const sessionLabel = activeSession?.lastKnownNumber || activeSession?.label || "Pilih Sesi";
        return (
          <>
            <Button size="small" onClick={(e) => setSessionMenuAnchor(e.currentTarget)}
              endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: "none", borderRadius: "8px", fontFamily: FONT_SANS, fontWeight: 500, fontSize: 12, color: "rgba(255,255,255,0.9)", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", px: 1.25, py: 0.5, gap: 0.5, "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, bgcolor: whatsappReady ? "#22C55E" : "rgba(255,255,255,0.3)" }} />
              {sessionLabel}
            </Button>
            <Menu anchorEl={sessionMenuAnchor} open={Boolean(sessionMenuAnchor)} onClose={() => setSessionMenuAnchor(null)}
              PaperProps={{ sx: { borderRadius: "12px", mt: 0.75, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" } }}>
              <Box sx={{ px: 2, py: 1, pb: 0.5 }}>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, color: "#667781", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pilih Sesi</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              {waSessions.map((s) => (
                <MenuItem key={s.id} selected={s.id === activeWaSessionId} onClick={() => { handleSelectSession(s.id); setSessionMenuAnchor(null); }}
                  sx={{ fontFamily: FONT_SANS, fontSize: 13, py: 1, px: 2, "&.Mui-selected": { bgcolor: "#E7F8F4" } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, width: "100%" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: s.id === activeWaSessionId && whatsappReady ? "#22C55E" : "#CBD5E1" }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: s.id === activeWaSessionId ? 600 : 400, color: "#111B21" }}>{s.label}</Typography>
                      {s.lastKnownNumber && <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: "#667781" }}>{s.lastKnownNumber}</Typography>}
                    </Box>
                    {s.id === activeWaSessionId && <Typography sx={{ fontFamily: FONT_SANS, fontSize: 10.5, color: "#00A884", fontWeight: 600, flexShrink: 0 }}>Aktif</Typography>}
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </>
        );
      })()}
      <Button size="small"
        startIcon={loadingStatus ? <CircularProgress size={12} sx={{ color: "rgba(255,255,255,0.8)" }} /> : <WifiRoundedIcon sx={{ fontSize: 15 }} />}
        onClick={handleReconnect} disabled={loadingStatus}
        sx={{ textTransform: "none", borderRadius: "8px", fontFamily: FONT_SANS, fontWeight: 500, fontSize: 12, color: "rgba(255,255,255,0.9)", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", px: 1.25, py: 0.5, minWidth: "unset", "&:hover": { bgcolor: "rgba(255,255,255,0.18)" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.35)", bgcolor: "transparent" } }}>
        Hubungkan WA
      </Button>
    </Box>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {headerSlotEl && createPortal(headerPortalContent, headerSlotEl)}
      <Box sx={{ p: 2, fontFamily: FONT_SANS, display: "flex", flexDirection: "column", gap: 1.5, flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* QR panel */}
        {waQr && (
          <Box sx={{ flexShrink: 0, bgcolor: P.amberBg, borderRadius: "16px", border: `1px solid ${P.amberBorder}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", px: 2.5, py: 2, display: "flex", alignItems: "flex-start", gap: 3, flexWrap: "wrap" }}>
            <Box sx={{ width: 164, height: 164, p: 1.5, flexShrink: 0, bgcolor: P.white, borderRadius: "12px", border: `2px solid ${P.amberBorder}`, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", display: "grid", placeItems: "center" }}>
              <QRCodeSVG value={waQr} size={132} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 14, color: P.ink, mb: 0.75 }}>Scan QR Code WhatsApp</Typography>
              {["Buka WhatsApp di ponsel", "Ketuk Menu atau Pengaturan", "Pilih Perangkat Tertaut", "Ketuk Tautkan Perangkat dan scan QR"].map((step, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: P.brand, fontWeight: 700, mt: "1px", flexShrink: 0 }}>{i + 1}.</Typography>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: P.text }}>{step}</Typography>
                </Box>
              ))}
              <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: P.muted, mt: 1 }}>Dibuat: {formatDateTime(waQrAt)}</Typography>
            </Box>
          </Box>
        )}

        {/* Main chat panel */}
        <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "340px minmax(0,1fr)" }, overflow: "hidden", borderRadius: "14px", border: `1px solid ${P.line}`, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

          {/* ── Chat list ── */}
          <Box sx={{ bgcolor: WA.sidebarBg, borderRight: `1px solid ${WA.sidebarBorder}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box sx={{ px: 1.5, py: 1.25, bgcolor: P.white, borderBottom: `1px solid ${WA.sidebarBorder}`, flexShrink: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0, bgcolor: WA.green }}>
                    {myPicUrl ? (
                      <Box component="img" src={myPicUrl} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#fff", fontFamily: FONT_SANS, fontWeight: 700, fontSize: 14 }}>
                        {(waAccount.name || "A").charAt(0).toUpperCase()}
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 16, color: WA.sidebarText }}>Chat</Typography>
                </Box>
                <Tooltip title="Refresh inbox">
                  <span>
                    <IconButton size="small" onClick={() => { ensureWhatsappSession({ showFeedback: true }); if (whatsappReady) loadChats(); }} disabled={loadingChats} sx={{ color: WA.sidebarSub, "&:hover": { bgcolor: WA.sidebarHover } }}>
                      {loadingChats ? <CircularProgress size={16} sx={{ color: WA.sidebarSub }} /> : <RefreshRoundedIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <TextField fullWidth size="small" placeholder="Cari nama, nomor, atau pesan..." value={chatSearch} onChange={(e) => setChatSearch(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { bgcolor: WA.sidebarBg, borderRadius: "8px", fontFamily: FONT_SANS, fontSize: 13.5, color: WA.sidebarText, "& fieldset": { border: "none" } }, "& .MuiInputBase-input::placeholder": { color: WA.sidebarSub, opacity: 1 }, "& .MuiInputBase-input": { py: 0.85 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: WA.sidebarSub, fontSize: 18 }} /></InputAdornment> }} />
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, scrollbarWidth: "thin", scrollbarColor: `${WA.sidebarBorder} transparent`, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: WA.sidebarBorder, borderRadius: 2 } }}>
              {loadingChats ? (
                <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={22} sx={{ color: WA.green }} /></Box>
              ) : !whatsappReady ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <WhatsAppIcon sx={{ fontSize: 44, color: WA.sidebarSub, mb: 1.5, opacity: 0.3 }} />
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, color: WA.sidebarSub, lineHeight: 1.6 }}>Hubungkan WhatsApp dulu<br />untuk memuat daftar chat</Typography>
                </Box>
              ) : filteredChats.length ? filteredChats.map((chat) => {
                const active = chat.id === selectedChatId;
                return (
                  <Box key={chat.id} onClick={() => setSelectedChatId(chat.id)}
                    sx={{ px: 1.5, py: 1, cursor: "pointer", bgcolor: active ? WA.sidebarActive : "transparent", borderBottom: `1px solid ${WA.sidebarBorder}`, display: "flex", alignItems: "center", gap: 1.5, transition: "background 0.12s", boxShadow: active ? `inset 3px 0 0 ${WA.green}` : "none", "&:hover": { bgcolor: active ? WA.sidebarActive : WA.sidebarHover } }}>
                    <ChatAvatar name={chat.name || chat.phone} chatId={chat.id} size={46} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.2 }}>
                        <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 14, color: WA.sidebarText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {chat.name || chat.phone || "Chat"}
                        </Typography>
                        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, color: chat.unread > 0 ? WA.green : WA.sidebarSub, flexShrink: 0, fontWeight: chat.unread > 0 ? 600 : 400 }}>
                          {formatTime(chat?.lastMessage?.timestamp)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {chat.lastMessage?.from === "me" && <DoneAllIcon sx={{ fontSize: 14, color: WA.green, flexShrink: 0 }} />}
                        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12.5, color: WA.sidebarSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {getPreviewText(chat?.lastMessage)}
                        </Typography>
                        {chat.unread > 0 && (
                          <Box sx={{ minWidth: 20, height: 20, px: 0.75, borderRadius: "999px", bgcolor: WA.green, color: "#fff", display: "grid", placeItems: "center", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {chat.unread > 99 ? "99+" : chat.unread}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              }) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, color: WA.sidebarSub }}>
                    {chats.length ? "Tidak ada chat yang cocok" : "Belum ada chat yang tersedia"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Message area ── */}
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, bgcolor: WA.chatBg }}>
            {selectedChat ? (
              <>
                {/* Chat header */}
                <Box sx={{ px: 2, py: 1.25, bgcolor: P.white, flexShrink: 0, borderBottom: `1px solid ${WA.sidebarBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                    <ChatAvatar name={selectedChat.name || selectedChat.phone} chatId={selectedChat.id} size={42} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 14.5, color: WA.sidebarText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selectedChat.name || selectedChat.phone || "Chat"}
                      </Typography>
                      <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: WA.sidebarSub }}>
                        {selectedChat.phone || selectedChat.id}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Sync riwayat chat">
                      <span>
                        <IconButton size="small" onClick={async () => { await loadMessages(selectedChatId, { forceRefresh: true, snapToLatest: true }); await loadChats({ preserveSelection: true }); showToast("Chat diperbarui", "success"); }} disabled={loadingMessages} sx={{ color: WA.sidebarSub, "&:hover": { bgcolor: WA.sidebarHover } }}>
                          {loadingMessages ? <CircularProgress size={16} sx={{ color: WA.sidebarSub }} /> : <RefreshRoundedIcon sx={{ fontSize: 20 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton size="small" sx={{ color: WA.sidebarSub, "&:hover": { bgcolor: WA.sidebarHover } }}>
                      <MoreVertIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Source banner */}
                {messageMeta.source && (
                  <Box sx={{ px: 2, py: 0.65, flexShrink: 0, bgcolor: messageMeta.source === "wa" ? "#ECFDF5" : "#FFFBEB", borderBottom: `1px solid ${messageMeta.source === "wa" ? "#BBF7D0" : "#FCD34D"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
                    {messageMeta.source === "wa" ? <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#10B981" }} /> : <FlashOnIcon sx={{ fontSize: 14, color: "#F59E0B" }} />}
                    <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: messageMeta.source === "wa" ? "#059669" : "#D97706" }}>
                      {messageMeta.source === "wa" ? "Tersinkron dari WhatsApp Web" : "Dari cache sesi aktif"}
                      {messageMeta.limit ? ` · ${messageMeta.limit} pesan` : ""}
                    </Typography>
                  </Box>
                )}

                {/* Messages */}
                <Box ref={messageListRef} onScroll={handleMsgListScroll}
                  sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, py: 1.5, bgcolor: WA.chatBg, position: "relative", scrollbarWidth: "thin", scrollbarColor: "#C0B9AE transparent", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#C0B9AE", borderRadius: 2 } }}>
                  {loadingMessages ? (
                    <Box sx={{ display: "flex", justifyContent: "center", pt: 5 }}><CircularProgress size={26} sx={{ color: WA.green }} /></Box>
                  ) : messagesWithSeparators.length ? messagesWithSeparators.map((item) => {
                    if (item.type === "separator") {
                      return <DateSeparator key={item.key} label={formatDateLabel(item.ts)} />;
                    }
                    const msg = item.msg;
                    const fromMe = msg?.from === "me";
                    return (
                      <Box key={item.key}
                        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ open: true, anchorEl: e.currentTarget, msg, x: e.clientX, y: e.clientY }); }}
                        sx={{ display: "flex", justifyContent: fromMe ? "flex-end" : "flex-start", width: "100%", mb: 0.5, alignItems: "flex-end", gap: 0.5 }}>

                        {!fromMe && (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, flexShrink: 0, mb: 0.5, opacity: 0, transition: "opacity 0.15s", "&:hover": { opacity: 1 }, ".msg-row:hover &": { opacity: 1 } }}>
                            <Tooltip title="Balas" placement="left">
                              <IconButton size="small" onClick={() => setReplyingTo({ serializedId: msg.serializedId, id: msg.id, body: msg.body || "", type: msg.type || "chat", from: msg.from, authorName: selectedChat?.name || selectedChat?.phone || "" })}
                                sx={{ color: WA.sidebarSub, p: 0.4, bgcolor: "rgba(255,255,255,0.85)", borderRadius: "50%", "&:hover": { bgcolor: "#fff" } }}>
                                <ReplyRoundedIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}

                        <Box
                          className="msg-row"
                          sx={{ position: "relative", maxWidth: "72%", ml: fromMe ? "auto" : 0, mr: fromMe ? 0 : "auto", px: 1.4, py: 0.8, bgcolor: fromMe ? WA.sentBg : WA.recvBg, color: WA.msgText, borderRadius: fromMe ? "8px 8px 0 8px" : "8px 8px 8px 0", boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                            "&::before": { content: '""', position: "absolute", bottom: 0, ...(fromMe ? { right: -8 } : { left: -8 }), width: 8, height: 13, backgroundColor: fromMe ? WA.sentBg : WA.recvBg, ...(fromMe ? { borderBottomLeftRadius: 8 } : { borderBottomRightRadius: 8 }) },
                            "&::after": { content: '""', position: "absolute", bottom: -2, ...(fromMe ? { right: -10 } : { left: -10 }), width: 10, height: 10, backgroundColor: WA.chatBg, ...(fromMe ? { borderBottomLeftRadius: 6 } : { borderBottomRightRadius: 6 }) },
                            "&:hover .msg-actions": { opacity: 1 },
                          }}
                        >
                          {/* Hover action button */}
                          <Box className="msg-actions" sx={{ position: "absolute", top: 4, ...(fromMe ? { left: -32 } : { right: -32 }), opacity: 0, transition: "opacity 0.15s", zIndex: 1 }}>
                            <IconButton size="small" onClick={(e) => setCtxMenu({ open: true, anchorEl: e.currentTarget, msg })}
                              sx={{ color: WA.sidebarSub, p: 0.3, bgcolor: "rgba(255,255,255,0.9)", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", "&:hover": { bgcolor: "#fff" } }}>
                              <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>

                          <QuotedMsgBlock quotedMsg={msg.quotedMsg} fromMe={fromMe} />
                          {MSG_TYPE[msg?.type] ? (
                            <MediaBubble msg={msg} fromMe={fromMe} />
                          ) : (
                            <WaText text={msg?.body || ""} fromMe={fromMe} />
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.4, mt: 0.25 }}>
                            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 10.5, color: WA.msgMeta }}>
                              {formatTime(msg?.timestamp)}
                            </Typography>
                            {fromMe && <MsgTick ack={msg?.ack} />}
                          </Box>
                        </Box>

                        {fromMe && (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, flexShrink: 0, mb: 0.5, opacity: 0, transition: "opacity 0.15s", "&:hover": { opacity: 1 }, ".msg-row:hover &": { opacity: 1 } }}>
                            <Tooltip title="Balas" placement="right">
                              <IconButton size="small" onClick={() => setReplyingTo({ serializedId: msg.serializedId, id: msg.id, body: msg.body || "", type: msg.type || "chat", from: msg.from, authorName: "Kamu" })}
                                sx={{ color: WA.sidebarSub, p: 0.4, bgcolor: "rgba(255,255,255,0.85)", borderRadius: "50%", transform: "scaleX(-1)", "&:hover": { bgcolor: "#fff" } }}>
                                <ReplyRoundedIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    );
                  }) : (
                    <Box sx={{ textAlign: "center", pt: 5 }}>
                      <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, color: WA.msgMeta }}>
                        {messageMeta.note || "Belum ada riwayat pesan. Buka chat di WhatsApp lalu klik Sync."}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Scroll to bottom FAB */}
                {showScrollBtn && (
                  <Box sx={{ position: "absolute", bottom: 90, right: 24, zIndex: 10 }}>
                    <IconButton onClick={() => scrollToBottom("smooth")}
                      sx={{ bgcolor: P.white, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", color: WA.sidebarSub, width: 36, height: 36, "&:hover": { bgcolor: WA.sidebarBg } }}>
                      <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20, transform: "rotate(180deg)" }} />
                    </IconButton>
                  </Box>
                )}

                {/* Input bar */}
                <Box sx={{ px: 1.25, py: 0.75, bgcolor: WA.inputBar, borderTop: `1px solid ${WA.sidebarBorder}`, flexShrink: 0 }}>
                  {replyingTo && (
                    <Box sx={{ mb: 0.6, pl: 1.25, pr: 0.5, py: 0.6, bgcolor: WA.inputField, borderRadius: "10px", borderLeft: `3px solid ${WA.green}`, display: "flex", alignItems: "center", gap: 1 }}>
                      <ReplyRoundedIcon sx={{ fontSize: 15, color: WA.green, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, color: WA.green, lineHeight: 1.4 }}>
                          {replyingTo.from === "me" ? "Kamu" : replyingTo.authorName}
                        </Typography>
                        <Typography sx={{ fontFamily: FONT_SANS, fontSize: 11.5, color: WA.sidebarSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {MSG_TYPE[replyingTo.type] ? MSG_TYPE[replyingTo.type].label : (replyingTo.body.slice(0, 60) || "(media)")}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setReplyingTo(null)} sx={{ p: 0.4, flexShrink: 0, color: WA.sidebarSub }}>
                        <CloseRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {/* Emoji button */}
                    <Box ref={emojiPickerRef} sx={{ position: "relative", flexShrink: 0 }}>
                      <Tooltip title="Emoji">
                        <span>
                          <IconButton onClick={() => setShowEmojiPicker((v) => !v)} disabled={!whatsappReady}
                            sx={{ width: 36, height: 36, color: showEmojiPicker ? WA.green : WA.sidebarSub, borderRadius: "50%", "&:hover": { bgcolor: WA.sidebarHover }, "&.Mui-disabled": { color: "#CBD5E1" } }}>
                            <EmojiEmotionsOutlinedIcon sx={{ fontSize: 21 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {showEmojiPicker && (
                        <EmojiPickerPanel
                          onSelect={(em) => {
                            setMessageDraft((d) => d + em);
                            draftInputRef.current?.focus();
                          }}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}
                    </Box>

                    {/* Attach */}
                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf,video/mp4,video/3gpp,audio/mpeg,audio/ogg,audio/aac" style={{ display: "none" }} onChange={handleFileSelect} />
                    <Tooltip title="Lampirkan file">
                      <span>
                        <IconButton onClick={() => fileInputRef.current?.click()} disabled={!whatsappReady}
                          sx={{ width: 36, height: 36, flexShrink: 0, color: WA.sidebarSub, borderRadius: "50%", "&:hover": { bgcolor: WA.sidebarHover }, "&.Mui-disabled": { color: "#CBD5E1" } }}>
                          <AttachFileRoundedIcon sx={{ fontSize: 19 }} />
                        </IconButton>
                      </span>
                    </Tooltip>

                    {/* Text input */}
                    <TextField
                      inputRef={draftInputRef}
                      fullWidth multiline minRows={1} maxRows={4}
                      placeholder="Ketik pesan..."
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      sx={{ "& .MuiOutlinedInput-root": { bgcolor: WA.inputField, borderRadius: "20px", fontFamily: FONT_SANS, fontSize: 13.5, color: WA.inputText, "& fieldset": { borderColor: WA.sidebarBorder }, "&:hover fieldset": { borderColor: P.brandBorder }, "&.Mui-focused fieldset": { borderColor: WA.green } }, "& .MuiInputBase-input::placeholder": { color: WA.inputPlaceholder, opacity: 1 }, "& .MuiInputBase-input": { py: 0.75, px: 1.5 } }}
                    />

                    {/* Send */}
                    <IconButton onClick={handleSendMessage} disabled={!whatsappReady || sendingMessage || !messageDraft.trim()}
                      sx={{ width: 38, height: 38, flexShrink: 0, bgcolor: WA.green, color: "#fff", borderRadius: "50%", "&:hover": { bgcolor: WA.greenDark }, "&.Mui-disabled": { bgcolor: "#CBD5E1", color: "#94A3B8" }, transition: "all 0.2s" }}>
                      {sendingMessage ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2.5, bgcolor: WA.chatBg }}>
                <Box sx={{ width: 110, height: 110, borderRadius: "50%", border: `2px solid ${WA.green}20`, display: "grid", placeItems: "center", bgcolor: `${WA.green}08` }}>
                  <WhatsAppIcon sx={{ fontSize: 56, color: `${WA.green}50` }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 20, color: "#41525D", mb: 0.75 }}>WhatsApp Chat Inbox</Typography>
                  <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, color: WA.msgMeta, maxWidth: 320, lineHeight: 1.65 }}>Pilih salah satu percakapan di sebelah kiri untuk membuka riwayat chat</Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* ── Context menu (right-click / dropdown on message) ── */}
        <Menu
          open={ctxMenu.open}
          anchorEl={ctxMenu.anchorEl}
          onClose={() => setCtxMenu({ open: false, anchorEl: null, msg: null })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          PaperProps={{ sx: { borderRadius: "12px", minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", py: 0.5 } }}
        >
          <MenuItem onClick={() => {
            const msg = ctxMenu.msg;
            if (msg) setReplyingTo({ serializedId: msg.serializedId, id: msg.id, body: msg.body || "", type: msg.type || "chat", from: msg.from, authorName: msg.from === "me" ? "Kamu" : (selectedChat?.name || selectedChat?.phone || "") });
            setCtxMenu({ open: false, anchorEl: null, msg: null });
          }} sx={{ fontFamily: FONT_SANS, fontSize: 13, gap: 1.5, py: 1 }}>
            <ReplyRoundedIcon sx={{ fontSize: 17, color: WA.sidebarSub }} /> Balas
          </MenuItem>
          {ctxMenu.msg?.body && (
            <MenuItem onClick={() => {
              navigator.clipboard.writeText(ctxMenu.msg.body).catch(() => {});
              showToast("Pesan disalin", "success");
              setCtxMenu({ open: false, anchorEl: null, msg: null });
            }} sx={{ fontFamily: FONT_SANS, fontSize: 13, gap: 1.5, py: 1 }}>
              <ContentCopyRoundedIcon sx={{ fontSize: 17, color: WA.sidebarSub }} /> Salin teks
            </MenuItem>
          )}
          <MenuItem onClick={async () => {
            const chatId = selectedChatId;
            setCtxMenu({ open: false, anchorEl: null, msg: null });
            if (!chatId) return;
            await loadMessages(chatId, { forceRefresh: true, snapToLatest: true });
            await loadChats({ preserveSelection: true });
            showToast("Pesan berhasil ditarik dari WhatsApp", "success");
          }} sx={{ fontFamily: FONT_SANS, fontSize: 13, gap: 1.5, py: 1 }}>
            <RefreshRoundedIcon sx={{ fontSize: 17, color: WA.sidebarSub }} /> Tarik pesan
          </MenuItem>
          {ctxMenu.msg?.from === "me" && (
            <MenuItem onClick={() => {
              setDeleteConfirm({ open: true, msg: ctxMenu.msg });
              setCtxMenu({ open: false, anchorEl: null, msg: null });
            }} sx={{ fontFamily: FONT_SANS, fontSize: 13, gap: 1.5, py: 1, color: "#EF4444" }}>
              <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} /> Hapus untuk semua
            </MenuItem>
          )}
        </Menu>

        {/* Delete confirmation */}
        <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, msg: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", m: 2 } }}>
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography sx={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 15, color: WA.msgText, mb: 0.75 }}>Hapus pesan?</Typography>
            <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13.5, color: WA.sidebarSub, mb: 2.5 }}>Pesan ini akan dihapus untuk semua orang di chat ini.</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={() => setDeleteConfirm({ open: false, msg: null })} variant="text" sx={{ textTransform: "none", fontFamily: FONT_SANS, color: WA.sidebarSub, borderRadius: "8px" }}>Batal</Button>
              <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ textTransform: "none", fontFamily: FONT_SANS, fontWeight: 600, borderRadius: "8px", px: 2 }}>Hapus untuk Semua</Button>
            </Box>
          </Box>
        </Dialog>

        {/* Media preview dialog */}
        <Dialog open={mediaDialog.open} onClose={handleCloseMediaDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", m: 2 } }}>
          <Box sx={{ position: "relative" }}>
            <IconButton onClick={handleCloseMediaDialog} size="small" sx={{ position: "absolute", top: 8, right: 8, zIndex: 2, bgcolor: "rgba(0,0,0,0.45)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.65)" } }}>
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {mediaDialog.type === "image" && mediaDialog.previewUrl ? (
              <Box component="img" src={mediaDialog.previewUrl} sx={{ width: "100%", maxHeight: 360, objectFit: "contain", bgcolor: "#111", display: "block" }} />
            ) : (
              <Box sx={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "#F8F9FA", gap: 1.5, px: 2 }}>
                <InsertDriveFileOutlinedIcon sx={{ fontSize: 52, color: "#D97706" }} />
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: WA.msgText, textAlign: "center", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mediaDialog.file?.name}</Typography>
                <Typography sx={{ fontFamily: FONT_SANS, fontSize: 12, color: WA.sidebarSub }}>{mediaDialog.file ? `${(mediaDialog.file.size / 1024).toFixed(0)} KB` : ""}</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
            <TextField fullWidth autoFocus placeholder="Tambahkan caption..." value={mediaDialog.caption}
              onChange={(e) => setMediaDialog((p) => ({ ...p, caption: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMediaFromDialog(); } }}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: FONT_SANS, fontSize: 13.5, "& fieldset": { borderColor: WA.sidebarBorder }, "&.Mui-focused fieldset": { borderColor: WA.green } }, "& .MuiInputBase-input::placeholder": { color: WA.inputPlaceholder, opacity: 1 } }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1.5 }}>
              <Button onClick={handleCloseMediaDialog} variant="text" sx={{ textTransform: "none", fontFamily: FONT_SANS, color: WA.sidebarSub, borderRadius: "8px" }}>Batal</Button>
              <Button onClick={handleSendMediaFromDialog} variant="contained" disabled={sendingMedia}
                startIcon={sendingMedia ? <CircularProgress size={14} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 15 }} />}
                sx={{ textTransform: "none", fontFamily: FONT_SANS, fontWeight: 600, bgcolor: WA.green, borderRadius: "8px", px: 2, "&:hover": { bgcolor: WA.greenDark } }}>
                {sendingMedia ? "Mengirim..." : "Kirim"}
              </Button>
            </Box>
          </Box>
        </Dialog>

        <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontFamily: FONT_SANS, alignItems: "center" }}>{toast.message}</Alert>
        </Snackbar>
      </Box>
    </>
  );
}
