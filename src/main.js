'use strict';

const { app, BrowserWindow, Menu, dialog, ipcMain, session, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fileURLToPath, pathToFileURL } = require('node:url');

const APPLICATION_ID = 'app.mark.editor';
const MAX_RECENT_FILES = 5;
const supportedFileExtensions = new Set(['.md', '.markdown', '.mdown', '.mkd', '.txt']);
const blockedLaunchExtensions = new Set([
  '.app', '.bat', '.cmd', '.com', '.command', '.desktop', '.exe', '.jar', '.jse', '.lnk',
  '.msi', '.pif', '.ps1', '.reg', '.run', '.scr', '.sh', '.url', '.vbs', '.wsf', '.wsh',
]);
const windowStates = new Map();
const rendererEntryUrl = pathToFileURL(path.join(__dirname, 'renderer', 'index.html')).toString();

app.enableSandbox();

let pendingLaunchPath = null;
let appLocale = 'fr';
let preferences = {
  menuBarVisible: true,
  recentFiles: [],
};

const translations = {
  fr: {
    untitled: 'Sans titre.md',
    noRecent: 'Aucun fichier récent',
    clearRecent: 'Effacer les fichiers récents',
    file: 'Fichier',
    new: 'Nouveau',
    open: 'Ouvrir…',
    recent: 'Récents',
    save: 'Enregistrer',
    saveAs: 'Enregistrer sous…',
    quit: 'Quitter',
    edit: 'Édition',
    undo: 'Annuler',
    redo: 'Rétablir',
    find: 'Rechercher…',
    replace: 'Rechercher et remplacer…',
    cut: 'Couper',
    copy: 'Copier',
    paste: 'Coller',
    selectAll: 'Tout sélectionner',
    view: 'Affichage',
    editor: 'Éditeur',
    split: 'Partagé',
    preview: 'Aperçu',
    toc: 'Table des matières',
    menuBar: 'Barre de menus',
    fullscreen: 'Plein écran',
    help: 'Aide',
    shortcuts: 'Raccourcis et syntaxe',
    openDialogTitle: 'Ouvrir un fichier Markdown',
    saveDialogTitle: 'Enregistrer le fichier Markdown',
    allFiles: 'Tous les fichiers',
    text: 'Texte',
    openErrorTitle: 'Ouverture impossible',
    openErrorMessage: 'Le fichier n’a pas pu être ouvert.',
    invalidPath: 'Le chemin du fichier est invalide.',
    invalidPathDetail: 'Chemin de fichier invalide.',
    saveErrorTitle: 'Enregistrement impossible',
    saveErrorMessage: 'Le document n’a pas pu être enregistré.',
    unsavedTitle: 'Modifications non enregistrées',
    closeQuestion: 'Enregistrer les modifications avant de fermer ?',
    saveButton: 'Enregistrer',
    discardButton: 'Ignorer',
    cancelButton: 'Annuler',
    continueWithoutSaving: 'Continuer sans enregistrer les modifications ?',
    continueButton: 'Continuer',
    missingLinkTitle: 'Lien introuvable',
    missingLinkMessage: 'Impossible d’ouvrir ce fichier ou dossier.',
    systemOpenMessage: 'Le système n’a pas pu ouvrir ce lien.',
    blockedLaunchTitle: 'Ouverture bloquée',
    blockedLaunchMessage: 'Par sécurité, Mark n’ouvre pas les exécutables ou scripts depuis un document.',
    recoveryTitle: 'Récupération disponible',
    recoveryMessage: (name) => `Une version non enregistrée de ${name || 'votre document'} a été retrouvée.`,
    recoveryDetail: (timestamp) => `Dernière copie de récupération : ${timestamp}`,
    restoreButton: 'Restaurer',
    ignoreButton: 'Ignorer',
    unknownDate: 'date inconnue',
  },
  en: {
    untitled: 'Untitled.md',
    noRecent: 'No recent files',
    clearRecent: 'Clear recent files',
    file: 'File',
    new: 'New',
    open: 'Open…',
    recent: 'Recent',
    save: 'Save',
    saveAs: 'Save As…',
    quit: 'Quit',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    find: 'Find…',
    replace: 'Find and Replace…',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    view: 'View',
    editor: 'Editor',
    split: 'Split',
    preview: 'Preview',
    toc: 'Table of Contents',
    menuBar: 'Menu bar',
    fullscreen: 'Full Screen',
    help: 'Help',
    shortcuts: 'Shortcuts and syntax',
    openDialogTitle: 'Open a Markdown file',
    saveDialogTitle: 'Save Markdown file',
    allFiles: 'All files',
    text: 'Text',
    openErrorTitle: 'Unable to open',
    openErrorMessage: 'The file could not be opened.',
    invalidPath: 'The file path is invalid.',
    invalidPathDetail: 'Invalid file path.',
    saveErrorTitle: 'Unable to save',
    saveErrorMessage: 'The document could not be saved.',
    unsavedTitle: 'Unsaved changes',
    closeQuestion: 'Save changes before closing?',
    saveButton: 'Save',
    discardButton: 'Discard',
    cancelButton: 'Cancel',
    continueWithoutSaving: 'Continue without saving your changes?',
    continueButton: 'Continue',
    missingLinkTitle: 'Link not found',
    missingLinkMessage: 'This file or folder could not be opened.',
    systemOpenMessage: 'The system could not open this link.',
    blockedLaunchTitle: 'Open blocked',
    blockedLaunchMessage: 'For security, Mark does not launch executables or scripts from a document.',
    recoveryTitle: 'Recovery available',
    recoveryMessage: (name) => `An unsaved version of ${name || 'your document'} was found.`,
    recoveryDetail: (timestamp) => `Last recovery copy: ${timestamp}`,
    restoreButton: 'Restore',
    ignoreButton: 'Ignore',
    unknownDate: 'unknown date',
  },
};

