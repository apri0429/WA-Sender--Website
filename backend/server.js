const express = require("express");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const qrcode = require("qrcode-terminal");
const puppeteer = require("puppeteer");
const { google } = require("googleapis");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { execSync } = require("child_process");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 8090;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://192.168.1.254:5173";

const BASE_DIR = __dirname;
const SESSION_DIR = path.join(BASE_DIR, "sessions");
const DATA_DIR = path.join(BASE_DIR, "data");
const FRONTEND_DIST_DIR = path.join(BASE_DIR, "frontend_dist");
const GENERATED_DIR = path.join(BASE_DIR, "generated");
const PDF_OUTPUT_DIR = path.join(GENERATED_DIR, "pdfs");
const TEMPLATE_FILE = path.join(DATA_DIR, "template.json");
const GSHEET_FILE = path.join(DATA_DIR, "gsheet.json");
const WA_SESSIONS_FILE = path.join(DATA_DIR, "wa-sessions.json");
const PDF_TEMPORARY_FILE = path.join(DATA_DIR, "pdf-temporary.json");
const PDF_LOG_FILE = path.join(DATA_DIR, "pdf-log.json");
const PDF_PROGRESS_FILE = path.join(DATA_DIR, "pdf-progress.json");
const PDF_LOGO_FILE = path.join(DATA_DIR, "pdf-logo.json");
const PDF_WORKBOOK_DATA_FILE = path.join(DATA_DIR, "pdf-workbook-data.json");
const PDF_DRIVE_CONFIG_FILE = path.join(DATA_DIR, "pdf-drive-config.json");
const PDF_DRIVE_KEY_FILE = path.join(DATA_DIR, "pdf-drive-key.json");
const MASTERDATA_FILE = path.join(DATA_DIR, "masterdata.json");
const WWEBJS_CACHE_DIR = path.join(BASE_DIR, ".wwebjs_cache");

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
if (!fs.existsSync(PDF_OUTPUT_DIR)) fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static(FRONTEND_DIST_DIR));
app.use("/generated", express.static(GENERATED_DIR));

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (
      allowed.includes(file.mimetype) ||
      /\.(xlsx|xls)$/i.test(file.originalname)
    ) {
      cb(null, true);
    } else {
      cb(new Error("File harus Excel .xlsx atau .xls"));
    }
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.mimetype || "")) {
      cb(null, true);
    } else {
      cb(new Error("File logo harus berupa gambar png/jpg/webp/gif"));
    }
  },
});

const chatMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/(png|jpeg|jpg|webp|gif)|video\/(mp4|3gpp)|audio\/(mpeg|ogg|mp4|aac)|application\/pdf)$/i;
    if (allowed.test(file.mimetype || "")) {
      cb(null, true);
    } else {
      cb(new Error("Tipe file tidak didukung. Gunakan gambar, video, audio, atau PDF."));
    }
  },
});

const jsonUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
});

let waClient = null;
let activeSessionId = null;
let currentClientSessionId = null;
let currentClientVisible = false;
let currentClientBrowser = "auto";
let isWhatsAppReady = false;
let isWhatsAppInitializing = false;
let isSending = false;
let lastQrString = null;
let lastQrAt = null;
let lastWhatsAppEvent = "idle";
let lastSendSummary = null;
let lastSendResults = [];
let currentSendProgress = {
  current: 0,
  total: 0,
  customer: null,
};
let isPdfGenerating = false;
let isPdfCancelRequested = false;

// Chat inbox - in-memory store
const chatHistory = new Map(); // chatId -> { id, name, phone, unread, messages[] }
const CHAT_LIST_LIMIT = 500;
const CHAT_MESSAGE_LIMIT = 1500;

function clearChatHistory() {
  chatHistory.clear();
}

function serializeMessage(msg) {
  const qd = msg._data?.quotedMsg;
  return {
    id: msg.id?.id || String(Date.now()),
    serializedId: msg.id?._serialized || null,
    from: msg.fromMe ? "me" : "them",
    body: msg.body || "",
    timestamp: msg.timestamp ? msg.timestamp * 1000 : Date.now(),
    type: msg.type || "chat",
    hasMedia: msg.hasMedia || false,
    filename: msg.filename || null,
    quotedMsg: qd ? {
      body: qd.body || "",
      type: qd.type || "chat",
      from: qd.fromMe ? "me" : "them",
      authorName: qd.notifyName || "",
    } : null,
  };
}

function storeMessage(chatId, name, phone, msg) {
  if (!chatHistory.has(chatId)) {
    chatHistory.set(chatId, { id: chatId, name, phone, unread: 0, messages: [] });
  }
  const chat = chatHistory.get(chatId);
  chat.name = name;
  chat.phone = phone;
  const entry = serializeMessage(msg);
  // Hindari duplikat
  if (!chat.messages.find((m) => m.id === entry.id)) {
    chat.messages.push(entry);
  }
  if (!msg.fromMe) chat.unread += 1;
  return entry;
}

function mergeStoredMessages(storedChat, messages = []) {
  messages.forEach((message) => {
    const idx = storedChat.messages.findIndex((m) => m.id === message.id);
    if (idx === -1) {
      storedChat.messages.push(message);
    } else {
      // Always update existing entry — handles revoked type changes after deletion
      storedChat.messages[idx] = message;
    }
  });

  storedChat.messages.sort((a, b) => a.timestamp - b.timestamp);

  return storedChat.messages;
}

function getWhatsAppAccountInfo() {
  const info = waClient?.info;
  const wid = info?.wid;

  return {
    number: wid?.user || "",
    wid: wid?._serialized || "",
    name: info?.pushname || info?.me?.pushname || "",
    platform: info?.platform || "",
  };
}

function buildWhatsAppSessionLabel(account = {}, fallback = "") {
  const name = String(account?.name || "").trim();
  const number = String(account?.number || "").trim();

  if (name && number) return `${name} (${number})`;
  if (name) return name;
  if (number) return number;
  return fallback;
}

function generateWhatsAppSessionId(baseLabel = "akun-wa") {
  const existingIds = new Set(getWhatsAppSessions().map((session) => session.id));
  const normalizedBase = normalizeSessionId(baseLabel) || "akun-wa";
  let candidate = normalizedBase;
  let index = 2;

  while (existingIds.has(candidate)) {
    candidate = `${normalizedBase}-${index}`;
    index += 1;
  }

  return candidate;
}

