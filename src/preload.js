'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('markdownApp', {
  getLocale: () => ipcRenderer.invoke('app:get-locale'),
  openFile: () => ipcRenderer.invoke('file:open'),
  loadPath: (filePath) => ipcRenderer.invoke('file:load-path', filePath),
  saveFile: (content) => ipcRenderer.invoke('file:save', content),
  saveFileAs: (content) => ipcRenderer.invoke('file:save-as', content),
  confirmDiscard: () => ipcRenderer.invoke('document:confirm-discard'),
  setDocumentState: (state) => ipcRenderer.send('document:state', state),
  resetDocument: () => ipcRenderer.send('document:new'),
  adoptRecoveredDocument: (state) => ipcRenderer.send('document:recover', state),
  closeReady: () => ipcRenderer.send('window:close-ready'),
  rendererReady: () => ipcRenderer.send('renderer:ready'),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  openLink: (href) => ipcRenderer.invoke('shell:open-link', href),
  toggleMenuBar: () => ipcRenderer.invoke('menu:toggle'),
  getMenuBarState: () => ipcRenderer.invoke('menu:get-state'),
  togglePinnedFile: () => ipcRenderer.invoke('files:toggle-pin'),
  saveRecovery: (state) => ipcRenderer.invoke('recovery:save', state),
  getRecovery: () => ipcRenderer.invoke('recovery:get'),
  clearRecovery: () => ipcRenderer.invoke('recovery:clear'),
  confirmRecovery: (recovery) => ipcRenderer.invoke('recovery:confirm', recovery),
  onCommand: (callback) => {
    const listener = (_event, command, payload) => callback(command, payload);
    ipcRenderer.on('command', listener);
    return () => ipcRenderer.removeListener('command', listener);
  },
  onDocumentMeta: (callback) => {
    const listener = (_event, meta) => callback(meta);
    ipcRenderer.on('document-meta', listener);
    return () => ipcRenderer.removeListener('document-meta', listener);
  },
  onMenuBarState: (callback) => {
    const listener = (_event, visible) => callback(Boolean(visible));
    ipcRenderer.on('menu-bar-state', listener);
    return () => ipcRenderer.removeListener('menu-bar-state', listener);
  },
});