function t(key, ...args) {
  const value = translations[appLocale]?.[key] ?? translations.fr[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
}

if (process.platform === 'win32') {
  app.setAppUserModelId?.(APPLICATION_ID);
}

function preferencesPath() {
  return path.join(app.getPath('userData'), 'preferences.json');
}

function legacyRecoveryPath() {
  return path.join(app.getPath('userData'), 'recovery.json');
}

function recoveryDirectory() {
  return path.join(app.getPath('userData'), 'recovery');
}

function recoveryPath(recoveryId) {
  return path.join(recoveryDirectory(), `${recoveryId}.json`);
}

function stateFor(window) {
  return window && !window.isDestroyed() ? windowStates.get(window.id) : null;
}

function windowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function isTrustedIpcEvent(event) {
  const senderUrl = event.senderFrame?.url || event.sender?.getURL?.() || '';
  return senderUrl === rendererEntryUrl;
}

function assertTrustedIpcEvent(event) {
  if (!isTrustedIpcEvent(event)) {
    throw new Error('Blocked IPC request from an untrusted renderer.');
  }
}

function handleTrusted(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedIpcEvent(event);
    return handler(event, ...args);
  });
}

function onTrusted(channel, handler) {
  ipcMain.on(channel, (event, ...args) => {
    try {
      assertTrustedIpcEvent(event);
      handler(event, ...args);
    } catch (error) {
      console.error(error);
    }
  });
}

function focusedWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || null;
}

function pathEquals(left, right) {
  if (!left || !right) return false;
  const normalizedLeft = path.resolve(left);
  const normalizedRight = path.resolve(right);
  return process.platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}

function loadPreferences() {
  try {
    const parsed = JSON.parse(fsSync.readFileSync(preferencesPath(), 'utf8'));
    preferences = {
      menuBarVisible: parsed.menuBarVisible !== false,
      recentFiles: Array.isArray(parsed.recentFiles)
        ? parsed.recentFiles
            .filter((filePath) => typeof filePath === 'string' && fsSync.existsSync(filePath))
            .slice(0, MAX_RECENT_FILES)
        : [],
    };
  } catch {
    preferences = { menuBarVisible: true, recentFiles: [] };
  }
}

function savePreferences() {
  try {
    fsSync.mkdirSync(path.dirname(preferencesPath()), { recursive: true });
    fsSync.writeFileSync(preferencesPath(), JSON.stringify(preferences, null, 2), 'utf8');
  } catch (error) {
    console.error('Unable to save preferences:', error);
  }
}

async function writeJsonAtomically(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(value), 'utf8');
    await fs.rename(tempPath, filePath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => {});
  }
}

