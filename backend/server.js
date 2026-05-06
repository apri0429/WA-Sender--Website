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
const { Client, LocalAuth } = require("whatsapp-web.js");
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
const TEMPLATE_FILE = path.join(DATA_DIR, "template.json");
const GSHEET_FILE = path.join(DATA_DIR, "gsheet.json");
const WA_SESSIONS_FILE = path.join(DATA_DIR, "wa-sessions.json");

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static(FRONTEND_DIST_DIR));

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

let waClient = null;
let activeSessionId = null;
let currentClientSessionId = null;
let isWhatsAppReady = false;
let cdpSession = null;
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

// Chat inbox - in-memory store
const chatHistory = new Map(); // chatId -> { id, name, phone, unread, messages[] }

function serializeMessage(msg) {
  return {
    id: msg.id?.id || String(Date.now()),
    from: msg.fromMe ? "me" : "them",
    body: msg.body || "",
    timestamp: msg.timestamp ? msg.timestamp * 1000 : Date.now(),
    type: msg.type || "chat",
    hasMedia: msg.hasMedia || false,
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
    // Batasi 200 pesan per chat
    if (chat.messages.length > 200) chat.messages.splice(0, chat.messages.length - 200);
  }
  if (!msg.fromMe) chat.unread += 1;
  return entry;
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

let screencastViewers = 0;
let latestJpegBuffer = null;
const mjpegResponses = new Set();

function pushMjpegFrame(buf) {
  if (!buf || mjpegResponses.size === 0) return;
  const header = `--mjpeg\r\nContent-Type: image/jpeg\r\nContent-Length: ${buf.length}\r\n\r\n`;
  for (const res of mjpegResponses) {
    try {
      res.write(header);
      res.write(buf);
      res.write("\r\n");
    } catch {
      mjpegResponses.delete(res);
    }
  }
}

async function startScreencast() {
  if (!waClient?.pupPage || cdpSession) return;
  try {
    cdpSession = await waClient.pupPage.target().createCDPSession();
    const vp = waClient.pupPage.viewport() || { width: 1280, height: 800 };
    await cdpSession.send("Page.startScreencast", {
      format: "jpeg",
      quality: 85,
      maxWidth: vp.width,
      maxHeight: vp.height,
      everyNthFrame: 1,
    });
    cdpSession.on("Page.screencastFrame", async ({ data, sessionId, metadata }) => {
      const buf = Buffer.from(data, "base64");
      latestJpegBuffer = buf;
      pushMjpegFrame(buf);
      try { await cdpSession.send("Page.screencastFrameAck", { sessionId }); } catch {}
    });
  } catch (e) {
    console.error("startScreencast error:", e.message);
    cdpSession = null;
  }
}

async function stopScreencast() {
  if (!cdpSession) return;
  const sess = cdpSession;
  cdpSession = null;
  try { await sess.send("Page.stopScreencast"); } catch {}
  try { await sess.detach(); } catch {}
}

async function destroyWhatsAppClient() {
  if (!waClient) return;

  const clientToDestroy = waClient;
  waClient = null;
  currentClientSessionId = null;

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
    .replace(/{pdf}/g, customer.pdf || "");
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

function killOrphanedBrowserProcesses(sessionId) {
  const sessionDir = getWhatsAppSessionDir(sessionId);
  try {
    const escapedPath = sessionDir.replace(/\\/g, "\\\\");
    const cmd = `wmic process where "Name='chrome.exe' and CommandLine like '%${escapedPath}%'" get ProcessId /format:csv 2>nul`;
    const output = execSync(cmd, { encoding: "utf8", timeout: 5000 });
    const pids = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("Node"))
      .map((line) => {
        const parts = line.split(",");
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter((pid) => !isNaN(pid) && pid > 0);

    for (const pid of pids) {
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

function buildWhatsAppClient(sessionId) {
  killOrphanedBrowserProcesses(sessionId);
  cleanupBrowserLockFiles(sessionId);

  return new Client({
    authStrategy: new LocalAuth({
      dataPath: SESSION_DIR,
      clientId: `wa-sender-${sessionId}`,
    }),
    puppeteer: {
      headless: true,
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
    },
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

  const shouldSwitchSession =
    currentClientSessionId && currentClientSessionId !== requestedSessionId;

  if (shouldSwitchSession) {
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

  if (waClient && isWhatsAppReady) {
    return waClient;
  }

  if (isWhatsAppInitializing) {
    return waClient;
  }

  if (waClient && lastQrString && currentClientSessionId === requestedSessionId) {
    return waClient;
  }

  if (waClient && !isWhatsAppReady) {
    await destroyWhatsAppClient();
    resetWhatsAppRuntimeState();
  }

  isWhatsAppInitializing = true;
  lastWhatsAppEvent = "initializing";

  if (!waClient) {
    waClient = buildWhatsAppClient(requestedSessionId);
    currentClientSessionId = requestedSessionId;

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
      // Pre-warm screencast agar langsung siap saat dibuka
      startScreencast().catch(() => {});
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
      stopScreencast();
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
    const list = waChats.slice(0, 50).map((c) => {
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
    res.json({ success: true, chats: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/chats/:chatId/messages", async (req, res) => {
  try {
    await ensureWhatsAppStable();
    const chatId = decodeURIComponent(req.params.chatId);

    // Coba fetchMessages dari WA langsung
    try {
      const chat = await waClient.getChatById(chatId);
      const msgs = await chat.fetchMessages({ limit: 50 });
      const messages = msgs.map(serializeMessage);

      // Simpan ke memory sekalian agar sinkron
      const contact = await waClient.getContactById(chatId).catch(() => null);
      const name = contact?.pushname || contact?.name || chatId.replace("@c.us", "");
      const phone = chatId.replace("@c.us", "").replace("@g.us", "");
      if (!chatHistory.has(chatId)) {
        chatHistory.set(chatId, { id: chatId, name, phone, unread: 0, messages: [] });
      }
      const stored = chatHistory.get(chatId);
      messages.forEach((m) => {
        if (!stored.messages.find((s) => s.id === m.id)) stored.messages.push(m);
      });
      stored.messages.sort((a, b) => a.timestamp - b.timestamp);

      return res.json({ success: true, messages: stored.messages, source: "wa" });
    } catch (fetchErr) {
      // fetchMessages gagal — kembalikan dari memori
      console.warn("fetchMessages failed, using memory:", fetchErr.message);
      const stored = chatHistory.get(chatId);
      return res.json({
        success: true,
        messages: stored?.messages || [],
        source: "memory",
        note: "Riwayat terbatas pada sesi ini (fetchMessages tidak tersedia)",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/chats/:chatId/reply", async (req, res) => {
  try {
    const chatId = decodeURIComponent(req.params.chatId);
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: "Pesan kosong" });
    await ensureWhatsAppStable();
    await waClient.sendMessage(chatId, message.trim());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Halaman WA Web ringan (tanpa React)
app.get("/wa-web", (req, res) => {
  res.sendFile(path.join(__dirname, "wa-web.html"));
});

// MJPEG stream — browser render native, jauh lebih ringan dari WebSocket base64
app.get("/api/wa-stream", async (req, res) => {
  if (!waClient?.pupPage || !isWhatsAppReady) {
    return res.status(503).send("WhatsApp not ready");
  }

  res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=mjpeg");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Pastikan screencast sudah jalan
  await startScreencast();

  mjpegResponses.add(res);
  screencastViewers++;

  // Kirim frame terakhir langsung agar tidak blank
  if (latestJpegBuffer) pushMjpegFrame(latestJpegBuffer);

  req.on("close", () => {
    mjpegResponses.delete(res);
    screencastViewers = Math.max(0, screencastViewers - 1);
    // Screencast tetap jalan agar next open langsung dapat frame
  });
});

app.get("/api/wa-viewport", (req, res) => {
  const vp = waClient?.pupPage?.viewport() || { width: 1280, height: 800 };
  res.json({ width: vp.width, height: vp.height });
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

  // Buka screencast — masukkan socket ke room "screencast"
  socket.on("wa-screen-open", async () => {
    socket.join("screencast");
    screencastViewers++;
    if (screencastViewers === 1) await startScreencast();
    const vp = waClient?.pupPage?.viewport() || { width: 1280, height: 800 };
    socket.emit("wa-viewport", { width: vp.width, height: vp.height });
    // Screenshot pertama agar tidak kosong saat buka
    if (waClient?.pupPage) {
      waClient.pupPage.screenshot({ type: "jpeg", quality: 55, encoding: "base64" })
        .then((data) => socket.emit("wa-screen", { data, width: vp.width, height: vp.height }))
        .catch(() => {});
    }
  });

  socket.on("wa-screen-close", () => {
    socket.leave("screencast");
    screencastViewers = Math.max(0, screencastViewers - 1);
    // Screencast tetap jalan, stop hanya saat WA disconnect
  });

  socket.on("disconnect", () => {
    socket.leave("screencast");
    screencastViewers = Math.max(0, screencastViewers - 1);
    // Screencast tetap jalan selama WA ready
  });

  // Klik — frontend sudah scale ke koordinat Puppeteer
  socket.on("wa-click", async ({ x, y }) => {
    if (!waClient?.pupPage || !isWhatsAppReady) return;
    try {
      await waClient.pupPage.mouse.move(Math.round(x), Math.round(y));
      await waClient.pupPage.mouse.click(Math.round(x), Math.round(y));
    } catch {}
  });

  // Ketik teks
  socket.on("wa-type", async ({ text }) => {
    if (!waClient?.pupPage || !isWhatsAppReady) return;
    try { await waClient.pupPage.keyboard.type(text, { delay: 20 }); } catch {}
  });

  // Tombol spesial (Enter, Backspace, dll)
  socket.on("wa-key", async ({ key }) => {
    if (!waClient?.pupPage || !isWhatsAppReady) return;
    try { await waClient.pupPage.keyboard.press(key); } catch {}
  });

  // Scroll — pakai mouse.wheel agar bekerja di container scroll WA Web
  socket.on("wa-scroll", async ({ x, y, deltaY }) => {
    if (!waClient?.pupPage || !isWhatsAppReady) return;
    try {
      await waClient.pupPage.mouse.move(Math.round(x), Math.round(y));
      await waClient.pupPage.mouse.wheel({ deltaY });
    } catch {}
  });

  // Resize viewport Puppeteer agar pas dengan ukuran layar user (hilangkan garis hitam)
  socket.on("wa-set-viewport", async ({ width, height }) => {
    if (!waClient?.pupPage) return;
    try {
      const w = Math.round(Math.max(800, Math.min(2560, width)));
      const h = Math.round(Math.max(500, Math.min(1440, height)));
      await waClient.pupPage.setViewport({ width: w, height: h });
      await stopScreencast();
      await startScreencast();
      socket.emit("wa-viewport", { width: w, height: h });
    } catch (e) {
      console.error("wa-set-viewport error:", e.message);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  activeSessionId = getPreferredWhatsAppSessionId();
  console.log(`Backend running on http://192.168.1.254:${PORT}`);
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