function normalizeSessionId(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function normalizeBrowserTarget(value = "auto") {
  const normalizedValue = String(value || "auto").trim().toLowerCase();
  if (["auto", "chrome", "edge", "builtin"].includes(normalizedValue)) {
    return normalizedValue;
  }
  return "auto";
}

function resolveBrowserExecutablePath(target = "auto") {
  const normalizedTarget = normalizeBrowserTarget(target);
  const chromePaths = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const edgePaths = [
    process.env.EDGE_PATH,
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  const candidates =
    normalizedTarget === "chrome"
      ? chromePaths
      : normalizedTarget === "edge"
        ? edgePaths
        : normalizedTarget === "builtin"
          ? []
          : [...chromePaths, ...edgePaths];

  return candidates.find((candidatePath) => fs.existsSync(candidatePath)) || null;
}

function getWhatsAppSessionsConfig() {
  const data = readJsonFile(WA_SESSIONS_FILE, {
    activeSessionId: "",
    sessions: [],
  });

  const sessions = Array.isArray(data.sessions) ? data.sessions : [];

  return {
    activeSessionId: data.activeSessionId || "",
    sessions: sessions.map((session) => ({
      id: String(session.id || "").trim(),
      label: String(session.label || session.id || "").trim(),
      createdAt: session.createdAt || null,
      lastUsedAt: session.lastUsedAt || null,
      lastKnownNumber: session.lastKnownNumber || "",
      lastKnownName: session.lastKnownName || "",
      lastKnownPlatform: session.lastKnownPlatform || "",
    })),
  };
}

function saveWhatsAppSessionsConfig(nextConfig = {}) {
  const current = getWhatsAppSessionsConfig();
  const merged = {
    ...current,
    ...nextConfig,
  };

  writeJsonFile(WA_SESSIONS_FILE, merged);
  return merged;
}

function getWhatsAppSessions() {
  return getWhatsAppSessionsConfig().sessions;
}

function getWhatsAppSessionMeta(sessionId = activeSessionId) {
  if (!sessionId) return null;
  return getWhatsAppSessions().find((session) => session.id === sessionId) || null;
}

function persistWhatsAppSessionMeta(sessionId, patch = {}) {
  const config = getWhatsAppSessionsConfig();
  const sessions = [...config.sessions];
  const index = sessions.findIndex((session) => session.id === sessionId);
  const current = index >= 0 ? sessions[index] : null;
  const nextSession = {
    id: sessionId,
    label: patch.label || current?.label || sessionId,
    createdAt: current?.createdAt || new Date().toISOString(),
    lastUsedAt: patch.lastUsedAt ?? current?.lastUsedAt ?? null,
    lastKnownNumber: patch.lastKnownNumber ?? current?.lastKnownNumber ?? "",
    lastKnownName: patch.lastKnownName ?? current?.lastKnownName ?? "",
    lastKnownPlatform: patch.lastKnownPlatform ?? current?.lastKnownPlatform ?? "",
  };

  if (index >= 0) sessions[index] = nextSession;
  else sessions.push(nextSession);

  return saveWhatsAppSessionsConfig({
    activeSessionId: patch.setActive ? sessionId : config.activeSessionId,
    sessions,
  });
}

function removeWhatsAppSessionMeta(sessionId) {
  const config = getWhatsAppSessionsConfig();
  const sessions = config.sessions.filter((session) => session.id !== sessionId);
  const nextActiveSessionId =
    config.activeSessionId === sessionId ? sessions[0]?.id || "" : config.activeSessionId;

  return saveWhatsAppSessionsConfig({
    activeSessionId: nextActiveSessionId,
    sessions,
  });
}

function getWhatsAppSessionsSummary() {
  return getWhatsAppSessions().map((session) => ({
    ...session,
    isActive: session.id === activeSessionId,
    runtimeReady: session.id === activeSessionId ? isWhatsAppReady : false,
    runtimeInitializing: session.id === activeSessionId ? isWhatsAppInitializing : false,
    runtimeHasQr: session.id === activeSessionId ? !!lastQrString : false,
  }));
}

function isNamedWhatsAppSession(session = {}) {
  return !!(
    String(session?.lastKnownName || "").trim() ||
    String(session?.lastKnownNumber || "").trim()
  );
}

function getPreferredWhatsAppSessionId() {
  const config = getWhatsAppSessionsConfig();
  const sessions = config.sessions || [];
  const activeSession = sessions.find((session) => session.id === config.activeSessionId);

  if (isNamedWhatsAppSession(activeSession)) {
    return activeSession.id;
  }

  const firstNamedSession = sessions.find((session) => isNamedWhatsAppSession(session));
  if (firstNamedSession?.id) {
    return firstNamedSession.id;
  }

  if (config.activeSessionId) return config.activeSessionId;
  if (sessions[0]?.id) return sessions[0].id;
  return "";
}

function resolveSessionId(requestedSessionId = "") {
  const normalizedRequested = normalizeSessionId(requestedSessionId);
  if (normalizedRequested) return normalizedRequested;
  if (activeSessionId) return activeSessionId;

  return getPreferredWhatsAppSessionId();
}

function setActiveWhatsAppSession(sessionId, patch = {}, options = {}) {
  if (!sessionId) return null;
  if (activeSessionId && activeSessionId !== sessionId) {
    clearChatHistory();
  }
  activeSessionId = sessionId;
  if (!options.skipPersist) {
    persistWhatsAppSessionMeta(sessionId, {
      ...patch,
      setActive: true,
      lastUsedAt: patch.lastUsedAt ?? new Date().toISOString(),
    });
  }
  return sessionId;
}

function getWhatsAppSessionDir(sessionId) {
  return path.join(SESSION_DIR, `session-wa-sender-${sessionId}`);
}

function deleteWhatsAppSessionFiles(sessionId) {
  const sessionDir = getWhatsAppSessionDir(sessionId);
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
}

function clearWhatsAppWebCache() {
  try {
    if (fs.existsSync(WWEBJS_CACHE_DIR)) {
      fs.rmSync(WWEBJS_CACHE_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`Gagal membersihkan .wwebjs_cache: ${error.message}`);
  }
}

function tryDeleteWhatsAppSessionFiles(sessionId) {
  try {
    deleteWhatsAppSessionFiles(sessionId);
    return {
      deleted: true,
      warning: "",
    };
  } catch (error) {
    if (error?.code === "EBUSY" || error?.code === "EPERM") {
      return {
        deleted: false,
        warning:
          "File sesi masih dipakai Windows/Chromium. Sesi dihapus dari daftar, tapi file lokal akan dibersihkan setelah browser benar-benar tertutup.",
      };
    }

    throw error;
  }
}

function buildWhatsAppStatusResponse(overrides = {}) {
  const runtimeAccount = getWhatsAppAccountInfo();
  const activeMeta = getWhatsAppSessionMeta();

  return {
    success: true,
    activeSessionId,
    sessions: getWhatsAppSessionsSummary(),
    whatsappReady: isWhatsAppReady,
    needScan: !isWhatsAppReady,
    isSending,
    progress: currentSendProgress,
    qr: lastQrString,
    reason: isWhatsAppReady ? "READY" : "NOT_READY",
    meta: {
      initializing: isWhatsAppInitializing,
      lastQrAt,
      hasQr: !!lastQrString,
      event: lastWhatsAppEvent,
    },
    account: {
      number: runtimeAccount.number || activeMeta?.lastKnownNumber || "",
      wid: runtimeAccount.wid || "",
      name: runtimeAccount.name || activeMeta?.lastKnownName || "",
      platform: runtimeAccount.platform || activeMeta?.lastKnownPlatform || "",
    },
    gsheet: getGSheetConfig(),
    lastSendSummary,
    lastSendResults,
    ...overrides,
  };
}

function resetWhatsAppRuntimeState() {
  isWhatsAppReady = false;
  isWhatsAppInitializing = false;
  lastQrString = null;
  lastQrAt = null;
}

async function focusWhatsAppBrowserWindow(timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const page = waClient?.pupPage;
      const browser = waClient?.pupBrowser;

      if (page && browser) {
        const pages = await browser.pages().catch(() => []);

        if (pages.length > 0) {
          const activePage =
            pages.find((browserPage) => browserPage === page) ||
            pages.find((browserPage) =>
              String(browserPage.url() || "").includes("web.whatsapp.com")
            ) ||
            pages[0];

          const currentUrl = String(activePage.url() || "");
          if (!currentUrl || currentUrl === "about:blank") {
            await activePage.goto("https://web.whatsapp.com/", {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            }).catch(() => {});
          }

          await activePage.bringToFront().catch(() => {});
          await activePage.evaluate(() => {
            window.focus();
          }).catch(() => {});

          return true;
        }
      }
    } catch {}

    await sleep(300);
  }

  return false;
}

async function destroyWhatsAppClient() {
  if (!waClient) return;

  const clientToDestroy = waClient;
  waClient = null;
  currentClientSessionId = null;
  currentClientVisible = false;
  currentClientBrowser = "auto";

  try {
    await clientToDestroy.destroy();
  } catch (error) {
    console.error("Gagal destroy WhatsApp client:", error.message);
  }
}

async function logoutWhatsAppClient() {
  if (!waClient) {
    resetWhatsAppRuntimeState();
    return;
  }

  const clientToLogout = waClient;

  try {
    await clientToLogout.logout();
  } catch (error) {
    console.error("Gagal logout WhatsApp client:", error.message);
  }

  await destroyWhatsAppClient();
  resetWhatsAppRuntimeState();
  lastWhatsAppEvent = "logged_out";
}

async function waitForWhatsAppState(timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (
      isWhatsAppReady ||
      lastQrString ||
      lastWhatsAppEvent === "auth_failure" ||
      lastWhatsAppEvent === "error"
    ) {
      break;
    }

    await sleep(250);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function readJsonFile(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeFileName(value = "", fallback = "file") {
  const cleaned = String(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

function getPdfLogo() {
  return readJsonFile(PDF_LOGO_FILE, {
    name: "",
    mimeType: "",
    base64: "",
  });
}

function savePdfLogo({ name = "", mimeType = "", base64 = "" } = {}) {
  const payload = {
    name: String(name || "").trim(),
    mimeType: String(mimeType || "").trim(),
    base64: String(base64 || "").trim(),
  };
  writeJsonFile(PDF_LOGO_FILE, payload);
  return payload;
}

function deletePdfLogo() {
  if (fs.existsSync(PDF_LOGO_FILE)) {
    fs.unlinkSync(PDF_LOGO_FILE);
  }
}

function hasPdfLogo() {
  const logo = getPdfLogo();
  return !!(logo.base64 && logo.mimeType);
}

function getPdfTemporaryData() {
  return readJsonFile(PDF_TEMPORARY_FILE, {
    headers: [],
    rows: [],
    generatedAt: null,
    sourceSheet: "INPUT",
  });
}

function savePdfTemporaryData(data = {}) {
  const payload = {
    headers: Array.isArray(data.headers) ? data.headers : [],
    rows: Array.isArray(data.rows) ? data.rows : [],
    generatedAt: data.generatedAt || new Date().toISOString(),
    sourceSheet: data.sourceSheet || "INPUT",
  };
  writeJsonFile(PDF_TEMPORARY_FILE, payload);
  return payload;
}

function getPdfWorkbookData() {
  return readJsonFile(PDF_WORKBOOK_DATA_FILE, null);
}

function savePdfWorkbookData(data = {}) {
  writeJsonFile(PDF_WORKBOOK_DATA_FILE, { ...data, savedAt: new Date().toISOString() });
}

function getPdfLogData() {
  return readJsonFile(PDF_LOG_FILE, {
    rows: [],
    generatedAt: null,
  });
}

function savePdfLogData(data = {}) {
  const payload = {
    rows: Array.isArray(data.rows) ? data.rows : [],
    generatedAt: data.generatedAt || new Date().toISOString(),
  };
  writeJsonFile(PDF_LOG_FILE, payload);
  return payload;
}

function getPdfProgress() {
  return readJsonFile(PDF_PROGRESS_FILE, {
    running: false,
    current: 0,
    total: 0,
    ptName: "",
    status: "idle",
    step: 0,
    complete: false,
    error: "",
    updatedAt: null,
  });
}

function savePdfProgress(nextData = {}) {
  const current = getPdfProgress();
  const payload = {
    ...current,
    ...nextData,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(PDF_PROGRESS_FILE, payload);
  io.emit("pdf-progress", payload);
  return payload;
}

function getSafePdfProgress() {
  const progress = getPdfProgress();
  if (progress.running && !isPdfGenerating) {
    return savePdfProgress({
      running: false,
      current: 0,
      total: 0,
      ptName: "",
      status: "",
      step: 0,
      complete: false,
      error: "",
    });
  }
  return progress;
}

function createPdfCancelError() {
  const error = new Error("Generate PDF dibatalkan");
  error.code = "PDF_CANCELLED";
  return error;
}

function throwIfPdfCancelRequested() {
  if (isPdfCancelRequested) {
    throw createPdfCancelError();
  }
}

function getTemplate() {
  const data = readJsonFile(TEMPLATE_FILE, {
    template:
      "*TAGIHAN INVOICE*\n\nKepada Yth,\n*{nama}*\n\n💰 *Total Tagihan:* {total}\n📅 *Jatuh Tempo:* {tempo}\n\n📄 *Dokumen Invoice:*\n{pdf}\n\nTerima kasih.",
  });

  return data.template || "";
}

function getGSheetConfig() {
  const data = readJsonFile(GSHEET_FILE, {
    url: "",
    selectedSheet: "",
    autoSync: false,
    lastSyncAt: null,
  });

  return {
    url: data.url || "",
    selectedSheet: data.selectedSheet || "",
    autoSync: !!data.autoSync,
    lastSyncAt: data.lastSyncAt || null,
  };
}

function saveGSheetConfig(newData = {}) {
  const current = getGSheetConfig();
  const merged = {
    ...current,
    ...newData,
  };
  writeJsonFile(GSHEET_FILE, merged);
  return merged;
}

function formatRupiah(value) {
  if (value === null || value === undefined || value === "") return "Rp 0";

  if (typeof value === "string" && value.includes("Rp")) {
    return value;
  }

  const num = Number(String(value).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(num)) return String(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatExcelDate(value) {
  if (!value) return "-";

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return String(value);
}

function normalizePhone(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned) return "";

  if (!cleaned.startsWith("62")) {
    cleaned = cleaned.startsWith("0")
      ? `62${cleaned.slice(1)}`
      : `62${cleaned}`;
  }

  return cleaned;
}

function generateMessage(customer, template) {
  return template
    .replace(/{nama}/g, customer.nama || "-")
    .replace(/{nomor}/g, customer.nomor || "-")
    .replace(/{total}/g, formatRupiah(customer.total))
    .replace(/{tempo}/g, formatExcelDate(customer.tempo))
    .replace(/{pdf}/g, customer.pdf || "")
    .replace(/{drive}/g, customer.drive || "");
}

function emitLog(type, message) {
  io.emit("send-log", {
    type,
    message,
    time: new Date().toISOString(),
  });
}

function normalizeKeys(row = {}) {
  const result = {};
  for (const key of Object.keys(row)) {
    const normalizedKey = String(key || "")
      .trim()
      .toLowerCase();
    result[normalizedKey] = row[key];
  }
  return result;
}

function validateCustomerColumns(data = []) {
  if (!Array.isArray(data) || !data.length) {
    throw new Error("Data kosong");
  }

  const requiredColumns = ["nama", "nomor", "total", "tempo", "pdf"];
  const firstRow = normalizeKeys(data[0]);
  const valid = requiredColumns.every((col) => col in firstRow);

  if (!valid) {
    throw new Error(`Kolom wajib: ${requiredColumns.join(", ")}`);
  }

  return true;
}

function normalizeCustomerData(data = []) {
  return data.map((item) => normalizeKeys(item));
}

function extractSpreadsheetId(url) {
  if (!url || !String(url).trim()) return "";

  const str = String(url).trim();
  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];

  return "";
}

function downloadFileBuffer(fileUrl) {
  return new Promise((resolve, reject) => {
    https
      .get(fileUrl, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          return resolve(downloadFileBuffer(response.headers.location));
        }

        if (response.statusCode !== 200) {
          return reject(
            new Error(`Gagal download Google Sheet. Status: ${response.statusCode}`)
          );
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", (error) => reject(error));
  });
}

function buildGoogleSheetExportUrl(sheetUrl) {
  const spreadsheetId = extractSpreadsheetId(sheetUrl);

  if (!spreadsheetId) {
    throw new Error("URL Google Sheet tidak valid");
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
}

async function loadWorkbookFromGoogleSheet(sheetUrl) {
  const exportUrl = buildGoogleSheetExportUrl(sheetUrl);
  const buffer = await downloadFileBuffer(exportUrl);
  return XLSX.read(buffer, { type: "buffer" });
}

async function getGoogleSheetNames(sheetUrl) {
  const workbook = await loadWorkbookFromGoogleSheet(sheetUrl);
  return workbook.SheetNames || [];
}

function buildSheetPreviewFromWorkbook(workbook, selectedSheet = "") {
  const sheetNames = workbook?.SheetNames || [];

  if (!sheetNames.length) {
    throw new Error("Google Sheet kosong / sheet tidak ditemukan");
  }

  const finalSheetName = sheetNames.includes(selectedSheet) ? selectedSheet : sheetNames[0];
  const sheet = workbook.Sheets[finalSheetName];

  if (!sheet) {
    throw new Error(`Sheet "${finalSheetName}" tidak ditemukan`);
  }

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const headers = Array.isArray(matrix[0]) ? matrix[0].map((cell) => String(cell ?? "")) : [];
  const rows = matrix.slice(1).map((row, rowIndex) => {
    const values = Array.isArray(row) ? row : [];
    const length = Math.max(headers.length, values.length);
    const cells = Array.from({ length }, (_, index) => {
      if (!headers[index]) {
        headers[index] = `Kolom ${index + 1}`;
      }
      return values[index] ?? "";
    });

    return {
      id: `${finalSheetName}-${rowIndex + 1}`,
      rowNumber: rowIndex + 2,
      cells,
    };
  });

  return {
    selectedSheet: finalSheetName,
    sheetNames,
    headers: headers.map((header, index) => header || `Kolom ${index + 1}`),
    rows,
    totalRows: rows.length,
    totalColumns: headers.length,
  };
}

async function loadCustomersFromGoogleSheet({
  url = "",
  selectedSheet = "",
  useSavedSelectedSheet = true,
}) {
  const config = getGSheetConfig();
  const finalUrl = url || config.url || "";

  if (!finalUrl) {
    throw new Error("URL Google Sheet belum disimpan");
  }

  const workbook = await loadWorkbookFromGoogleSheet(finalUrl);
  const sheetNames = workbook.SheetNames || [];

  if (!sheetNames.length) {
    throw new Error("Google Sheet kosong / sheet tidak ditemukan");
  }

  let finalSheetName = selectedSheet || "";

  if (!finalSheetName && useSavedSelectedSheet) {
    finalSheetName = config.selectedSheet || "";
  }

  if (!finalSheetName) {
    finalSheetName = sheetNames[0];
  }

  if (!sheetNames.includes(finalSheetName)) {
    throw new Error(`Sheet "${finalSheetName}" tidak ditemukan`);
  }

  const sheet = workbook.Sheets[finalSheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const data = normalizeCustomerData(rawData);

  validateCustomerColumns(data);

  const savedConfig = saveGSheetConfig({
    url: finalUrl,
    selectedSheet: finalSheetName,
    lastSyncAt: new Date().toISOString(),
  });

  return {
    data,
    selectedSheet: finalSheetName,
    sheetNames,
    config: savedConfig,
  };
}

function getSheetMatrix(workbook, sheetName) {
  const sheet = workbook?.Sheets?.[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" tidak ditemukan`);
  }
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
}

function getCellValue(row = [], index = 0) {
  return Array.isArray(row) ? row[index] ?? "" : "";
}

function parseExcelDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 86400000);
  }
  const text = String(value || "").trim();
  if (!text) return null;

  const ddmmyyyy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    return new Date(
      Number(ddmmyyyy[3]),
      Number(ddmmyyyy[2]) - 1,
      Number(ddmmyyyy[1])
    );
  }

  const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateId(value) {
  const date = parseExcelDate(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatMonthId(value) {
  const date = parseExcelDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function parseNumberish(val) {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return Number.isNaN(val) ? null : val;

  let s = String(val).trim();
  if (!s) return null;
  s = s.replace(/\s/g, "").replace(/Rp/gi, "").replace(/[^0-9,.\-]/g, "");
  if (!s || s === "-" || s === "." || s === ",") return null;

  const commaCount = (s.match(/,/g) || []).length;
  const dotCount = (s.match(/\./g) || []).length;

  if (dotCount >= 1 && commaCount === 1 && s.lastIndexOf(",") > s.lastIndexOf(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  }

  if (commaCount >= 1 && dotCount === 1 && s.lastIndexOf(".") > s.lastIndexOf(",")) {
    s = s.replace(/,/g, "");
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  }

  if (dotCount > 1 && commaCount === 0) {
    s = s.replace(/\./g, "");
  } else if (commaCount > 1 && dotCount === 0) {
    s = s.replace(/,/g, "");
  } else if (dotCount === 1 && commaCount === 0) {
    const parts = s.split(".");
    if (parts[1] && parts[1].length === 3) s = parts[0] + parts[1];
  } else if (commaCount === 1 && dotCount === 0) {
    const parts = s.split(",");
    s = parts[1] && parts[1].length === 3 ? parts[0] + parts[1] : s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeCompanyName(name) {
  if (!name) return "";
  let normalized = String(name).trim().toLowerCase();
  normalized = normalized.replace(/\s+/g, " ").replace(/[.,]/g, "");
  const prefixes = ["pt", "cv", "ud", "fa", "tb", "pn", "perum", "perumnas"];
  const words = normalized.split(" ");
  const lastWord = words[words.length - 1];
  if (prefixes.includes(lastWord) && words.length > 1) {
    normalized = `${lastWord} ${words.slice(0, -1).join(" ")}`;
  }
  return normalized;
}

function buildTemporaryRowsFromWorkbook(workbook) {
  const matrix = getSheetMatrix(workbook, "INPUT");
  if (!matrix.length || matrix.length < 2) {
    throw new Error('Sheet "INPUT" kosong atau tidak ada data');
  }

  const rows = matrix.slice(1).map((row, index) => ({
    noInvoice: getCellValue(row, 0),
    tanggalInvoice: getCellValue(row, 1),
    termin: getCellValue(row, 2),
    tempo: getCellValue(row, 13),
    customer: getCellValue(row, 4),
    tagihan: getCellValue(row, 6),
    penagih: getCellValue(row, 15),
    sourceRow: index + 2,
  }));

  return rows.filter((row) =>
    [row.noInvoice, row.customer, row.tagihan].some((value) => String(value || "").trim())
  );
}

function buildMasterDataLookup(workbook) {
  if (!workbook?.Sheets?.["MASTER DATA"]) return new Map();
  const matrix = getSheetMatrix(workbook, "MASTER DATA");
  if (matrix.length < 2) return new Map();
  const first = String(getCellValue(matrix[0], 0)).toLowerCase();
  const startIndex =
    first.includes("tax") || first.includes("company") || first.includes("nama") ? 1 : 0;
  const map = new Map();

  matrix.slice(startIndex).forEach((row) => {
    const name = String(getCellValue(row, 0) || "").trim();
    if (!name) return;
    map.set(normalizeCompanyName(name), {
      nama: name,
      phone: String(getCellValue(row, 1) || "").trim() || "KOSONG",
      wilayah: String(getCellValue(row, 2) || "").trim() || "KOSONG",
    });
  });

  return map;
}

function findMasterData(masterMap, companyName) {
  const normalized = normalizeCompanyName(companyName);
  if (masterMap.has(normalized)) return masterMap.get(normalized);
  const core = normalized.replace(/^(pt|cv|ud|fa|tb|pn|perum|perumnas)\s+/g, "");
  for (const [key, value] of masterMap.entries()) {
    const keyCore = key.replace(/^(pt|cv|ud|fa|tb|pn|perum|perumnas)\s+/g, "");
    if (core && keyCore && (core === keyCore || core.includes(keyCore) || keyCore.includes(core))) {
      return value;
    }
  }
  return { phone: "TIDAK DITEMUKAN", wilayah: "CEK" };
}

function buildPeriodeSummaryMap(workbook) {
  if (!workbook?.Sheets?.["PERIODE"]) return new Map();
  const matrix = getSheetMatrix(workbook, "PERIODE");
  if (matrix.length < 2) return new Map();
  const result = new Map();

  matrix.slice(1).forEach((row) => {
    const customer = String(getCellValue(row, 1) || "").trim();
    const periode = formatMonthId(getCellValue(row, 3));
    const amount = parseNumberish(getCellValue(row, 7)) || 0;
    if (!customer || !periode) return;

    const key = normalizeCompanyName(customer);
    const current = result.get(key) || {};
    current[periode] = (current[periode] || 0) + amount;
    result.set(key, current);
  });

  return result;
}

function getPeriodeRows(periodeMap, companyName) {
  const normalized = normalizeCompanyName(companyName);
  let summary = periodeMap.get(normalized);
  if (!summary) {
    const core = normalized.replace(/^(pt|cv|ud|fa|tb|pn|perum|perumnas)\s+/g, "");
    for (const [key, value] of periodeMap.entries()) {
      const keyCore = key.replace(/^(pt|cv|ud|fa|tb|pn|perum|perumnas)\s+/g, "");
      if (core && keyCore && (core === keyCore || core.includes(keyCore) || keyCore.includes(core))) {
        summary = value;
        break;
      }
    }
  }
  if (!summary) return [];
  return Object.keys(summary)
    .sort()
    .map((periode) => ({
      periode,
      amount: summary[periode] || 0,
      amountText: formatCurrency(summary[periode] || 0),
    }));
}

function groupTemporaryRowsByCustomer(rows = []) {
  const grouped = new Map();
  rows.forEach((row) => {
    const customer = String(row.customer || "").trim();
    const amount = parseNumberish(row.tagihan) || 0;
    if (!customer || amount <= 0) return;
    if (!grouped.has(customer)) grouped.set(customer, []);
    grouped.get(customer).push({
      noInvoice: row.noInvoice || "-",
      tanggalInvoice: row.tanggalInvoice,
      termin: row.termin || "-",
      tempo: row.tempo,
      tagihan: amount,
      penagih: row.penagih || "-",
    });
  });
  return grouped;
}

function getClosestTempo(invoices = []) {
  let closest = null;
  invoices.forEach((invoice) => {
    const date = parseExcelDate(invoice.tempo);
    if (!date || Number.isNaN(date.getTime())) return;
    if (!closest || date.getTime() < closest.getTime()) {
      closest = date;
    }
  });
  return closest;
}

function buildLogoDataUrl() {
  const logo = getPdfLogo();
  if (!logo.base64 || !logo.mimeType) return "";
  return `data:${logo.mimeType};base64,${logo.base64}`;
}

function getDriveConfig() {
  return readJsonFile(PDF_DRIVE_CONFIG_FILE, { folderId: "", enabled: false, scriptUrl: "" });
}

function saveDriveConfig(data = {}) {
  writeJsonFile(PDF_DRIVE_CONFIG_FILE, { ...getDriveConfig(), ...data });
}

function httpPostFollowRedirects(urlStr, payload, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const bodyBuffer = Buffer.from(payload, "utf8");

    const doGet = (currentUrl, left) => {
      const u = new URL(currentUrl);
      const mod = u.protocol === "https:" ? https : http;
      const req = mod.request(
        { hostname: u.hostname, path: u.pathname + u.search, method: "GET" },
        (res) => {
          if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            res.resume();
            if (left <= 0) return reject(new Error("Too many redirects"));
            doGet(res.headers.location, left - 1);
            return;
          }
          let data = "";
          res.on("data", (c) => { data += c; });
          res.on("end", () => resolve(data));
          res.on("error", reject);
        }
      );
      req.on("error", reject);
      req.end();
    };

    const u = new URL(urlStr);
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": bodyBuffer.length } },
      (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          // Apps Script memproses POST di request pertama lalu redirect ke URL response — follow sebagai GET
          doGet(res.headers.location, maxRedirects - 1);
          return;
        }
        let data = "";
        res.on("data", (c) => { data += c; });
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function uploadToDrive(filePath, fileName) {
  const config = getDriveConfig();
  if (!config.scriptUrl) throw new Error("Apps Script URL belum dikonfigurasi");
  const payload = JSON.stringify({
    fileName,
    base64: fs.readFileSync(filePath).toString("base64"),
    folderId: config.folderId || "",
  });
  const responseText = await httpPostFollowRedirects(config.scriptUrl, payload);
  emitLog("log", `[Drive] Raw response: ${responseText.substring(0, 300)}`);
  let result;
  try { result = JSON.parse(responseText); } catch { throw new Error(`Response tidak valid dari Apps Script: ${responseText.substring(0, 200)}`); }
  if (!result.success) throw new Error(result.error || "Upload ke Drive gagal");
  return result.url || `https://drive.google.com/file/d/${result.id}/view`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPdfHtml({ customer, invoices, periodeRows, logoDataUrl }) {
  const total = invoices.reduce((sum, item) => sum + (item.tagihan || 0), 0);
  const now = new Date();
  const printDate = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const printTime = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const closestTempo = getClosestTempo(invoices);
  const closestTempoStr = closestTempo ? formatDateId(closestTempo) : "-";

  const invoiceRowsHtml = invoices.map((inv, i) => `
    <tr>
      <td class="no">${i + 1}</td>
      <td class="inv">${escapeHtml(inv.noInvoice || "-")}</td>
      <td class="date">${escapeHtml(formatDateId(inv.tanggalInvoice))}</td>
      <td class="center">${escapeHtml(inv.termin || "-")}</td>
      <td class="date">${escapeHtml(formatDateId(inv.tempo))}</td>
      <td class="amt">${escapeHtml(formatCurrency(inv.tagihan))}</td>
    </tr>`).join("");

  const periodeRowsHtml = periodeRows.map((item) => `
    <tr>
      <td>${escapeHtml(item.periode)}</td>
      <td class="amt-g">${escapeHtml(item.amountText)}</td>
    </tr>`).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#18181b;background:#fff;font-size:13px;line-height:1.65;padding:28px 32px}

    .hdr{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:14px;border-bottom:2.5px solid #27272a;margin-bottom:22px}
    .hdr-logo{display:flex;flex-direction:row;align-items:center;gap:11px}
    .hdr-logo img{max-width:54px;max-height:54px;object-fit:contain;object-position:center;display:block;flex-shrink:0}
    .hdr-logo-texts{display:flex;flex-direction:column;gap:3px}
    .hdr-logo-name{font-size:15px;font-weight:800;color:#18181b;letter-spacing:-.02em;line-height:1.2}
    .hdr-logo-sub{font-size:10.5px;color:#71717a}
    .hdr-right{text-align:right}
    .hdr-right .doc-type{font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.12em;margin-bottom:4px}
    .hdr-right .doc-title{font-size:26px;font-weight:800;color:#18181b;letter-spacing:-.03em;line-height:1}
    .hdr-right .doc-date{font-size:10.5px;color:#71717a;margin-top:6px}

    .info-row{display:flex;justify-content:space-between;margin-bottom:20px}
    .info-block .ib-label{font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px}
    .info-block .ib-value{font-size:15px;font-weight:700;color:#18181b}
    .info-block .ib-sub{font-size:10.5px;color:#71717a;margin-top:3px}
    .info-block.right{text-align:right}

    .total-bar{background:#1e293b;border-radius:6px;padding:15px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
    .tb-label{font-size:9px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}
    .tb-amount{font-size:25px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1}
    .tb-sub{font-size:10px;color:rgba(255,255,255,.45);margin-top:5px}
    .tb-count{text-align:center;padding:9px 18px;background:rgba(255,255,255,.09);border-radius:5px;color:rgba(255,255,255,.65);font-size:10px;font-weight:600}
    .tb-count span{display:block;font-size:24px;font-weight:800;color:#fff;line-height:1;margin-bottom:3px}

    .sec-label{font-size:9px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:9px}

    table{width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px}
    thead th{font-size:9px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:.08em;padding:0 10px 9px;text-align:left;border-bottom:1.5px solid #e4e4e7}
    tbody td{padding:9px 10px;border-bottom:1px solid #f4f4f5;color:#3f3f46;vertical-align:middle}
    tbody tr:last-child td{border-bottom:1.5px solid #e4e4e7}
    td.no{color:#d4d4d8;font-size:10px;width:22px;padding-left:2px}
    td.inv{font-weight:700;color:#27272a;font-family:monospace;font-size:12px;white-space:nowrap}
    td.date{color:#52525b;font-size:11.5px;white-space:nowrap;width:84px}
    td.center{text-align:center;width:54px;color:#52525b}
    td.amt{text-align:right;font-weight:700;color:#18181b;width:132px;white-space:nowrap}
    td.amt-g{text-align:right;font-weight:700;color:#18181b;white-space:nowrap}
    .trow td{background:#f4f4f5;font-weight:700;color:#18181b;border-top:1.5px solid #e4e4e7;border-bottom:none;font-size:12.5px}
    .trow .amt{font-size:13px}

    .footer{display:flex;justify-content:space-between;align-items:flex-end;padding-top:13px;border-top:1.5px solid #e4e4e7;margin-top:6px}
    .footer-left{display:flex;flex-direction:column;gap:2px}
    .footer-auto{font-size:10px;font-weight:600;color:#52525b}
    .footer-brand{font-size:9.5px;color:#a1a1aa}
    .footer-time{font-size:10px;color:#71717a;font-family:monospace;text-align:right}
  </style>
</head>
<body>
  <div class="hdr">
    <div class="hdr-logo">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="logo" />` : ""}
      <div class="hdr-logo-texts">
        <div class="hdr-logo-name">PT Pilar Niaga Makmur</div>
        <div class="hdr-logo-sub">Statement Tagihan Pelanggan</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="doc-type">Dokumen Tagihan</div>
      <div class="doc-title">TAGIHAN</div>
      <div class="doc-date">${escapeHtml(printDate)}, ${escapeHtml(printTime)} WIB</div>
    </div>
  </div>

  <div class="info-row">
    <div class="info-block">
      <div class="ib-label">Kepada Yth.</div>
      <div class="ib-value">${escapeHtml(customer)}</div>
    </div>
    <div class="info-block right">
      <div class="ib-label">Jatuh Tempo Terdekat</div>
      <div class="ib-value">${escapeHtml(closestTempoStr)}</div>
      <div class="ib-sub">${invoices.length} invoice</div>
    </div>
  </div>

  <div class="total-bar">
    <div>
      <div class="tb-label">Total Yang Harus Dibayar</div>
      <div class="tb-amount">${escapeHtml(formatCurrency(total))}</div>
      ${closestTempo ? `<div class="tb-sub">Jatuh tempo: ${escapeHtml(closestTempoStr)}</div>` : ""}
    </div>
    <div class="tb-count"><span>${invoices.length}</span>Invoice</div>
  </div>

  <div class="sec-label">Detail Invoice</div>
  <table>
    <thead>
      <tr>
        <th style="width:22px"></th>
        <th>Nomor Invoice</th>
        <th style="width:80px">Tgl Invoice</th>
        <th style="width:54px;text-align:center">Termin</th>
        <th style="width:80px">Jatuh Tempo</th>
        <th style="width:128px;text-align:right">Jumlah Tagihan</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceRowsHtml}
      <tr class="trow">
        <td colspan="5" style="text-align:right;color:#a1a1aa;font-size:8.5px">Total Tagihan</td>
        <td class="amt">${escapeHtml(formatCurrency(total))}</td>
      </tr>
    </tbody>
  </table>

  ${periodeRows.length ? `
  <div class="sec-label">Riwayat per Periode</div>
  <table>
    <thead><tr><th>Periode</th><th style="text-align:right">Jumlah</th></tr></thead>
    <tbody>${periodeRowsHtml}</tbody>
  </table>` : ""}

  <div class="footer">
    <div class="footer-left">
      <div class="footer-auto">Dicetak otomatis oleh sistem</div>
      <div class="footer-brand">PT Pilar Niaga Makmur</div>
    </div>
    <div class="footer-time">${escapeHtml(printDate)}, ${escapeHtml(printTime)} WIB</div>
  </div>
</body>
</html>`;
}
async function renderPdfFile(outputPath, html, sharedBrowser = null) {
  ensureDir(path.dirname(outputPath));
  const ownBrowser = !sharedBrowser;
  const pdfExecPath = resolveBrowserExecutablePath("auto");
  const browser = ownBrowser
    ? await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        ...(pdfExecPath ? { executablePath: pdfExecPath } : {}),
      })
    : sharedBrowser;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
    await page.close();
  } finally {
    if (ownBrowser) await browser.close();
  }
}

async function buildPdfTemporaryFromGoogleSheet() {
  const config = getGSheetConfig();
  if (!config.url) throw new Error("URL Google Sheet belum disimpan");
  const workbook = await loadWorkbookFromGoogleSheet(config.url);
  const rows = buildTemporaryRowsFromWorkbook(workbook);
  const masterMap = buildMasterDataLookup(workbook);
  const periodeMap = buildPeriodeSummaryMap(workbook);
  const masterData = {};
  for (const [k, v] of masterMap) masterData[k] = v;
  const periodeData = {};
  for (const [k, v] of periodeMap) periodeData[k] = v;
  savePdfWorkbookData({ rows, masterData, periodeData });
  const previewRows = rows.map((row) => ({
    noInvoice: row.noInvoice || "",
    tanggalInvoice: formatDateId(row.tanggalInvoice),
    termin: row.termin || "",
    tempo: formatDateId(row.tempo),
    customer: row.customer || "",
    tagihan: parseNumberish(row.tagihan) || 0,
    penagih: row.penagih || "",
  }));
  return savePdfTemporaryData({
    headers: ["No Invoice", "Tanggal Invoice", "Termin", "Tempo", "Customer", "Tagihan", "Penagih"],
    rows: previewRows,
    sourceSheet: "Google Sheet",
  });
}

async function generatePdfPerPtJob() {
  let saved = getPdfWorkbookData();
  // Fallback: jika workbookData kosong, coba pakai temporaryData
  if (!saved || !Array.isArray(saved.rows) || !saved.rows.length) {
    const tmp = getPdfTemporaryData();
    if (Array.isArray(tmp.rows) && tmp.rows.length) {
      saved = { rows: tmp.rows, masterData: {}, periodeData: {} };
    } else {
      throw new Error("Upload file Excel atau sync Google Sheet terlebih dahulu");
    }
  }

  const temporaryRows = saved.rows;
  const masterMap = new Map(Object.entries(saved.masterData || {}));
  const periodeMap = new Map(Object.entries(saved.periodeData || {}));
  const grouped = groupTemporaryRowsByCustomer(temporaryRows);
  const logoDataUrl = buildLogoDataUrl();
  const customers = [...grouped.keys()];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logRows = [];
  const driveConfig = getDriveConfig();
  const useDrive = driveConfig.enabled && !!driveConfig.scriptUrl && !!driveConfig.folderId;

  savePdfProgress({
    running: true,
    current: 0,
    total: customers.length,
    ptName: "Menyiapkan generate PDF",
    status: "Menyiapkan data",
    step: 1,
    complete: false,
    error: "",
  });

  // Launch satu browser untuk semua PDF (jauh lebih cepat)
  const pdfExecPath = resolveBrowserExecutablePath("auto");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(pdfExecPath ? { executablePath: pdfExecPath } : {}),
  });

  try {
    for (let index = 0; index < customers.length; index += 1) {
      throwIfPdfCancelRequested();
      const customer = customers[index];
      const invoices = grouped.get(customer) || [];
      const periodRows = getPeriodeRows(periodeMap, customer);
      const totalTagihan = invoices.reduce((sum, item) => sum + (item.tagihan || 0), 0);
      const master = findMasterData(masterMap, customer);
      const outputFolderName = sanitizeFileName(customer, "UNKNOWN");
      const outputDir = path.join(PDF_OUTPUT_DIR, outputFolderName);
      const fileName = `Tagihan_${outputFolderName}_${timestamp}.pdf`;
      const outputPath = path.join(outputDir, fileName);

      savePdfProgress({
        running: true,
        current: index + 1,
        total: customers.length,
        ptName: customer,
        status: "Membuat PDF",
        step: 3,
        complete: false,
        error: "",
      });

      const html = buildPdfHtml({ customer, invoices, periodeRows: periodRows, logoDataUrl });
      await renderPdfFile(outputPath, html, browser);

      let driveUrl = null;
      let driveError = "";
      let localPdf = `/generated/pdfs/${encodeURIComponent(outputFolderName)}/${encodeURIComponent(fileName)}`;
      if (useDrive) {
        throwIfPdfCancelRequested();
        try {
          savePdfProgress({ running: true, current: index + 1, total: customers.length, ptName: customer, status: "Upload ke Google Drive", step: 3, complete: false, error: "" });
          driveUrl = await uploadToDrive(outputPath, fileName);
          // Upload berhasil — hapus file lokal, simpan di Drive saja
          try { fs.unlinkSync(outputPath); } catch (_) {}
          localPdf = null;
        } catch (driveErr) {
          driveError = driveErr.message || "Upload ke Drive gagal";
          emitLog("error", `Upload Drive gagal untuk ${customer}: ${driveErr.message}`);
          // Upload gagal — tetap simpan lokal sebagai fallback
        }
      }

      const closestTempo = getClosestTempo(invoices);
      logRows.push({
        nama: customer,
        total: formatCurrency(totalTagihan),
        tempo: closestTempo ? formatDateId(closestTempo) : "-",
        pdf: localPdf,
        driveUrl,
        driveError,
        nomor: master.phone,
        wilayah: master.wilayah,
      });

      savePdfLogData({
        rows: logRows,
      });
      io.emit("pdf-log-updated", { count: logRows.length });
    }
  } finally {
    await browser.close();
  }

  savePdfLogData({
    rows: logRows,
  });

  savePdfProgress({
    running: false,
    current: customers.length,
    total: customers.length,
    ptName: "Selesai",
    status: "Semua PDF berhasil dibuat",
    step: 4,
    complete: true,
    error: "",
  });

  return logRows;
}

function killOrphanedBrowserProcesses(sessionId) {
  const sessionDir = getWhatsAppSessionDir(sessionId);
  try {
    const escapedPath = sessionDir.replace(/\\/g, "\\\\");
    const browserProcessNames = ["chrome.exe", "msedge.exe"];
    const pids = [];

    for (const processName of browserProcessNames) {
      const cmd = `wmic process where "Name='${processName}' and CommandLine like '%${escapedPath}%'" get ProcessId /format:csv 2>nul`;
      const output = execSync(cmd, { encoding: "utf8", timeout: 5000 });
      const foundPids = output
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("Node"))
        .map((line) => {
          const parts = line.split(",");
          return parseInt(parts[parts.length - 1], 10);
        })
        .filter((pid) => !isNaN(pid) && pid > 0);

      pids.push(...foundPids);
    }

    for (const pid of [...new Set(pids)]) {
      try {
        execSync(`taskkill /PID ${pid} /F /T 2>nul`, { timeout: 3000 });
        console.log(`Killed orphaned browser process PID: ${pid} for session: ${sessionId}`);
      } catch (killErr) {}
    }

    if (pids.length > 0) {
      execSync("ping -n 2 127.0.0.1 >nul", { timeout: 5000 });
    }
  } catch (error) {
    console.warn(`Could not check for orphaned browser processes: ${error.message}`);
  }
}

function cleanupBrowserLockFiles(sessionId) {
  const sessionDir = getWhatsAppSessionDir(sessionId);
  const lockFiles = ["SingletonLock", "SingletonSocket", "SingletonCookie"];

  for (const lockFile of lockFiles) {
    const lockPath = path.join(sessionDir, lockFile);
    try {
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
        console.log(`Cleaned up lock file: ${lockPath}`);
      }
    } catch (error) {
      console.warn(`Could not remove lock file ${lockPath}: ${error.message}`);
    }
  }
}

function buildWhatsAppClient(sessionId, options = {}) {
  killOrphanedBrowserProcesses(sessionId);
  cleanupBrowserLockFiles(sessionId);

  const visible = options.visible === true;
  const browserTarget = normalizeBrowserTarget(options.browser);
  const executablePath = resolveBrowserExecutablePath(browserTarget);
  const puppeteerOptions = {
    headless: !visible,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
  };

  if (executablePath) {
    puppeteerOptions.executablePath = executablePath;
  }

  return new Client({
    authStrategy: new LocalAuth({
      dataPath: SESSION_DIR,
      clientId: `wa-sender-${sessionId}`,
    }),
    webVersionCache: {
      type: "none",
    },
    puppeteer: puppeteerOptions,
  });
}

async function initWhatsAppClient(options = {}) {
  const requestedSessionId = resolveSessionId(options.sessionId);
  if (!requestedSessionId) {
    throw new Error("Session WhatsApp belum dipilih");
  }

  const requestedLabel =
    String(options.label || getWhatsAppSessionMeta(requestedSessionId)?.label || "").trim() ||
    requestedSessionId;
  const requestedVisible =
    typeof options.visible === "boolean" ? options.visible : currentClientVisible;
  const requestedBrowser =
    options.browser !== undefined
      ? normalizeBrowserTarget(options.browser)
      : currentClientBrowser;
  const shouldForceReopen = options.forceReopen === true;

  const shouldSwitchSession =
    currentClientSessionId && currentClientSessionId !== requestedSessionId;
  const shouldRebuildForBrowserMode =
    !!waClient &&
    currentClientSessionId === requestedSessionId &&
    (currentClientVisible !== requestedVisible ||
      (requestedVisible && currentClientBrowser !== requestedBrowser));

  if (shouldSwitchSession || shouldRebuildForBrowserMode || shouldForceReopen) {
    await destroyWhatsAppClient();
    resetWhatsAppRuntimeState();
  }

  activeSessionId = requestedSessionId;

  if (!options.deferSessionPersist) {
    persistWhatsAppSessionMeta(requestedSessionId, {
      label: requestedLabel,
      setActive: true,
      lastUsedAt: new Date().toISOString(),
    });
  }

  if (waClient && isWhatsAppReady && !shouldForceReopen) {
    return waClient;
  }

  if (isWhatsAppInitializing && !shouldForceReopen) {
    return waClient;
  }

  if (waClient && lastQrString && currentClientSessionId === requestedSessionId && !shouldForceReopen) {
    return waClient;
  }

  if (waClient && !isWhatsAppReady) {
    await destroyWhatsAppClient();
    resetWhatsAppRuntimeState();
  }

  isWhatsAppInitializing = true;
  lastWhatsAppEvent = "initializing";

  if (!waClient) {
    waClient = buildWhatsAppClient(requestedSessionId, {
      visible: requestedVisible,
      browser: requestedBrowser,
    });
    currentClientSessionId = requestedSessionId;
    currentClientVisible = requestedVisible;
    currentClientBrowser = requestedBrowser;

    let qrRefreshCount = 0;

    waClient.on("qr", (qr) => {
      qrRefreshCount += 1;
      lastQrString = qr;
      lastQrAt = new Date().toISOString();
      isWhatsAppReady = false;
      isWhatsAppInitializing = false;
      lastWhatsAppEvent = "qr";

      qrcode.generate(qr, { small: true });

      if (qrRefreshCount === 1) {
        emitLog("info", "QR WhatsApp siap, silakan scan");
      }

      io.emit("wa-qr", {
        sessionId: requestedSessionId,
        qr,
        time: lastQrAt,
        isRefresh: qrRefreshCount > 1,
      });
    });

    waClient.on("ready", () => {
      const account = getWhatsAppAccountInfo();
      isWhatsAppReady = true;
      isWhatsAppInitializing = false;
      lastQrString = null;
      lastQrAt = null;
      lastWhatsAppEvent = "ready";
      persistWhatsAppSessionMeta(requestedSessionId, {
        label: buildWhatsAppSessionLabel(account, requestedLabel),
        lastKnownNumber: account.number,
        lastKnownName: account.name,
        lastKnownPlatform: account.platform,
        setActive: true,
        lastUsedAt: new Date().toISOString(),
      });

      emitLog("success", "WhatsApp Web sudah login dan siap dipakai");
      io.emit("wa-ready", {
        sessionId: requestedSessionId,
        ready: true,
        time: new Date().toISOString(),
        account,
        sessions: getWhatsAppSessionsSummary(),
      });
    });

    waClient.on("authenticated", () => {
      isWhatsAppInitializing = true;
      lastWhatsAppEvent = "authenticated";
      emitLog("success", "WhatsApp berhasil diautentikasi");
      io.emit("wa-authenticated", {
        sessionId: requestedSessionId,
        authenticated: true,
        time: new Date().toISOString(),
      });
    });

    waClient.on("auth_failure", (msg) => {
      const failedClient = waClient;
      waClient = null;
      currentClientSessionId = null;
      resetWhatsAppRuntimeState();
      lastWhatsAppEvent = "auth_failure";
      emitLog("error", `Autentikasi WhatsApp gagal: ${msg || "-"}`);
      if (failedClient) {
        failedClient.destroy().catch((e) => console.error("Destroy after auth_failure:", e.message));
      }
    });

    waClient.on("disconnected", (reason) => {
      const disconnectedClient = waClient;
      waClient = null;
      currentClientSessionId = null;
      resetWhatsAppRuntimeState();
      lastWhatsAppEvent = "disconnected";
      emitLog("error", `WhatsApp terputus: ${reason || "-"}`);
      if (disconnectedClient) {
        disconnectedClient.destroy().catch((e) => console.error("Destroy after disconnect:", e.message));
      }
    });

    waClient.on("message", async (msg) => {
      try {
        const chatId = msg.from;
        const contact = await msg.getContact().catch(() => null);
        const name = contact?.pushname || contact?.name || contact?.number || chatId.replace("@c.us", "");
        const phone = chatId.replace("@c.us", "").replace("@g.us", "");
        const entry = storeMessage(chatId, name, phone, msg);
        const chat = chatHistory.get(chatId);
        io.emit("chat:new-message", { chatId, name, phone, message: entry, unread: chat.unread });
      } catch (e) {
        console.error("chat message handler error:", e.message);
      }
    });

    waClient.on("message_create", async (msg) => {
      if (!msg.fromMe) return;
      try {
        const chatId = msg.to;
        const contact = await msg.getContact().catch(() => null);
        const name = contact?.pushname || contact?.name || contact?.number || chatId.replace("@c.us", "");
        const phone = chatId.replace("@c.us", "").replace("@g.us", "");
        const entry = storeMessage(chatId, name, phone, msg);
        io.emit("chat:new-message", { chatId, name, phone, message: entry, unread: 0 });
      } catch (e) {
        console.error("chat message_create handler error:", e.message);
      }
    });

    try {
      await waClient.initialize();
    } catch (error) {
      console.error("WhatsApp initialize() failed:", error.message);
    try {
      await destroyWhatsAppClient();
    } catch (destroyErr) {
      console.error("Failed to destroy client after init error:", destroyErr.message);
      waClient = null;
      currentClientSessionId = null;
    }
    clearWhatsAppWebCache();
    resetWhatsAppRuntimeState();
    lastWhatsAppEvent = "error";
    throw error;
  }
  }

  return waClient;
}

async function ensureWhatsAppStable() {
  if (!waClient) {
    await initWhatsAppClient();
  }

  if (!isWhatsAppReady) {
    throw new Error("WhatsApp belum login / belum siap");
  }

  return true;
}

async function sendSingleMessage(customer) {
  const phone = normalizePhone(customer.nomor);
  if (!phone) {
    throw new Error("Nomor tidak valid");
  }

  await ensureWhatsAppStable();

  const template = getTemplate();
  const message = generateMessage(customer, template);
  const chatId = `${phone}@c.us`;

  const numberId = await waClient.getNumberId(phone);
  if (!numberId) {
    throw new Error("Nomor tidak terdaftar di WhatsApp");
  }

  await waClient.sendMessage(chatId, message);

  await sleep(randomBetween(500, 1200));
  return true;
}

async function sendPdfToCustomer(row) {
  const phone = normalizePhone(row.nomor);
  if (!phone) throw new Error("Nomor tidak valid");
  await ensureWhatsAppStable();
  const chatId = `${phone}@c.us`;
  const numberId = await waClient.getNumberId(phone);
  if (!numberId) throw new Error("Nomor tidak terdaftar di WhatsApp");
  const template = getTemplate();
  const driveLink = String(row.driveUrl || "").trim();
  const pdfPlaceholder = driveLink && !template.includes("{drive}") ? driveLink : "(terlampir)";
  let caption = generateMessage(
    {
      nama: row.nama,
      nomor: row.nomor,
      total: row.total,
      tempo: row.tempo,
      pdf: pdfPlaceholder,
      drive: driveLink,
    },
    template
  );

  if (row.pdf) {
    const pdfRelUrl = row.pdf.replace(/^\/generated\//, "");
    const filePath = path.join(GENERATED_DIR, ...pdfRelUrl.split("/").map(decodeURIComponent));
    if (fs.existsSync(filePath)) {
      const base64Data = fs.readFileSync(filePath).toString("base64");
      const media = new MessageMedia("application/pdf", base64Data, path.basename(filePath));
      await waClient.sendMessage(chatId, media, { caption });
    } else {
      await waClient.sendMessage(chatId, caption);
    }
  } else {
    await waClient.sendMessage(chatId, caption);
  }

  await sleep(randomBetween(500, 1200));
  return true;
}

async function sendWithRetry(customer, retryCount = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      emitLog(
        "info",
        `Mencoba kirim ke ${customer.nama || "-"} (${attempt}/${retryCount})`
      );

      await sendSingleMessage(customer);

      return {
        success: true,
        attempt,
      };
    } catch (error) {
      lastError = error;

      emitLog(
        "error",
        `Percobaan ${attempt} gagal ke ${customer.nama || "-"}: ${error.message}`
      );

      if (attempt < retryCount) {
        await sleep(randomBetween(700, 1500));
      }
    }
  }

  throw lastError || new Error("Gagal mengirim pesan");
}

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST_DIR, "index.html"));
});

app.get("/api/status", async (req, res) => {
  res.json(buildWhatsAppStatusResponse());
});

app.get("/api/template", (req, res) => {
  res.json({
    success: true,
    template: getTemplate(),
  });
});

app.post("/api/template", (req, res) => {
  const { template } = req.body;

  if (!template || !template.trim()) {
    return res.status(400).json({
      success: false,
      message: "Template tidak boleh kosong",
    });
  }

  writeJsonFile(TEMPLATE_FILE, { template });

  return res.json({
    success: true,
    message: "Template berhasil disimpan",
  });
});

app.get("/api/gsheet", (req, res) => {
  const config = getGSheetConfig();

  res.json({
    success: true,
    ...config,
  });
});

app.post("/api/gsheet", (req, res) => {
  const { url, selectedSheet = "", autoSync = false } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({
      success: false,
      message: "URL Google Sheets tidak boleh kosong",
    });
  }

  const spreadsheetId = extractSpreadsheetId(url);
  if (!spreadsheetId) {
    return res.status(400).json({
      success: false,
      message: "URL Google Sheet tidak valid",
    });
  }

  const saved = saveGSheetConfig({
    url: String(url).trim(),
    selectedSheet: String(selectedSheet || "").trim(),
    autoSync: !!autoSync,
  });

  return res.json({
    success: true,
    message: "URL Google Sheets berhasil disimpan",
    config: saved,
  });
});

app.get("/api/gsheet/sheets", async (req, res) => {
  try {
    const config = getGSheetConfig();

    if (!config.url) {
      return res.status(400).json({
        success: false,
        message: "URL Google Sheet belum disimpan",
      });
    }

    const sheetNames = await getGoogleSheetNames(config.url);

    return res.json({
      success: true,
      sheets: sheetNames,
      selectedSheet: config.selectedSheet || (sheetNames[0] || ""),
      autoSync: config.autoSync,
      url: config.url,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/gsheet/preview", async (req, res) => {
  try {
    const config = getGSheetConfig();
    const requestedSheet = String(req.query.selectedSheet || "").trim();

    if (!config.url) {
      return res.status(400).json({
        success: false,
        message: "URL Google Sheet belum disimpan",
      });
    }

    const workbook = await loadWorkbookFromGoogleSheet(config.url);
    const preview = buildSheetPreviewFromWorkbook(
      workbook,
      requestedSheet || config.selectedSheet || ""
    );

    const saved = saveGSheetConfig({
      selectedSheet: preview.selectedSheet,
    });

    return res.json({
      success: true,
      url: config.url,
      autoSync: config.autoSync,
      lastSyncAt: saved.lastSyncAt || config.lastSyncAt || null,
      ...preview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/gsheet/select-sheet", async (req, res) => {
  try {
    const { selectedSheet } = req.body;
    const config = getGSheetConfig();

    if (!config.url) {
      return res.status(400).json({
        success: false,
        message: "URL Google Sheet belum disimpan",
      });
    }

    if (!selectedSheet || !String(selectedSheet).trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama sheet harus dipilih",
      });
    }

    const sheetNames = await getGoogleSheetNames(config.url);
    const finalSheet = String(selectedSheet).trim();

    if (!sheetNames.includes(finalSheet)) {
      return res.status(400).json({
        success: false,
        message: `Sheet "${finalSheet}" tidak ditemukan`,
      });
    }

    const saved = saveGSheetConfig({
      selectedSheet: finalSheet,
    });

    return res.json({
      success: true,
      message: "Sheet berhasil dipilih",
      config: saved,
      sheets: sheetNames,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/gsheet/sync", async (req, res) => {
  try {
    const { selectedSheet = "" } = req.body || {};

    const result = await loadCustomersFromGoogleSheet({
      selectedSheet: String(selectedSheet || "").trim(),
    });

    emitLog(
      "success",
      `Sync Google Sheet berhasil dari sheet "${result.selectedSheet}" dengan ${result.data.length} data`
    );

    return res.json({
      success: true,
      message: `Berhasil sync ${result.data.length} pelanggan dari Google Sheet`,
      data: result.data,
      selectedSheet: result.selectedSheet,
      sheets: result.sheetNames,
      autoSync: result.config.autoSync,
      lastSyncAt: result.config.lastSyncAt,
      url: result.config.url,
    });
  } catch (error) {
    emitLog("error", `Sync Google Sheet gagal: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/load-customers", async (req, res) => {
  try {
    const { source = "manual", selectedSheet = "" } = req.body || {};

    if (source !== "gsheet") {
      return res.status(400).json({
        success: false,
        message: "Source tidak valid. Gunakan 'gsheet'.",
      });
    }

    const result = await loadCustomersFromGoogleSheet({
      selectedSheet: String(selectedSheet || "").trim(),
    });

    return res.json({
      success: true,
      source: "gsheet",
      message: `Berhasil memuat ${result.data.length} pelanggan dari Google Sheet`,
      data: result.data,
      selectedSheet: result.selectedSheet,
      sheets: result.sheetNames,
      autoSync: result.config.autoSync,
      lastSyncAt: result.config.lastSyncAt,
      url: result.config.url,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/gsheet/input", async (req, res) => {
  try {
    const config = getGSheetConfig();
    if (!config.url) {
      return res.status(400).json({ success: false, message: "URL Google Sheet belum disimpan" });
    }
    const workbook = await loadWorkbookFromGoogleSheet(config.url);
    const matrix = getSheetMatrix(workbook, "INPUT");
    if (!matrix.length) return res.json({ success: true, headers: [], rows: [] });

    // Build headers from first row — skip columns with no header text
    const rawHeaders = matrix[0];
    const headers = [];
    rawHeaders.forEach((cell, i) => {
      const label = String(cell ?? "").trim();
      if (label) headers.push({ key: `c${i}`, label, colIndex: i });
    });

    // Data rows — skip fully-empty rows
    const rows = matrix.slice(1)
      .filter(row => headers.some(h => String(row[h.colIndex] ?? "").trim()))
      .map(row => {
        const obj = {};
        headers.forEach(h => { obj[h.key] = row[h.colIndex] ?? ""; });
        return obj;
      });

    // Column mapping used for PDF generation (col index → pdf field)
    const pdfMapping = { noInvoice: "c0", tanggalInvoice: "c1", termin: "c2", customer: "c4", tagihan: "c6", tempo: "c13", penagih: "c15" };

    // Format date columns so they display as "dd/mm/yyyy" instead of Excel serial numbers
    const dateColKeys = new Set([pdfMapping.tanggalInvoice, pdfMapping.tempo]);
    const formattedRows = rows.map(row => {
      const r = { ...row };
      dateColKeys.forEach(k => {
        if (r[k] !== undefined && r[k] !== "") r[k] = formatDateId(r[k]);
      });
      return r;
    });

    return res.json({ success: true, headers, rows: formattedRows, pdfMapping });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/gsheet/periode", async (req, res) => {
  try {
    const config = getGSheetConfig();
    if (!config.url) {
      return res.status(400).json({ success: false, message: "URL Google Sheet belum disimpan" });
    }
    const workbook = await loadWorkbookFromGoogleSheet(config.url);
    const matrix = getSheetMatrix(workbook, "PERIODE");
    if (!matrix.length) return res.json({ success: true, headers: [], rows: [] });

    const rawHeaders = matrix[0];
    const headers = [];
    rawHeaders.forEach((cell, i) => {
      const label = String(cell ?? "").trim();
      if (label) headers.push({ key: `c${i}`, label, colIndex: i });
    });

    // c3 = periode (month/year); other numbers in Excel date range → dd/mm/yyyy
    const monthColKey = "c3";
    const isExcelDateSerial = (v) => typeof v === "number" && v > 30000 && v < 100000 && Number.isInteger(v);

    const rows = matrix.slice(1)
      .filter(row => headers.some(h => String(row[h.colIndex] ?? "").trim()))
      .map(row => {
        const obj = {};
        headers.forEach(h => {
          const raw = row[h.colIndex] ?? "";
          if (isExcelDateSerial(raw)) {
            obj[h.key] = h.key === monthColKey ? formatMonthId(raw) : formatDateId(raw);
          } else {
            obj[h.key] = raw;
          }
        });
        return obj;
      });

    return res.json({ success: true, headers, rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/pdf/status", (req, res) => {
  res.json({
    success: true,
    hasLogo: hasPdfLogo(),
    progress: getSafePdfProgress(),
  });
});

app.get("/api/pdf/temporary", (req, res) => {
  res.json({
    success: true,
    ...getPdfTemporaryData(),
  });
});

app.post("/api/masterdata/sync", async (req, res) => {
  try {
    const config = getGSheetConfig();
    if (!config.url) return res.status(400).json({ success: false, message: "URL Google Sheet belum disimpan" });
    const workbook = await loadWorkbookFromGoogleSheet(config.url);
    const masterMap = buildMasterDataLookup(workbook);
    if (masterMap.size === 0) return res.status(404).json({ success: false, message: "Sheet MASTER DATA tidak ditemukan atau kosong" });
    const masterData = {};
    for (const [k, v] of masterMap) masterData[k] = v;
    const existing = getPdfWorkbookData() || {};
    savePdfWorkbookData({ ...existing, masterData });
    const rows = Object.entries(masterData).map(([key, val]) => ({
      nama: val.nama || key,
      phone: val.phone || "",
      wilayah: val.wilayah || "",
    }));
    writeJsonFile(MASTERDATA_FILE, { rows });
    return res.json({ success: true, message: `${rows.length} data master berhasil disinkronisasi`, rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/masterdata", (req, res) => {
  const saved = readJsonFile(MASTERDATA_FILE, null);
  if (saved && Array.isArray(saved.rows) && saved.rows.length > 0) {
    return res.json({ success: true, rows: saved.rows });
  }
  const wb = getPdfWorkbookData();
  if (!wb || !wb.masterData || typeof wb.masterData !== "object") {
    return res.json({ success: true, rows: [], note: "Belum ada data. Lakukan Sync / Generate Temporary terlebih dahulu." });
  }
  const rows = Object.entries(wb.masterData).map(([key, val]) => ({
    nama: val.nama || key,
    phone: val.phone || "",
    wilayah: val.wilayah || "",
  }));
  return res.json({ success: true, rows });
});

app.put("/api/masterdata", (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ success: false, message: "rows harus array" });
  writeJsonFile(MASTERDATA_FILE, { rows });
  const existing = getPdfWorkbookData() || {};
  const masterData = {};
  rows.forEach(row => {
    const key = normalizeCompanyName(row.nama || "");
    if (key) masterData[key] = { nama: row.nama || "", phone: row.phone || "", wilayah: row.wilayah || "" };
  });
  savePdfWorkbookData({ ...existing, masterData });
  return res.json({ success: true, message: `${rows.length} record disimpan` });
});

app.get("/api/pdf/log", (req, res) => {
  const data = getPdfLogData();
  res.json({
    success: true,
    rows: data.rows || [],
    generatedAt: data.generatedAt || null,
  });
});

app.get("/api/pdf/logo", (req, res) => {
  const logo = getPdfLogo();
  if (!logo.base64 || !logo.mimeType) return res.json({ success: true, dataUrl: null });
  return res.json({ success: true, dataUrl: `data:${logo.mimeType};base64,${logo.base64}` });
});

app.post("/api/pdf/logo", imageUpload.single("logo"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File logo tidak ditemukan",
      });
    }

    savePdfLogo({
      name: req.file.originalname || "logo",
      mimeType: req.file.mimetype || "image/png",
      base64: req.file.buffer.toString("base64"),
    });

    return res.json({
      success: true,
      message: "Logo berhasil disimpan",
      hasLogo: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.delete("/api/pdf/logo", (req, res) => {
  try {
    deletePdfLogo();
    return res.json({
      success: true,
      message: "Logo berhasil dihapus",
      hasLogo: false,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/pdf/upload-excel", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "File Excel tidak ditemukan" });
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const rows = buildTemporaryRowsFromWorkbook(workbook);
    const masterMap = buildMasterDataLookup(workbook);
    const periodeMap = buildPeriodeSummaryMap(workbook);

    // Serialize Maps to plain objects for JSON storage
    const masterData = {};
    for (const [k, v] of masterMap) masterData[k] = v;
    const periodeData = {};
    for (const [k, v] of periodeMap) periodeData[k] = v;

    savePdfWorkbookData({ rows, masterData, periodeData });

    const previewRows = rows.map((row) => ({
      noInvoice: row.noInvoice || "",
      tanggalInvoice: formatDateId(row.tanggalInvoice),
      termin: row.termin || "",
      tempo: formatDateId(row.tempo),
      customer: row.customer || "",
      tagihan: parseNumberish(row.tagihan) || 0,
      penagih: row.penagih || "",
    }));

    savePdfTemporaryData({
      headers: ["No Invoice", "Tanggal Invoice", "Termin", "Tempo", "Customer", "Tagihan", "Penagih"],
      rows: previewRows,
      sourceSheet: req.file.originalname || "Excel",
    });

    const customerCount = new Set(rows.filter((r) => r.customer).map((r) => r.customer)).size;
    return res.json({
      success: true,
      message: `${rows.length} baris dari ${customerCount} customer berhasil dimuat`,
      rows: previewRows,
      customerCount,
      fileName: req.file.originalname,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/pdf/generate-temporary", async (req, res) => {
  try {
    const data = await buildPdfTemporaryFromGoogleSheet();
    return res.json({
      success: true,
      message: `${data.rows.length} baris berhasil dimuat ke temporary`,
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.put("/api/pdf/temporary/rows", (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: "rows harus array" });
    }
    const current = getPdfTemporaryData();
    savePdfTemporaryData({ ...current, rows });
    const workbook = getPdfWorkbookData();
    if (workbook) savePdfWorkbookData({ ...workbook, rows });
    return res.json({ success: true, message: "Data berhasil disimpan" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/pdf/generate-per-pt", async (req, res) => {
  try {
    getSafePdfProgress();
    if (isPdfGenerating) {
      return res.status(409).json({
        success: false,
        message: "Generate PDF sedang berjalan",
      });
    }

    isPdfGenerating = true;
    isPdfCancelRequested = false;
    savePdfProgress({
      running: true,
      current: 0,
      total: 0,
      ptName: "Menyiapkan proses",
      status: "Memulai generate PDF",
      step: 1,
      complete: false,
      error: "",
    });

    setImmediate(async () => {
      try {
        await generatePdfPerPtJob();
        io.emit("pdf-done", { success: true });
      } catch (error) {
        if (error?.code === "PDF_CANCELLED") {
          savePdfProgress({
            running: false,
            complete: true,
            status: "Generate PDF dibatalkan",
            error: "",
          });
          io.emit("pdf-cancelled", { message: error.message });
        } else {
          savePdfProgress({
            running: false,
            complete: true,
            status: "Generate PDF gagal",
            error: error.message,
          });
          io.emit("pdf-error", { error: error.message });
          emitLog("error", `Generate PDF gagal: ${error.message}`);
        }
      } finally {
        isPdfGenerating = false;
        isPdfCancelRequested = false;
      }
    });

    return res.json({
      success: true,
      message: "Generate PDF dimulai",
      progress: getPdfProgress(),
    });
  } catch (error) {
    isPdfGenerating = false;
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/pdf/cancel-generate", (req, res) => {
  if (!isPdfGenerating) {
    return res.status(409).json({
      success: false,
      message: "Tidak ada proses generate PDF yang sedang berjalan",
    });
  }

  isPdfCancelRequested = true;
  savePdfProgress({
    running: true,
    status: "Membatalkan generate PDF...",
    error: "",
  });

  return res.json({
    success: true,
    message: "Permintaan pembatalan generate PDF dikirim",
  });
});

app.post("/api/pdf/reset-progress", (req, res) => {
  isPdfGenerating = false;
  isPdfCancelRequested = false;
  const progress = savePdfProgress({
    running: false,
    current: 0,
    total: 0,
    ptName: "",
    status: "",
    step: 0,
    complete: false,
    error: "",
  });

  return res.json({
    success: true,
    message: "Status generate PDF berhasil direset",
    progress,
  });
});

app.post("/api/pdf/send-via-wa", async (req, res) => {
  try {
    const { rows, sessionId } = req.body;
    const targetSessionId = resolveSessionId(sessionId);

    if (isSending) return res.status(400).json({ success: false, message: "Proses pengiriman lain masih berjalan" });
    if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ success: false, message: "Data PDF kosong" });
    if (!targetSessionId) return res.status(400).json({ success: false, message: "Pilih akun WhatsApp terlebih dahulu" });

    if (targetSessionId !== activeSessionId || !waClient || !isWhatsAppReady) {
      await initWhatsAppClient({ sessionId: targetSessionId });
    }
    if (!waClient || !isWhatsAppReady) return res.status(400).json({ success: false, message: "WhatsApp belum login / belum terhubung" });

    isSending = true;
    setImmediate(async () => {
      const results = [];
      try {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          io.emit("pdf-wa-progress", { current: i + 1, total: rows.length, customer: row.nama || "-" });
          try {
            emitLog("info", `Kirim PDF ke: ${row.nama || "-"} (${row.nomor || "-"})`);
            await sendPdfToCustomer(row);
            results.push({ success: true, customer: row.nama });
            emitLog("success", `PDF terkirim ke ${row.nama}`);
          } catch (err) {
            results.push({ success: false, customer: row.nama, error: err.message });
            emitLog("error", `Gagal kirim PDF ke ${row.nama}: ${err.message}`);
          }
          if (i < rows.length - 1) await sleep(randomBetween(2000, 4000));
        }
        io.emit("pdf-wa-done", { results });
      } catch (err) {
        io.emit("pdf-wa-error", { error: err.message });
      } finally {
        isSending = false;
      }
    });

    return res.json({ success: true, message: `Mulai kirim ${rows.length} PDF via WhatsApp` });
  } catch (error) {
    isSending = false;
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/pdf/drive-config", (req, res) => {
  const config = getDriveConfig();
  return res.json({ success: true, ...config });
});

app.post("/api/pdf/drive-config", (req, res) => {
  const { folderId, enabled, scriptUrl } = req.body;
  saveDriveConfig({
    folderId: String(folderId || "").trim(),
    enabled: !!enabled,
    scriptUrl: String(scriptUrl || "").trim(),
  });
  return res.json({ success: true, message: "Konfigurasi Google Drive disimpan" });
});

app.post("/api/upload-excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File Excel tidak ditemukan",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const data = normalizeCustomerData(rawData);

    if (!data.length) {
      return res.status(400).json({
        success: false,
        message: "File Excel kosong",
      });
    }

    validateCustomerColumns(data);

    return res.json({
      success: true,
      fileName: req.file.originalname,
      message: `Berhasil memuat ${data.length} pelanggan`,
      data,
      source: "manual",
      sheetName: workbook.SheetNames[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/init-whatsapp", async (req, res) => {
  try {
    const requestedSessionId = normalizeSessionId(req.body?.sessionId || "");
    const createNew = !!req.body?.createNew || !requestedSessionId;
    const requestedLabel = String(req.body?.label || "").trim();
    const targetSessionId = createNew
      ? generateWhatsAppSessionId(requestedLabel || "akun-wa")
      : requestedSessionId;

    setActiveWhatsAppSession(
      targetSessionId,
      {
        label:
          requestedLabel || getWhatsAppSessionMeta(targetSessionId)?.label || targetSessionId,
      },
      {
        skipPersist: createNew,
      }
    );

    initWhatsAppClient({
      sessionId: targetSessionId,
      label: requestedLabel,
      deferSessionPersist: createNew,
    }).catch((initError) => {
      isWhatsAppReady = false;
      isWhatsAppInitializing = false;
      lastWhatsAppEvent = "error";
      emitLog("error", `Gagal inisialisasi WhatsApp: ${initError.message}`);
    });
    return res.json(
      buildWhatsAppStatusResponse({
        activeSessionId: targetSessionId,
        whatsappReady: createNew ? false : isWhatsAppReady,
        needScan: createNew ? true : !isWhatsAppReady,
        message: createNew
          ? "WhatsApp sedang menyiapkan QR code akun baru. Tunggu sebentar..."
          : isWhatsAppReady
          ? "WhatsApp Web terhubung"
          : lastQrString
          ? "WhatsApp belum login. Silakan scan QR code terlebih dahulu."
          : "WhatsApp sedang menyiapkan QR code. Tunggu sebentar...",
      })
    );
  } catch (error) {
    isWhatsAppReady = false;
    isWhatsAppInitializing = false;

    return res.status(500).json({
      success: false,
      whatsappReady: false,
      message: error.message,
    });
  }
});

app.post("/api/check-whatsapp", async (req, res) => {
  try {
    const requestedSessionId = normalizeSessionId(req.body?.sessionId || "");

    if (
      requestedSessionId &&
      requestedSessionId !== activeSessionId &&
      !isWhatsAppInitializing
    ) {
      setActiveWhatsAppSession(requestedSessionId);
    }

    return res.json(
      buildWhatsAppStatusResponse({
        message: isWhatsAppReady
          ? "WhatsApp sudah login"
          : "WhatsApp belum login, silakan scan QR",
      })
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      whatsappReady: false,
      needScan: true,
      isSending: false,
      message: error.message,
    });
  }
});

app.post("/api/select-whatsapp-session", async (req, res) => {
  try {
    const requestedSessionId = normalizeSessionId(req.body?.sessionId || "");
    if (!requestedSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session WhatsApp belum dipilih",
      });
    }

    const sessionMeta = getWhatsAppSessionMeta(requestedSessionId);
    if (!sessionMeta) {
      return res.status(404).json({
        success: false,
        message: "Sesi WhatsApp tidak ditemukan",
      });
    }

    setActiveWhatsAppSession(requestedSessionId, {
      label: sessionMeta.label || requestedSessionId,
      lastUsedAt: new Date().toISOString(),
    });

    await initWhatsAppClient({
      sessionId: requestedSessionId,
      label: sessionMeta.label || requestedSessionId,
    });

    await waitForWhatsAppState(5000);

    return res.json(
      buildWhatsAppStatusResponse({
        activeSessionId: requestedSessionId,
        message: isWhatsAppReady
          ? "Akun WhatsApp aktif dan siap dipakai"
          : lastQrString
          ? "Akun dipilih. Silakan scan QR untuk melanjutkan."
          : "Akun dipilih. Sedang menyiapkan koneksi WhatsApp...",
      })
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      whatsappReady: false,
      needScan: true,
      message: error.message || "Gagal memilih akun WhatsApp",
    });
  }
});

app.post("/api/open-whatsapp-browser", async (req, res) => {
  try {
    const requestedSessionId = normalizeSessionId(req.body?.sessionId || activeSessionId || "");
    const browser = normalizeBrowserTarget(req.body?.browser || "auto");

    if (!requestedSessionId) {
      return res.status(400).json({
        success: false,
        message: "Pilih akun WhatsApp dulu di dashboard",
      });
    }

    const sessionMeta = getWhatsAppSessionMeta(requestedSessionId);
    if (!sessionMeta) {
      return res.status(404).json({
        success: false,
        message: "Sesi WhatsApp tidak ditemukan",
      });
    }

    setActiveWhatsAppSession(requestedSessionId, {
      label: sessionMeta.label || requestedSessionId,
      lastUsedAt: new Date().toISOString(),
    });

    const browserCandidates =
      browser === "auto"
        ? ["auto", "chrome", "edge", "builtin"]
        : [browser];

    let openedBrowserTarget = browser;
    let browserWindowReady = false;
    let lastOpenError = null;

    for (const candidateBrowser of browserCandidates) {
      try {
        await initWhatsAppClient({
          sessionId: requestedSessionId,
          label: sessionMeta.label || requestedSessionId,
          visible: true,
          browser: candidateBrowser,
          forceReopen: true,
        });

        browserWindowReady = await focusWhatsAppBrowserWindow(12000);
        if (browserWindowReady) {
          openedBrowserTarget = candidateBrowser;
          break;
        }
      } catch (error) {
        lastOpenError = error;
      }
    }

    await waitForWhatsAppState(4000);

    if (!browserWindowReady) {
      return res.status(500).json({
        success: false,
        message:
          lastOpenError?.message ||
          "Browser WhatsApp gagal dimunculkan. Coba pastikan Chrome atau Edge terpasang dan backend dijalankan dari user desktop aktif.",
      });
    }

    return res.json(
      buildWhatsAppStatusResponse({
        activeSessionId: requestedSessionId,
        message: isWhatsAppReady
          ? "WhatsApp dibuka di browser aktif"
          : "Browser WhatsApp dibuka. Jika perlu, lanjutkan scan QR di window browser.",
        meta: {
          browserMode: "visible",
          browserTarget: openedBrowserTarget,
        },
      })
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal membuka browser WhatsApp",
    });
  }
});

app.post("/api/logout-whatsapp", async (req, res) => {
  try {
    if (isSending) {
      return res.status(400).json({
        success: false,
        message: "Tidak bisa logout saat proses pengiriman masih berjalan",
      });
    }

    const requestedSessionId = normalizeSessionId(req.body?.sessionId || activeSessionId || "");
    if (requestedSessionId && requestedSessionId !== activeSessionId) {
      setActiveWhatsAppSession(requestedSessionId);
      await initWhatsAppClient({ sessionId: requestedSessionId });
    }

    const removedSessionId = activeSessionId;
    await logoutWhatsAppClient();

    if (removedSessionId) {
      removeWhatsAppSessionMeta(removedSessionId);
    }

    const nextActiveSessionId = resolveSessionId();
    if (nextActiveSessionId) {
      activeSessionId = nextActiveSessionId;
    } else {
      activeSessionId = null;
    }

    return res.json(
      buildWhatsAppStatusResponse({
        whatsappReady: false,
        needScan: true,
        message: "WhatsApp berhasil logout. Silakan hubungkan akun lain.",
      })
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal logout WhatsApp",
    });
  }
});

app.post("/api/delete-whatsapp-session", async (req, res) => {
  try {
    if (isSending) {
      return res.status(400).json({
        success: false,
        message: "Tidak bisa hapus sesi saat proses pengiriman masih berjalan",
      });
    }

    const requestedSessionId = normalizeSessionId(req.body?.sessionId || "");
    if (!requestedSessionId) {
      return res.status(400).json({
        success: false,
        message: "Session WhatsApp belum dipilih",
      });
    }

    const isDeletingActiveSession = requestedSessionId === activeSessionId;
    let deleteWarning = "";

    if (isDeletingActiveSession) {
      await destroyWhatsAppClient();
      resetWhatsAppRuntimeState();
      lastWhatsAppEvent = "deleted";
      await sleep(800);
    }

    const deleteResult = tryDeleteWhatsAppSessionFiles(requestedSessionId);
    deleteWarning = deleteResult.warning;
    removeWhatsAppSessionMeta(requestedSessionId);

    if (isDeletingActiveSession) {
      const nextActiveSessionId = resolveSessionId();
      activeSessionId = nextActiveSessionId || null;
    }

    return res.json(
      buildWhatsAppStatusResponse({
        activeSessionId,
        whatsappReady: false,
        needScan: true,
        message: deleteWarning || "Sesi WhatsApp berhasil dihapus",
      })
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menghapus sesi WhatsApp",
    });
  }
});

app.get("/api/send-results", (req, res) => {
  return res.json({
    success: true,
    isSending,
    progress: currentSendProgress,
    summary: lastSendSummary,
    results: lastSendResults,
  });
});

app.post("/api/send-messages", async (req, res) => {
  try {
    const { customers, delay = 3000, sessionId } = req.body;
    const targetSessionId = resolveSessionId(sessionId);

    if (isSending) {
      return res.status(400).json({
        success: false,
        message: "Proses pengiriman lain masih berjalan",
      });
    }

    if (!Array.isArray(customers) || !customers.length) {
      return res.status(400).json({
        success: false,
        message: "Data customer kosong",
      });
    }

    if (!targetSessionId) {
      return res.status(400).json({
        success: false,
        message: "Pilih akun WhatsApp terlebih dahulu",
      });
    }

    if (targetSessionId !== activeSessionId || !waClient || !isWhatsAppReady) {
      await initWhatsAppClient({ sessionId: targetSessionId });
    }

    if (!waClient || !isWhatsAppReady) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp belum login / belum terhubung",
      });
    }

    isSending = true;
    lastSendSummary = null;
    lastSendResults = [];
    currentSendProgress = {
      current: 0,
      total: customers.length,
      customer: null,
    };

    emitLog("info", `Memulai pengiriman ke ${customers.length} pelanggan`);

    setImmediate(async () => {
      const results = [];

      try {
        for (let i = 0; i < customers.length; i++) {
          const customer = customers[i];
          currentSendProgress = {
            current: i + 1,
            total: customers.length,
            customer: customer.nama || "-",
          };

          io.emit("send-progress", {
            ...currentSendProgress,
          });

          try {
            emitLog("info", `Mengirim ke: ${customer.nama || "-"}`);

            const result = await sendWithRetry(customer, 3);

            results.push({
              success: true,
              customer: customer.nama,
              attempt: result.attempt,
            });

            emitLog(
              "success",
              `Terkirim ke ${customer.nama} pada percobaan ke-${result.attempt}`
            );
          } catch (error) {
            results.push({
              success: false,
              customer: customer.nama,
              error: error.message,
            });

            emitLog("error", `Gagal ke ${customer.nama}: ${error.message}`);
          }

          lastSendResults = [...results];

          if (i < customers.length - 1) {
            const randomDelay = Number(delay) + randomBetween(200, 600);
            emitLog("info", `Menunggu ${randomDelay} ms sebelum kirim berikutnya`);
            await sleep(randomDelay);
          }
        }

        const summary = {
          total: customers.length,
          success: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        };

        lastSendSummary = summary;
        lastSendResults = [...results];
        currentSendProgress = {
          current: customers.length,
          total: customers.length,
          customer: null,
        };

        io.emit("send-finished", {
          success: true,
          summary,
          results,
        });

        emitLog(
          "info",
          `Selesai. Berhasil: ${summary.success}, Gagal: ${summary.failed}`
        );
      } catch (err) {
        emitLog("error", "Proses background error: " + err.message);

        lastSendSummary = {
          total: customers.length,
          success: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          error: err.message,
        };

        lastSendResults = [...results];
        currentSendProgress = {
          current: results.length,
          total: customers.length,
          customer: null,
        };

        io.emit("send-finished", {
          success: false,
          summary: lastSendSummary,
          results,
          message: err.message,
        });
      } finally {
        isSending = false;
        currentSendProgress = {
          current: 0,
          total: 0,
          customer: null,
        };
      }
    });

    return res.json({
      success: true,
      background: true,
      message: "Proses pengiriman berjalan di background",
      total: customers.length,
    });
  } catch (error) {
    isSending = false;
    currentSendProgress = {
      current: 0,
      total: 0,
      customer: null,
    };

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/chats", async (req, res) => {
  try {
    await ensureWhatsAppStable();
    const waChats = await waClient.getChats();
    const list = waChats
      .sort((a, b) => {
        const aTime = a?.lastMessage?.timestamp || 0;
        const bTime = b?.lastMessage?.timestamp || 0;
        return bTime - aTime;
      })
      .slice(0, CHAT_LIST_LIMIT)
      .map((c) => {
      const lastMsg = c.lastMessage;
      return {
        id: c.id._serialized,
        name: c.name || c.id.user,
        phone: c.id.user,
        isGroup: c.isGroup,
        unread: c.unreadCount || 0,
        lastMessage: lastMsg ? {
          id: lastMsg.id?.id,
          from: lastMsg.fromMe ? "me" : "them",
          body: lastMsg.body || "",
          timestamp: lastMsg.timestamp ? lastMsg.timestamp * 1000 : null,
          type: lastMsg.type,
        } : null,
      };
      });

    res.json({ success: true, chats: list, source: "wa" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/chats/:chatId/messages", async (req, res) => {
  const chatId = decodeURIComponent(req.params.chatId);
  const wantsAll = String(req.query.limit || "").toLowerCase() === "all";
  const requestedLimit = Number(req.query.limit) || CHAT_MESSAGE_LIMIT;
  const limit = wantsAll ? null : Math.min(Math.max(requestedLimit, 100), CHAT_MESSAGE_LIMIT);

  try {
    await ensureWhatsAppStable();
    const chat = await waClient.getChatById(chatId);

    // syncHistory can fail when WA Web internal API changes — always ignore errors
    try { await chat.syncHistory(); } catch (_) {}

    let messages;
    try {
      let msgs;
      if (wantsAll) {
        msgs = await waClient.pupPage.evaluate(async (targetChatId) => {
          const chatModel = await window.WWebJS.getChat(targetChatId, {
            getAsModel: false,
          });
          if (!chatModel) return [];

          const msgFilter = (m) => !m.isNotification;
          let allMessages = chatModel.msgs.getModelsArray().filter(msgFilter);

          while (true) {
            const loadedMessages = await window
              .require("WAWebChatLoadMessages")
              .loadEarlierMsgs({ chat: chatModel });
            if (!loadedMessages || !loadedMessages.length) break;
            allMessages = [...loadedMessages.filter(msgFilter), ...allMessages];
          }

          allMessages.sort((a, b) => (a.t > b.t ? 1 : -1));
          return allMessages.map((m) => window.WWebJS.getMessageModel(m));
        }, chatId);
      } else {
        msgs = await chat.fetchMessages({ limit });
      }
      messages = msgs.map(serializeMessage);
    } catch (_fetchErr) {
      // fetchMessages failed (e.g. waitForChatLoading undefined) — return cache if available
      if (chatHistory.has(chatId)) {
        const stored = chatHistory.get(chatId);
        return res.json({
          success: true,
          messages: wantsAll ? stored.messages : stored.messages.slice(-limit),
          source: "cache",
          note: "Menggunakan pesan tersimpan (WhatsApp Web tidak dapat memuat riwayat baru)",
          limit: stored.messages.length,
        });
      }
      throw _fetchErr;
    }

    const contact = await waClient.getContactById(chatId).catch(() => null);
    const name = contact?.pushname || contact?.name || chatId.replace("@c.us", "");
    const phone = chatId.replace("@c.us", "").replace("@g.us", "");
    if (!chatHistory.has(chatId)) {
      chatHistory.set(chatId, { id: chatId, name, phone, unread: 0, messages: [] });
    }

    const stored = chatHistory.get(chatId);
    stored.name = name;
    stored.phone = phone;
    stored.unread = 0;
    mergeStoredMessages(stored, messages);

    return res.json({
      success: true,
      messages: stored.messages,
      source: "wa",
      limit: stored.messages.length,
    });
  } catch (error) {
    // Final fallback: serve cached messages rather than showing an error
    if (chatHistory.has(chatId)) {
      const stored = chatHistory.get(chatId);
      return res.json({
        success: true,
        messages: wantsAll ? stored.messages : stored.messages.slice(-limit),
        source: "cache",
        note: "Menggunakan pesan tersimpan",
        limit: stored.messages.length,
      });
    }
    res.status(500).json({
      success: false,
      message: `Gagal mengambil history chat dari WhatsApp Web: ${error.message}`,
    });
  }
});

app.post("/api/chats/:chatId/reply", async (req, res) => {
  try {
    const chatId = decodeURIComponent(req.params.chatId);
    const { message, quotedMsgId } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: "Pesan kosong" });
    await ensureWhatsAppStable();
    const opts = quotedMsgId ? { quotedMessageId: quotedMsgId } : {};
    await waClient.sendMessage(chatId, message.trim(), opts);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/messages/:serializedId/delete", async (req, res) => {
  try {
    const serializedId = decodeURIComponent(req.params.serializedId);
    await ensureWhatsAppStable();
    const msg = await waClient.getMessageById(serializedId);
    if (!msg) return res.status(404).json({ success: false, message: "Pesan tidak ditemukan" });
    await msg.delete(true); // true = hapus untuk semua
    // Immediately patch cache so refresh shows "Pesan dihapus" instead of original content
    for (const stored of chatHistory.values()) {
      const idx = stored.messages.findIndex((m) => m.serializedId === serializedId);
      if (idx !== -1) {
        stored.messages[idx] = { ...stored.messages[idx], type: "revoked", body: "", hasMedia: false, quotedMsg: null };
        break;
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/my-profile", async (req, res) => {
  try {
    await ensureWhatsAppStable();
    const info = waClient.info;
    const wid = info?.wid?._serialized || (info?.wid?.user ? `${info.wid.user}@c.us` : null);
    const picUrl = wid ? await waClient.getProfilePicUrl(wid).catch(() => null) : null;
    res.json({ name: info?.pushname || "", number: info?.wid?.user || "", picUrl: picUrl || null });
  } catch {
    res.json({ name: "", number: "", picUrl: null });
  }
});

app.post("/api/chats/:chatId/mark-read", async (req, res) => {
  try {
    const chatId = decodeURIComponent(req.params.chatId);
    await ensureWhatsAppStable();
    const chat = await waClient.getChatById(chatId);
    await chat.sendSeen();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

app.post("/api/chats/:chatId/reply-media", chatMediaUpload.single("file"), async (req, res) => {
  try {
    const chatId = decodeURIComponent(req.params.chatId);
    if (!req.file) return res.status(400).json({ success: false, message: "File tidak ditemukan" });
    await ensureWhatsAppStable();
    const base64Data = req.file.buffer.toString("base64");
    const media = new MessageMedia(req.file.mimetype, base64Data, req.file.originalname);
    const opts = {};
    if (req.body.caption?.trim()) opts.caption = req.body.caption.trim();
    if (req.body.quotedMsgId?.trim()) opts.quotedMessageId = req.body.quotedMsgId.trim();
    await waClient.sendMessage(chatId, media, opts);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


const mediaCache = new Map();
const MEDIA_TTL = 30 * 60 * 1000;

app.get("/api/messages/:serializedId/media", async (req, res) => {
  const serializedId = decodeURIComponent(req.params.serializedId);
  const wantsDownload = String(req.query.download || "") === "1";
  try {
    const cached = mediaCache.get(serializedId);
    if (cached && Date.now() < cached.expiry) {
      res.setHeader("Content-Type", cached.mimetype);
      res.setHeader("Cache-Control", "public, max-age=1800");
      if (cached.filename) res.setHeader("Content-Disposition", `${wantsDownload ? "attachment" : "inline"}; filename="${cached.filename}"`);
      return res.send(Buffer.from(cached.data, "base64"));
    }
    await ensureWhatsAppStable();
    const msg = await waClient.getMessageById(serializedId);
    if (!msg) return res.status(404).json({ error: "Pesan tidak ditemukan" });
    const media = await msg.downloadMedia();
    if (!media) return res.status(404).json({ error: "Media tidak tersedia" });
    mediaCache.set(serializedId, {
      mimetype: media.mimetype,
      data: media.data,
      filename: media.filename || null,
      expiry: Date.now() + MEDIA_TTL,
    });
    const buf = Buffer.from(media.data, "base64");
    res.setHeader("Content-Type", media.mimetype);
    res.setHeader("Cache-Control", "public, max-age=1800");
    if (media.filename) res.setHeader("Content-Disposition", `${wantsDownload ? "attachment" : "inline"}; filename="${media.filename}"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengunduh media" });
  }
});

const profilePicCache = new Map();
const PROFILE_PIC_TTL = 10 * 60 * 1000;

app.get("/api/profile-pic/:chatId", async (req, res) => {
  const chatId = decodeURIComponent(req.params.chatId);
  try {
    const cached = profilePicCache.get(chatId);
    if (cached !== undefined && Date.now() < cached.expiry) {
      return res.json({ url: cached.url });
    }
    await ensureWhatsAppStable();
    const url = await waClient.getProfilePicUrl(chatId).catch(() => null);
    profilePicCache.set(chatId, { url: url || null, expiry: Date.now() + PROFILE_PIC_TTL });
    res.json({ url: url || null });
  } catch {
    profilePicCache.set(chatId, { url: null, expiry: Date.now() + PROFILE_PIC_TTL });
    res.json({ url: null });
  }
});

app.get("*", (req, res, next) => {
  if (
    req.path.startsWith("/api") ||
    req.path.startsWith("/socket.io") ||
    req.path.startsWith("/assets/") ||
    req.path.includes(".")
  ) {
    return next();
  }

  res.sendFile(path.join(FRONTEND_DIST_DIR, "index.html"));
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  if (lastQrString) {
    socket.emit("wa-qr", {
      sessionId: activeSessionId,
      qr: lastQrString,
      time: lastQrAt,
      isRefresh: true,
    });
  }

  if (isWhatsAppReady) {
    socket.emit("wa-ready", {
      sessionId: activeSessionId,
      ready: true,
      time: new Date().toISOString(),
      account: getWhatsAppAccountInfo(),
      sessions: getWhatsAppSessionsSummary(),
    });
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  activeSessionId = getPreferredWhatsAppSessionId();
  clearWhatsAppWebCache();
  console.log(`Backend running on http://192.168.1.254:${PORT}`);

  if (activeSessionId) {
    initWhatsAppClient({ sessionId: activeSessionId }).catch((error) => {
      isWhatsAppReady = false;
      isWhatsAppInitializing = false;
      lastWhatsAppEvent = "startup_error";
      emitLog(
        "error",
        `Auto reconnect sesi WhatsApp gagal (${activeSessionId}): ${error.message}`
      );
    });
  }
});

process.on("SIGINT", async () => {
  try {
    if (waClient) {
      await waClient.destroy();
    }
  } catch (error) {
  } finally {
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  try {
    if (waClient) {
      await waClient.destroy();
    }
  } catch (error) {
  } finally {
    process.exit(0);
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