async function migrateLegacyRecovery() {
  try {
    const parsed = JSON.parse(await fs.readFile(legacyRecoveryPath(), 'utf8'));
    if (parsed && typeof parsed.content === 'string') {
      const recoveryId = crypto.randomUUID();
      await writeJsonAtomically(recoveryPath(recoveryId), { ...parsed, recoveryId });
    }
    await fs.rm(legacyRecoveryPath(), { force: true });
  } catch {
    // No legacy recovery to migrate.
  }
}

async function loadRecoveries() {
  await migrateLegacyRecovery();
  try {
    const entries = await fs.readdir(recoveryDirectory(), { withFileTypes: true });
    const recoveries = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      try {
        const recovery = JSON.parse(await fs.readFile(path.join(recoveryDirectory(), entry.name), 'utf8'));
        if (!recovery || typeof recovery.content !== 'string') continue;
        if (recovery.content === (recovery.savedContent || '')) {
          await fs.rm(path.join(recoveryDirectory(), entry.name), { force: true });
          continue;
        }
        recoveries.push({
          ...recovery,
          recoveryId: recovery.recoveryId || path.basename(entry.name, '.json'),
        });
      } catch {
        // Ignore a damaged recovery entry without blocking the application.
      }
    }
    return recoveries.sort((left, right) => String(left.updatedAt || '').localeCompare(String(right.updatedAt || '')));
  } catch {
    return [];
  }
}

async function clearRecoveryForWindow(window) {
  const state = stateFor(window);
  if (!state) return true;
  state.pendingRecovery = null;
  await fs.rm(recoveryPath(state.recoveryId), { force: true }).catch(() => {});
  return true;
}

async function saveRecoveryForWindow(window, recoveryState) {
  const state = stateFor(window);
  if (!state) return false;
  if (!recoveryState?.dirty || typeof recoveryState.content !== 'string') {
    await clearRecoveryForWindow(window);
    return true;
  }

  await writeJsonAtomically(recoveryPath(state.recoveryId), {
    recoveryId: state.recoveryId,
    content: recoveryState.content,
    savedContent: typeof recoveryState.savedContent === 'string' ? recoveryState.savedContent : '',
    filePath: typeof recoveryState.filePath === 'string' ? recoveryState.filePath : null,
    name: typeof recoveryState.name === 'string' ? recoveryState.name : displayName(state),
    updatedAt: new Date().toISOString(),
  });
  return true;
}

function filePathFromArguments(argv) {
  const candidates = argv.slice(app.isPackaged ? 1 : 2);
  return candidates.find((candidate) => {
    if (typeof candidate !== 'string' || candidate.startsWith('--')) return false;
    if (!supportedFileExtensions.has(path.extname(candidate).toLowerCase())) return false;
    try {
      return fsSync.statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) || null;
}

function sendCommand(window, command, payload) {
  if (!window || window.isDestroyed()) return;
  window.webContents.send('command', command, payload);
}

function displayName(stateOrPath) {
  const filePath = typeof stateOrPath === 'string'
    ? stateOrPath
    : stateOrPath?.currentFilePath;
  return filePath ? path.basename(filePath) : t('untitled');
}

function sendDocumentMeta(window) {
  const state = stateFor(window);
  if (!state) return;
  window.webContents.send('document-meta', {
    filePath: state.currentFilePath,
    name: displayName(state),
  });
  window.setTitle(`${state.documentIsDirty ? '• ' : ''}${displayName(state)} — Mark`);
  if (process.platform === 'darwin') {
    window.setDocumentEdited(state.documentIsDirty);
    window.setRepresentedFilename(state.currentFilePath || '');
  }
}

function sendMenuBarState(window = null) {
  const targets = window ? [window] : BrowserWindow.getAllWindows();
  targets.forEach((target) => {
    if (!target.isDestroyed()) target.webContents.send('menu-bar-state', preferences.menuBarVisible);
  });
}

function addRecentFile(filePath) {
  if (!filePath) return;
  const absolutePath = path.resolve(filePath);
  preferences.recentFiles = [
    absolutePath,
    ...preferences.recentFiles.filter((recentPath) => !pathEquals(recentPath, absolutePath)),
  ].slice(0, MAX_RECENT_FILES);
  savePreferences();
  app.addRecentDocument(absolutePath);
  buildMenu();
}

function clearRecentFiles() {
  preferences.recentFiles = [];
  savePreferences();
  app.clearRecentDocuments();
  buildMenu();
}

function shortenedFolder(filePath) {
  const folder = path.dirname(filePath);
  if (folder.length <= 58) return folder;
  return `…${folder.slice(-57)}`;
}

function recentFileLabel(filePath) {
  const file = path.basename(filePath).replaceAll('&', '&&');
  const folder = shortenedFolder(filePath).replaceAll('&', '&&');
  return `${file} — ${folder}`;
}

function recentSubmenu() {
  const existing = preferences.recentFiles.filter((filePath) => fsSync.existsSync(filePath));
  if (existing.length !== preferences.recentFiles.length) {
    preferences.recentFiles = existing.slice(0, MAX_RECENT_FILES);
    savePreferences();
  }

  if (existing.length === 0) {
    return [{ label: t('noRecent'), enabled: false }];
  }

  return [
    ...existing.slice(0, MAX_RECENT_FILES).map((filePath) => ({
      label: recentFileLabel(filePath),
      click: (_menuItem, browserWindow) => sendCommand(browserWindow || focusedWindow(), 'load-path', filePath),
    })),
    { type: 'separator' },
    { label: t('clearRecent'), click: clearRecentFiles },
  ];
}

function applyMenuBarVisibility(window = null) {
  if (process.platform === 'darwin') return;
  const targets = window ? [window] : BrowserWindow.getAllWindows();
  targets.forEach((target) => {
    if (target.isDestroyed()) return;
    target.setAutoHideMenuBar(!preferences.menuBarVisible);
    target.setMenuBarVisibility(preferences.menuBarVisible);
  });
}

function setMenuBarVisible(visible) {
  preferences.menuBarVisible = Boolean(visible);
  savePreferences();
  applyMenuBarVisibility();
  buildMenu();
  sendMenuBarState();
  return preferences.menuBarVisible;
}

async function showOperationError(window, title, message, error) {
  console.error(error);
  await dialog.showMessageBox(window || undefined, {
    type: 'error',
    title,
    message,
    detail: error instanceof Error ? error.message : String(error),
    buttons: ['OK'],
    noLink: true,
  });
}

async function readMarkdown(window, filePath) {
  const state = stateFor(window);
  if (!state) return { canceled: true, error: true };
  const absolutePath = path.resolve(filePath);
  if (!supportedFileExtensions.has(path.extname(absolutePath).toLowerCase())) {
    throw new Error(t('invalidPathDetail'));
  }
  const stat = await fs.stat(absolutePath);
  if (!stat.isFile()) throw new Error(t('invalidPathDetail'));
  const content = await fs.readFile(absolutePath, 'utf8');
  state.currentFilePath = absolutePath;
  state.documentIsDirty = false;
  addRecentFile(absolutePath);
  sendDocumentMeta(window);
  return { content, filePath: absolutePath, name: displayName(absolutePath) };
}

function windowIsOccupied(window) {
  const state = stateFor(window);
  return Boolean(state && (state.currentFilePath || state.documentIsDirty));
}

function revealWindow(window) {
  if (!window || window.isDestroyed()) return;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}

function windowDisplayingPath(filePath) {
  return BrowserWindow.getAllWindows().find((window) => {
    const state = stateFor(window);
    return state?.currentFilePath && pathEquals(state.currentFilePath, filePath);
  }) || null;
}

function openPathFromSystem(filePath, preferredWindow = null) {
  if (!filePath) return;

  const existingWindow = windowDisplayingPath(filePath);
  if (existingWindow) {
    revealWindow(existingWindow);
    return;
  }

  const targetWindow = preferredWindow && !preferredWindow.isDestroyed() ? preferredWindow : focusedWindow();
  if (!targetWindow || windowIsOccupied(targetWindow)) {
    createWindow({ openPath: filePath });
    return;
  }

  revealWindow(targetWindow);
  sendCommand(targetWindow, 'load-path', filePath);
}

async function chooseOpenFile(event) {
  const window = windowFromEvent(event);
  const result = await dialog.showOpenDialog(window || undefined, {
    title: t('openDialogTitle'),
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
      { name: t('allFiles'), extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  return { canceled: false, filePath: result.filePaths[0] };
}

async function chooseSavePath(window, state) {
  const result = await dialog.showSaveDialog(window || undefined, {
    title: t('saveDialogTitle'),
    defaultPath: state.currentFilePath || t('untitled'),
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: t('text'), extensions: ['txt'] },
    ],
  });
  return result.canceled ? null : result.filePath;
}

async function writeFileAtomically(targetPath, content) {
  const directory = path.dirname(targetPath);
  const temporaryPath = path.join(
    directory,
    `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`,
  );

  try {
    await fs.writeFile(temporaryPath, content, 'utf8');
    const handle = await fs.open(temporaryPath, 'r+');
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(temporaryPath, targetPath);
  } finally {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
  }
}

async function saveMarkdown(window, content, saveAs = false) {
  const state = stateFor(window);
  if (!state) return { canceled: true, error: true };

  let targetPath = state.currentFilePath;
  if (saveAs || !targetPath) targetPath = await chooseSavePath(window, state);
  if (!targetPath) return { canceled: true };

  targetPath = path.resolve(targetPath);
  try {
    await writeFileAtomically(targetPath, content);
    state.currentFilePath = targetPath;
    state.documentIsDirty = false;
    addRecentFile(targetPath);
    await clearRecoveryForWindow(window);
    sendDocumentMeta(window);
    return { canceled: false, filePath: targetPath, name: displayName(targetPath) };
  } catch (error) {
    await showOperationError(window, t('saveErrorTitle'), t('saveErrorMessage'), error);
    return { canceled: true, error: true };
  }
}

function sendToMenuWindow(command) {
  return (_menuItem, browserWindow) => sendCommand(browserWindow || focusedWindow(), command);
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: t('file'),
      submenu: [
        { label: t('new'), accelerator: 'CmdOrCtrl+N', click: sendToMenuWindow('new') },
        { label: t('open'), accelerator: 'CmdOrCtrl+O', click: sendToMenuWindow('open') },
        { label: t('recent'), submenu: recentSubmenu() },
        { type: 'separator' },
        { label: t('save'), accelerator: 'CmdOrCtrl+S', click: sendToMenuWindow('save') },
        { label: t('saveAs'), accelerator: 'CmdOrCtrl+Shift+S', click: sendToMenuWindow('save-as') },
        ...(!isMac ? [{ type: 'separator' }, { role: 'quit', label: t('quit') }] : []),
      ],
    },
    {
      label: t('edit'),
      submenu: [
        { role: 'undo', label: t('undo') },
        { role: 'redo', label: t('redo') },
        { type: 'separator' },
        { label: t('find'), accelerator: 'CmdOrCtrl+F', click: sendToMenuWindow('find') },
        { label: t('replace'), accelerator: 'CmdOrCtrl+H', click: sendToMenuWindow('replace') },
        { type: 'separator' },
        { role: 'cut', label: t('cut') },
        { role: 'copy', label: t('copy') },
        { role: 'paste', label: t('paste') },
        { role: 'selectAll', label: t('selectAll') },
      ],
    },
    {
      label: t('view'),
      submenu: [
        { label: t('editor'), accelerator: 'CmdOrCtrl+1', click: sendToMenuWindow('view-editor') },
        { label: t('split'), accelerator: 'CmdOrCtrl+2', click: sendToMenuWindow('view-split') },
        { label: t('preview'), accelerator: 'CmdOrCtrl+3', click: sendToMenuWindow('view-preview') },
        { type: 'separator' },
        { label: t('toc'), accelerator: 'CmdOrCtrl+Shift+T', click: sendToMenuWindow('toc') },
        { type: 'separator' },
        ...(!isMac ? [{
          label: t('menuBar'),
          type: 'checkbox',
          checked: preferences.menuBarVisible,
          click: () => setMenuBarVisible(!preferences.menuBarVisible),
        }] : []),
        { role: 'togglefullscreen', label: t('fullscreen') },
      ],
    },
    {
      label: t('help'),
      submenu: [
        { label: t('shortcuts'), accelerator: 'CmdOrCtrl+/', click: sendToMenuWindow('help') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow(options = {}) {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 680,
    minHeight: 480,
    backgroundColor: '#f6f6f3',
    title: 'Mark',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: !app.isPackaged,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());

  const recoveryId = options.recovery?.recoveryId || crypto.randomUUID();
  windowStates.set(window.id, {
    currentFilePath: null,
    documentIsDirty: false,
    forceClose: false,
    pendingOpenPath: options.openPath || null,
    pendingRecovery: options.recovery || null,
    recoveryId,
  });

  window.webContents.on('before-input-event', (event, input) => {
    const primaryModifier = process.platform === 'darwin' ? input.meta : input.control;
    if (
      input.type === 'keyDown'
      && primaryModifier
      && input.shift
      && !input.alt
      && input.key.toLowerCase() === 'm'
    ) {
      event.preventDefault();
      setMenuBarVisible(!preferences.menuBarVisible);
    }
  });

  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  window.once('ready-to-show', () => {
    applyMenuBarVisibility(window);
    window.show();
  });

  window.on('close', async (event) => {
    const state = stateFor(window);
    if (!state || state.forceClose || !state.documentIsDirty) return;
    event.preventDefault();

    const result = await dialog.showMessageBox(window, {
      type: 'question',
      title: t('unsavedTitle'),
      message: t('closeQuestion'),
      detail: displayName(state),
      buttons: [t('saveButton'), t('discardButton'), t('cancelButton')],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    });

    if (result.response === 0) {
      sendCommand(window, 'save-and-close');
    } else if (result.response === 1) {
      await clearRecoveryForWindow(window);
      state.forceClose = true;
      window.close();
    }
  });

  window.on('closed', () => {
    windowStates.delete(window.id);
  });

  return window;
}

function decodeLinkTarget(href) {
  try {
    return decodeURIComponent(href);
  } catch {
    return href;
  }
}

function localTargetFromLink(href, baseFilePath) {
  const decodedHref = decodeLinkTarget(href).replace(/^<|>$/g, '');

  if (/^file:/i.test(decodedHref)) {
    try {
      return fileURLToPath(decodedHref);
    } catch {
      return null;
    }
  }

  if (/^[a-zA-Z]:[\\/]/.test(decodedHref) || /^\\\\/.test(decodedHref)) {
    return path.normalize(decodedHref);
  }

  if (path.isAbsolute(decodedHref)) return path.normalize(decodedHref);
  if (/^[a-z][a-z+.-]*:/i.test(decodedHref)) return null;
  if (!baseFilePath) return null;

  const withoutFragment = decodedHref.split('#')[0].split('?')[0];
  return path.resolve(path.dirname(baseFilePath), withoutFragment);
}

async function openLink(window, href) {
  if (typeof href !== 'string' || !href.trim()) return { ok: false };
  const trimmedHref = href.trim();

  if (trimmedHref.startsWith('#')) {
    return { ok: true, action: 'anchor', fragment: trimmedHref.slice(1) };
  }

  if (/^(https?:|mailto:)/i.test(trimmedHref)) {
    await shell.openExternal(trimmedHref);
    return { ok: true, action: 'external' };
  }

  const localTarget = localTargetFromLink(trimmedHref, stateFor(window)?.currentFilePath || null);
  if (!localTarget || !fsSync.existsSync(localTarget)) {
    await dialog.showMessageBox(window || undefined, {
      type: 'warning',
      title: t('missingLinkTitle'),
      message: t('missingLinkMessage'),
      detail: localTarget || trimmedHref,
      buttons: ['OK'],
      noLink: true,
    });
    return { ok: false };
  }

  let localStat;
  try {
    localStat = fsSync.statSync(localTarget);
  } catch {
    return { ok: false };
  }

  const targetExtension = path.extname(localTarget).toLowerCase();
  if (supportedFileExtensions.has(targetExtension) && localStat.isFile()) {
    return { ok: true, action: 'open-in-app', filePath: localTarget };
  }

  if (localStat.isFile() && blockedLaunchExtensions.has(targetExtension)) {
    await dialog.showMessageBox(window || undefined, {
      type: 'warning',
      title: t('blockedLaunchTitle'),
      message: t('blockedLaunchMessage'),
      detail: localTarget,
      buttons: ['OK'],
      noLink: true,
    });
    return { ok: false };
  }

  const errorMessage = await shell.openPath(localTarget);
  if (errorMessage) {
    await dialog.showMessageBox(window || undefined, {
      type: 'warning',
      title: t('openErrorTitle'),
      message: t('systemOpenMessage'),
      detail: errorMessage,
      buttons: ['OK'],
      noLink: true,
    });
    return { ok: false };
  }

  return { ok: true, action: 'system' };
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  pendingLaunchPath = filePathFromArguments(process.argv);

  app.on('second-instance', (_event, commandLine) => {
    const filePath = filePathFromArguments(commandLine);
    if (filePath) openPathFromSystem(filePath, focusedWindow());
    else {
      const window = focusedWindow();
      if (window) {
        if (window.isMinimized()) window.restore();
        window.show();
        window.focus();
      }
    }
  });

  app.whenReady().then(async () => {
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    appLocale = app.getLocale().toLowerCase().startsWith('fr') ? 'fr' : 'en';
    loadPreferences();
    buildMenu();

    const recoveries = await loadRecoveries();
    if (pendingLaunchPath) createWindow({ openPath: pendingLaunchPath });
    recoveries.forEach((recovery) => createWindow({ recovery }));
    if (!pendingLaunchPath && recoveries.length === 0) createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (app.isReady()) openPathFromSystem(filePath, focusedWindow());
  else pendingLaunchPath = filePath;
});

onTrusted('renderer:ready', (event) => {
  const window = windowFromEvent(event);
  const state = stateFor(window);
  if (!state) return;
  sendMenuBarState(window);
  if (state.pendingOpenPath) {
    sendCommand(window, 'load-path', state.pendingOpenPath);
    state.pendingOpenPath = null;
  }
});

handleTrusted('app:get-locale', () => appLocale);
handleTrusted('file:open', chooseOpenFile);
handleTrusted('file:load-path', async (event, filePath) => {
  const window = windowFromEvent(event);
  if (!filePath || typeof filePath !== 'string') return { canceled: true, error: true };
  try {
    return { canceled: false, ...(await readMarkdown(window, filePath)) };
  } catch (error) {
    await showOperationError(window, t('openErrorTitle'), t('openErrorMessage'), error);
    return { canceled: true, error: true };
  }
});
handleTrusted('file:save', (event, content) => saveMarkdown(windowFromEvent(event), String(content), false));
handleTrusted('file:save-as', (event, content) => saveMarkdown(windowFromEvent(event), String(content), true));
handleTrusted('document:confirm-discard', async (event) => {
  const window = windowFromEvent(event);
  const result = await dialog.showMessageBox(window || undefined, {
    type: 'warning',
    title: t('unsavedTitle'),
    message: t('continueWithoutSaving'),
    buttons: [t('continueButton'), t('cancelButton')],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
  });
  return result.response === 0;
});
onTrusted('document:state', (event, documentState) => {
  const window = windowFromEvent(event);
  const state = stateFor(window);
  if (!state) return;
  state.documentIsDirty = Boolean(documentState?.dirty);
  sendDocumentMeta(window);
});
onTrusted('document:new', (event) => {
  const window = windowFromEvent(event);
  const state = stateFor(window);
  if (!state) return;
  state.currentFilePath = null;
  state.documentIsDirty = false;
  sendDocumentMeta(window);
});
onTrusted('document:recover', (event, recoveredState) => {
  const window = windowFromEvent(event);
  const state = stateFor(window);
  if (!state) return;
  state.currentFilePath = typeof recoveredState?.filePath === 'string' ? recoveredState.filePath : null;
  state.documentIsDirty = true;
  state.pendingRecovery = null;
  sendDocumentMeta(window);
});
onTrusted('window:close-ready', (event) => {
  const window = windowFromEvent(event);
  const state = stateFor(window);
  if (!state) return;
  state.forceClose = true;
  window.close();
});
handleTrusted('menu:toggle', () => setMenuBarVisible(!preferences.menuBarVisible));
handleTrusted('menu:get-state', () => preferences.menuBarVisible);
handleTrusted('recovery:save', (event, recoveryState) => saveRecoveryForWindow(windowFromEvent(event), recoveryState));
handleTrusted('recovery:get', (event) => stateFor(windowFromEvent(event))?.pendingRecovery || null);
handleTrusted('recovery:clear', (event) => clearRecoveryForWindow(windowFromEvent(event)));
handleTrusted('recovery:confirm', async (event, recovery) => {
  const window = windowFromEvent(event);
  const timestamp = recovery?.updatedAt
    ? new Date(recovery.updatedAt).toLocaleString(appLocale === 'fr' ? 'fr-FR' : 'en-US')
    : t('unknownDate');
  const result = await dialog.showMessageBox(window || undefined, {
    type: 'question',
    title: t('recoveryTitle'),
    message: t('recoveryMessage', recovery?.name),
    detail: t('recoveryDetail', timestamp),
    buttons: [t('restoreButton'), t('ignoreButton')],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  return result.response === 0;
});
handleTrusted('shell:open-link', (event, href) => openLink(windowFromEvent(event), href));
