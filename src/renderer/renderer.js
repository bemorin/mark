'use strict';

/* global marked, DOMPurify */

const app = document.getElementById('app');
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const fileName = document.getElementById('fileName');
const pinButton = document.getElementById('pinButton');
const dirtyDot = document.getElementById('dirtyDot');
const counts = document.getElementById('counts');
const saveStatus = document.getElementById('saveStatus');
const viewSwitchButtons = [...document.querySelectorAll('.view-switch-button')];
const tocButton = document.getElementById('tocButton');
const helpButton = document.getElementById('helpButton');
const menuButton = document.getElementById('menuButton');
const helpDialog = document.getElementById('helpDialog');
const closeHelp = document.getElementById('closeHelp');
const tocDialog = document.getElementById('tocDialog');
const closeToc = document.getElementById('closeToc');
const tocList = document.getElementById('tocList');
const tocEmpty = document.getElementById('tocEmpty');
const dropOverlay = document.getElementById('dropOverlay');
const previewPane = document.querySelector('.preview-pane');
const previewEditButton = document.getElementById('previewEditButton');
const findBar = document.getElementById('findBar');
const findInput = document.getElementById('findInput');
const findCount = document.getElementById('findCount');
const findPreviousButton = document.getElementById('findPrevious');
const findNextButton = document.getElementById('findNext');
const closeFindButton = document.getElementById('closeFind');
const toggleReplaceButton = document.getElementById('toggleReplace');
const replaceRow = document.getElementById('replaceRow');
const replaceInput = document.getElementById('replaceInput');
const replaceOneButton = document.getElementById('replaceOne');
const replaceAllButton = document.getElementById('replaceAll');
const tocMoveConfirm = document.getElementById('tocMoveConfirm');
const tocMoveText = document.getElementById('tocMoveText');
const tocMoveCancel = document.getElementById('tocMoveCancel');
const tocMoveApply = document.getElementById('tocMoveApply');
const tocScroll = document.querySelector('.toc-scroll');

const translations = {
  fr: {
    untitled: 'Sans titre.md',
    defaultText: `# Bonjour

Écris ici. L’aperçu se met à jour en direct.

**Gras**, *italique*, [lien](https://example.com), listes, citations et code.

- minimal
- local
- rapide
`,
    editorPlaceholder: '# Commence à écrire…',
    tocOpen: 'Ouvrir la table des matières',
    tocButtonTitle: 'Table des matières — Ctrl/⌘ + Shift + T',
    helpOpen: 'Ouvrir l’aide',
    helpButtonTitle: 'Aide — Ctrl/⌘ + /',
    findReplace: 'Rechercher et remplacer',
    showReplace: 'Afficher le remplacement',
    hideReplace: 'Masquer le remplacement',
    findText: 'Texte à rechercher',
    findPlaceholder: 'Rechercher',
    previousOccurrence: 'Occurrence précédente',
    previousTitle: 'Précédente — Shift + Entrée',
    nextOccurrence: 'Occurrence suivante',
    nextTitle: 'Suivante — Entrée',
    closeSearch: 'Fermer la recherche',
    closeSearchTitle: 'Fermer — Échap',
    replaceText: 'Texte de remplacement',
    replacePlaceholder: 'Remplacer par',
    replaceOne: 'Remplacer',
    replaceAll: 'Tout',
    markdownEditor: 'Éditeur Markdown',
    markdownContent: 'Contenu Markdown',
    markdownPreview: 'Aperçu Markdown',
    saved: 'enregistré',
    viewSwitch: 'Changer de vue',
    viewEditorTitle: 'Éditeur — Ctrl/⌘ + 1',
    viewSplitTitle: 'Partagé — Ctrl/⌘ + 2',
    viewPreviewTitle: 'Aperçu — Ctrl/⌘ + 3',
    viewHelp: '<strong>Vues :</strong> en bas à droite, choisis <em>éditeur</em>, <em>partagé</em> ou <em>aperçu</em>. Raccourcis : <kbd>⌘/Ctrl</kbd> + <kbd>1</kbd>, <kbd>2</kbd> ou <kbd>3</kbd>.',
    helpEyebrow: 'Aide',
    helpTitle: 'Raccourcis et syntaxe',
    closeHelp: 'Fermer l’aide',
    formatHeading: 'Mettre en forme',
    syntaxMainTitle: 'Titre principal',
    syntaxNextLevel: 'Niveau suivant',
    syntaxBold: 'Texte important',
    syntaxItalic: 'Emphase légère',
    syntaxWebLink: 'Lien web',
    syntaxLocalLink: 'Fichier ou dossier',
    syntaxBullet: 'Liste à puces',
    syntaxTask: 'Case cliquable dans l’aperçu',
    syntaxQuote: 'Bloc de citation',
    syntaxInlineCode: 'Code en ligne',
    syntaxSeparator: 'Séparateur',
    shortcutsHeading: 'Raccourcis',
    actionNew: 'Nouveau',
    actionOpen: 'Ouvrir',
    actionSave: 'Enregistrer',
    actionSaveAs: 'Enregistrer sous',
    actionFindReplace: 'Rechercher / remplacer',
    actionOpenReplace: 'Ouvrir le remplacement',
    actionBold: 'Gras',
    actionItalic: 'Italique',
    actionLink: 'Lien',
    actionCode: 'Code',
    actionEditor: 'Éditeur',
    actionSplit: 'Vue partagée',
    actionPreview: 'Aperçu',
    actionToc: 'Table des matières',
    actionMenuBar: 'Barre de menus',
    actionHelp: 'Cette aide',
    pinFile: 'Épingler',
    unpinFile: 'Désépingler',
    pinNeedsFile: 'Enregistre le fichier pour l’épingler',
    pinLimit: '3 fichiers épinglés maximum',
    pinHelp: '<strong>Épinglés :</strong> l’épingle à gauche du nom du fichier ajoute le document ouvert à <em>Fichier → Épinglés</em> (3 maximum). Un second clic la retire.',
    previewEditHelp: '<strong>Aperçu éditable :</strong> survole un titre, un paragraphe, une liste, une citation, un tableau ou un bloc de code, puis clique sur le petit crayon qui apparaît à gauche. Valide avec <kbd>⌘/Ctrl</kbd> + <kbd>Entrée</kbd>, ou clique ailleurs.',
    tocDragHelp: '<strong>Réorganiser :</strong> ouvre la table des matières, puis fais glisser la poignée d’un titre. Le déplacement de toute sa section n’est appliqué qu’après validation.',
    recoveryHelp: 'Les changements non enregistrés sont copiés localement pour pouvoir être restaurés après une fermeture imprévue. Dépose un fichier <code>.md</code> dans la fenêtre pour le charger dans cette même fenêtre.',
    navigationEyebrow: 'Navigation',
    tocTitle: 'Table des matières',
    closeToc: 'Fermer la table des matières',
    documentHeadings: 'Titres du document',
    tocEmpty: 'Ajoute un titre avec <code># Titre</code> pour le voir ici.',
    cancel: 'Annuler',
    apply: 'Valider',
    dropToOpen: 'Déposer pour ouvrir',
    markDone: 'Marquer comme terminée',
    markUndone: 'Marquer comme non terminée',
    taskTitle: 'Cliquer pour modifier la tâche dans le document',
    editPreviewBlock: 'Modifier ce bloc dans l’aperçu',
    editPreviewBlockTitle: 'Modifier le Markdown de ce bloc',
    editBlock: 'Modifier le Markdown de ce bloc',
    savedTitle: 'Le document correspond à la dernière sauvegarde.',
    unsaved: 'non enregistré',
    modifiedContent: 'contenu modifié',
    previewModification: 'modification dans l’aperçu',
    deltaTitle: 'Écart net depuis la dernière ouverture ou sauvegarde.',
    documentUnsaved: 'Document non enregistré',
    word: 'mot',
    words: 'mots',
    line: 'ligne',
    lines: 'lignes',
    characters: 'caractères',
    viewEditor: 'éditeur',
    viewSplit: 'partagé',
    viewPreview: 'aperçu',
    linkPlaceholder: 'lien',
    codePlaceholder: 'code',
    textPlaceholder: 'texte',
    gotoLine: (line) => `Aller à la ligne ${line}`,
    lineShort: (line) => `L${line}`,
    dragHeading: (title) => `Déplacer la section « ${title} »`,
    moveBefore: (source, target) => `Déplacer « ${source} » avant « ${target} » ?`,
    moveAfter: (source, target) => `Déplacer « ${source} » après « ${target} » ?`,
    hideMenu: 'Masquer la barre de menus',
    showMenu: 'Afficher la barre de menus',
  },
  en: {
    untitled: 'Untitled.md',
    defaultText: `# Hello

Write here. The preview updates live.

**Bold**, *italic*, [link](https://example.com), lists, quotes and code.

- minimal
- local
- fast
`,
    editorPlaceholder: '# Start writing…',
    tocOpen: 'Open the table of contents',
    tocButtonTitle: 'Table of Contents — Ctrl/⌘ + Shift + T',
    helpOpen: 'Open help',
    helpButtonTitle: 'Help — Ctrl/⌘ + /',
    findReplace: 'Find and replace',
    showReplace: 'Show replace',
    hideReplace: 'Hide replace',
    findText: 'Text to find',
    findPlaceholder: 'Find',
    previousOccurrence: 'Previous occurrence',
    previousTitle: 'Previous — Shift + Enter',
    nextOccurrence: 'Next occurrence',
    nextTitle: 'Next — Enter',
    closeSearch: 'Close search',
    closeSearchTitle: 'Close — Escape',
    replaceText: 'Replacement text',
    replacePlaceholder: 'Replace with',
    replaceOne: 'Replace',
    replaceAll: 'All',
    markdownEditor: 'Markdown editor',
    markdownContent: 'Markdown content',
    markdownPreview: 'Markdown preview',
    saved: 'saved',
    viewSwitch: 'Change view',
    viewEditorTitle: 'Editor — Ctrl/⌘ + 1',
    viewSplitTitle: 'Split — Ctrl/⌘ + 2',
    viewPreviewTitle: 'Preview — Ctrl/⌘ + 3',
    viewHelp: '<strong>Views:</strong> at the bottom right, choose <em>editor</em>, <em>split</em> or <em>preview</em>. Shortcuts: <kbd>⌘/Ctrl</kbd> + <kbd>1</kbd>, <kbd>2</kbd> or <kbd>3</kbd>.',
    helpEyebrow: 'Help',
    helpTitle: 'Shortcuts and syntax',
    closeHelp: 'Close help',
    formatHeading: 'Formatting',
    syntaxMainTitle: 'Main heading',
    syntaxNextLevel: 'Next level',
    syntaxBold: 'Important text',
    syntaxItalic: 'Light emphasis',
    syntaxWebLink: 'Web link',
    syntaxLocalLink: 'File or folder',
    syntaxBullet: 'Bulleted list',
    syntaxTask: 'Clickable checkbox in preview',
    syntaxQuote: 'Block quote',
    syntaxInlineCode: 'Inline code',
    syntaxSeparator: 'Separator',
    shortcutsHeading: 'Shortcuts',
    actionNew: 'New',
    actionOpen: 'Open',
    actionSave: 'Save',
    actionSaveAs: 'Save as',
    actionFindReplace: 'Find / replace',
    actionOpenReplace: 'Open replace',
    actionBold: 'Bold',
    actionItalic: 'Italic',
    actionLink: 'Link',
    actionCode: 'Code',
    actionEditor: 'Editor',
    actionSplit: 'Split view',
    actionPreview: 'Preview',
    actionToc: 'Table of contents',
    actionMenuBar: 'Menu bar',
    actionHelp: 'This help',
    pinFile: 'Pin',
    unpinFile: 'Unpin',
    pinNeedsFile: 'Save the file to pin it',
    pinLimit: '3 pinned files maximum',
    pinHelp: '<strong>Pinned:</strong> the pin to the left of the file name adds the open document to <em>File → Pinned</em> (3 maximum). Click again to remove it.',
    previewEditHelp: '<strong>Editable preview:</strong> hover a heading, paragraph, list, quote, table or code block, then click the small pencil that appears on the left. Apply with <kbd>⌘/Ctrl</kbd> + <kbd>Enter</kbd>, or click elsewhere.',
    tocDragHelp: '<strong>Reorder:</strong> open the table of contents, then drag a heading handle. Its whole section moves only after you confirm.',
    recoveryHelp: 'Unsaved changes are copied locally so they can be restored after an unexpected close. Drop a <code>.md</code> file into the window to load it in that same window.',
    navigationEyebrow: 'Navigation',
    tocTitle: 'Table of Contents',
    closeToc: 'Close the table of contents',
    documentHeadings: 'Document headings',
    tocEmpty: 'Add a heading with <code># Title</code> to see it here.',
    cancel: 'Cancel',
    apply: 'Apply',
    dropToOpen: 'Drop to open',
    markDone: 'Mark as complete',
    markUndone: 'Mark as incomplete',
    taskTitle: 'Click to update the task in the document',
    editPreviewBlock: 'Edit this preview block',
    editPreviewBlockTitle: 'Edit the Markdown for this block',
    editBlock: 'Edit the Markdown for this block',
    savedTitle: 'The document matches the last saved version.',
    unsaved: 'unsaved',
    modifiedContent: 'content changed',
    previewModification: 'preview edit',
    deltaTitle: 'Net difference since the last open or save.',
    documentUnsaved: 'Unsaved document',
    word: 'word',
    words: 'words',
    line: 'line',
    lines: 'lines',
    characters: 'characters',
    viewEditor: 'editor',
    viewSplit: 'split',
    viewPreview: 'preview',
    linkPlaceholder: 'link',
    codePlaceholder: 'code',
    textPlaceholder: 'text',
    gotoLine: (line) => `Go to line ${line}`,
    lineShort: (line) => `L${line}`,
    dragHeading: (title) => `Move section “${title}”`,
    moveBefore: (source, target) => `Move “${source}” before “${target}”?`,
    moveAfter: (source, target) => `Move “${source}” after “${target}”?`,
    hideMenu: 'Hide the menu bar',
    showMenu: 'Show the menu bar',
  },
};

let locale = 'fr';
let numberFormatter = new Intl.NumberFormat('fr-FR');

function t(key, ...args) {
  const value = translations[locale]?.[key] ?? translations.fr[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
}

function applyTranslations() {
  document.documentElement.lang = locale;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((element) => {
    element.innerHTML = t(element.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  updatePinButton();

  const syntaxExamples = locale === 'fr'
    ? ['# Titre', '## Sous-titre', '**gras**', '*italique*', '[lien](https://…)', '[nom](<C:/dossier avec espaces>)', '- élément', '- [ ] tâche', '> citation', '`code`', '---']
    : ['# Title', '## Subtitle', '**bold**', '*italic*', '[link](https://…)', '[name](<C:/folder with spaces>)', '- item', '- [ ] task', '> quote', '`code`', '---'];
  document.querySelectorAll('.syntax-list code').forEach((element, index) => {
    if (syntaxExamples[index]) element.textContent = syntaxExamples[index];
  });
}
let currentFilePath = null;
let currentPinned = false;
let currentCanPin = false;
let savedContent = '';
let renderFrame = null;
let renderTimer = null;
let recoveryTimer = null;
const storedView = localStorage.getItem('mark:view');
let currentView = ['editor', 'split', 'preview'].includes(storedView) ? storedView : 'split';
let dragDepth = 0;
let scrollLock = false;
let lastReportedDirty = null;
let recoveryReady = false;
let lastRecoveryAt = 0;
let currentHeadings = [];
let currentSourceBlocks = [];
let activePreviewEdit = null;
let previewEditTarget = null;
let previewEditHideTimer = null;
let resetScrollAfterRender = false;
let findMatches = [];
let currentFindIndex = -1;
let tocDragState = null;
let pendingTocMove = null;

marked.setOptions({
  gfm: true,
  breaks: false,
});

function isMac() {
  return navigator.platform.toLowerCase().includes('mac');
}

function hasPrimaryModifier(event) {
  return isMac() ? event.metaKey : event.ctrlKey;
}

function expandBracketedWindowsPaths(markdownText) {
  return markdownText.replace(
    /\[([a-zA-Z]:\\[^\]\r\n]+)\](?!\s*\()/g,
    (_match, windowsPath) => {
      const label = windowsPath.replaceAll('\\', '\\\\');
      const target = windowsPath.replaceAll('\\', '/');
      return `[${label}](<${target}>)`;
    },
  );
}

function headingText(markdownText) {
  const inlineHtml = marked.parseInline(markdownText, { async: false });
  const parsedDocument = new DOMParser().parseFromString(inlineHtml, 'text/html');
  return (parsedDocument.body.textContent || '').trim();
}

function headingSlug(text, usedSlugs) {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
  const count = usedSlugs.get(base) || 0;
  usedSlugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function extractHeadings(markdownText) {
  const headings = [];
  const usedSlugs = new Map();
  const lines = markdownText.split('\n');
  let lineOffset = 0;
  let fenceCharacter = null;

  lines.forEach((line, index) => {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      const character = fence[1][0];
      if (!fenceCharacter) fenceCharacter = character;
      else if (fenceCharacter === character) fenceCharacter = null;
      lineOffset += line.length + 1;
      return;
    }

    if (!fenceCharacter) {
      const match = line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/);
      if (match) {
        const text = headingText(match[2]);
        if (text) {
          headings.push({
            level: match[1].length,
            text,
            id: `mm-${headingSlug(text, usedSlugs)}`,
            offset: lineOffset,
            line: index + 1,
          });
        }
      }
    }

    lineOffset += line.length + 1;
  });

  headings.forEach((heading, index) => {
    const nextPeer = headings.slice(index + 1).find((candidate) => candidate.level <= heading.level);
    heading.endOffset = nextPeer ? nextPeer.offset : markdownText.length;
  });

  return headings;
}

function decoratePreviewHeadings(headings) {
  const elements = [...preview.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  let cursor = 0;

  headings.forEach((heading, headingIndex) => {
    const expectedTag = `H${heading.level}`;
    let elementIndex = elements.findIndex((element, index) => (
      index >= cursor
      && element.tagName === expectedTag
      && element.textContent.trim() === heading.text
    ));

    if (elementIndex < 0) {
      elementIndex = elements.findIndex((element, index) => index >= cursor && element.tagName === expectedTag);
    }
    if (elementIndex < 0) return;

    const element = elements[elementIndex];
    element.id = heading.id;
    element.dataset.mmHeadingIndex = String(headingIndex);
    cursor = elementIndex + 1;
  });
}

function sanitizeMarkdown(markdownText) {
  const rawHtml = marked.parse(expandBracketedWindowsPaths(markdownText), { async: false });
  const parsedDocument = new DOMParser().parseFromString(rawHtml, 'text/html');

  parsedDocument.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.setAttribute('data-mm-href', href);
    link.setAttribute('href', '#');
    link.removeAttribute('target');
  });

  return DOMPurify.sanitize(parsedDocument.body.innerHTML, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'form'],
    FORBID_ATTR: ['style'],
    ADD_ATTR: ['data-mm-href'],
  });
}

function taskMatches() {
  return [...editor.value.matchAll(/^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/gm)];
}

function makeTaskCheckboxesInteractive() {
  const checkboxes = preview.querySelectorAll('input[type="checkbox"]');
  const matches = taskMatches();

  checkboxes.forEach((checkbox, index) => {
    const taskItem = checkbox.closest('li');
    taskItem?.classList.add('task-list-item');

    if (!matches[index]) return;
    checkbox.removeAttribute('disabled');
    checkbox.disabled = false;
    checkbox.tabIndex = 0;
    checkbox.dataset.taskIndex = String(index);
    checkbox.setAttribute('aria-disabled', 'false');
    checkbox.setAttribute('aria-label', checkbox.checked ? t('markUndone') : t('markDone'));
    checkbox.title = t('taskTitle');
  });
}

function extractSourceBlocks(markdownText) {
  const tokens = marked.lexer(markdownText, { gfm: true });
  const blocks = [];
  let cursor = 0;

  tokens.forEach((token) => {
    if (!token?.raw) return;
    const start = markdownText.indexOf(token.raw, cursor);
    if (start < 0) return;
    const end = start + token.raw.length;
    cursor = end;
    if (token.type === 'space' || token.type === 'def') return;
    blocks.push({
      start,
      end,
      raw: token.raw,
      type: token.type,
      depth: token.depth || null,
      ordered: Boolean(token.ordered),
    });
  });

  return blocks;
}

function blockMatchesElement(block, element) {
  const tag = element.tagName;
  if (block.type === 'heading') return tag === `H${block.depth}`;
  if (block.type === 'paragraph' || block.type === 'text') return tag === 'P';
  if (block.type === 'blockquote') return tag === 'BLOCKQUOTE';
  if (block.type === 'list') return tag === (block.ordered ? 'OL' : 'UL');
  if (block.type === 'code') return tag === 'PRE';
  if (block.type === 'table') return tag === 'TABLE';
  if (block.type === 'hr') return tag === 'HR';
  return false;
}

function decoratePreviewBlocks(blocks) {
  const elements = [...preview.children];
  let elementCursor = 0;

  blocks.forEach((block, blockIndex) => {
    const elementIndex = elements.findIndex((element, index) => (
      index >= elementCursor && blockMatchesElement(block, element)
    ));
    if (elementIndex < 0) return;

    const element = elements[elementIndex];
    element.dataset.mmBlockIndex = String(blockIndex);
    elementCursor = elementIndex + 1;
  });
}

function render() {
  renderFrame = null;
  activePreviewEdit = null;
  hidePreviewEditButton();
  currentHeadings = extractHeadings(editor.value);
  currentSourceBlocks = extractSourceBlocks(editor.value);
  preview.innerHTML = sanitizeMarkdown(editor.value);
  decoratePreviewHeadings(currentHeadings);
  decoratePreviewBlocks(currentSourceBlocks);
  makeTaskCheckboxesInteractive();
  if (!findBar.hidden) updatePreviewFindHighlights(false);
  if (tocDialog.open) renderTableOfContents();
  updateCounts();

  if (resetScrollAfterRender) {
    resetScrollAfterRender = false;
    scrollDocumentToTop();
  }
}

function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer);
  if (renderFrame) cancelAnimationFrame(renderFrame);
  const delay = editor.value.length > 250_000 ? 140 : 45;
  renderTimer = setTimeout(() => {
    renderTimer = null;
    renderFrame = requestAnimationFrame(render);
  }, delay);
}

function isDirty() {
  return editor.value !== savedContent;
}

function wordCount(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function signedNumber(value) {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : '−'}${numberFormatter.format(Math.abs(value))}`;
}

function updateSaveStatus() {
  const dirty = isDirty();
  saveStatus.classList.toggle('dirty', dirty);

  if (!dirty) {
    saveStatus.textContent = t('saved');
    saveStatus.title = t('savedTitle');
    return;
  }

  const wordsDelta = wordCount(editor.value) - wordCount(savedContent);
  const charactersDelta = editor.value.length - savedContent.length;
  const deltas = [];

  if (wordsDelta !== 0) deltas.push(`${signedNumber(wordsDelta)} ${t('words')}`);
  if (charactersDelta !== 0) deltas.push(`${signedNumber(charactersDelta)} ${t('characters')}`);

  saveStatus.textContent = deltas.length > 0
    ? `${t('unsaved')} · ${deltas.join(' · ')}`
    : `${t('unsaved')} · ${t('modifiedContent')}`;
  saveStatus.title = t('deltaTitle');
}

function syncDirtyState() {
  const dirty = isDirty();
  dirtyDot.classList.toggle('visible', dirty);
  updateSaveStatus();

  if (dirty !== lastReportedDirty) {
    lastReportedDirty = dirty;
    window.markdownApp.setDocumentState({ dirty });
  }
}

function updateCounts() {
  const words = wordCount(editor.value);
  const lines = editor.value.split('\n').length;
  counts.textContent = `${numberFormatter.format(words)} ${words === 1 ? t('word') : t('words')} · ${numberFormatter.format(lines)} ${lines === 1 ? t('line') : t('lines')}`;
  updateSaveStatus();
}

function updateFileMeta(name, filePathToShow) {
  fileName.textContent = name || t('untitled');
  fileName.title = filePathToShow || t('documentUnsaved');
  updatePinButton();
}

function updatePinButton() {
  if (!pinButton) return;
  const hasFile = Boolean(currentFilePath);
  pinButton.classList.toggle('is-pinned', currentPinned);
  pinButton.disabled = !hasFile || (!currentPinned && !currentCanPin);
  pinButton.setAttribute('aria-pressed', String(currentPinned));
  let label = t('pinFile');
  if (!hasFile) label = t('pinNeedsFile');
  else if (currentPinned) label = t('unpinFile');
  else if (!currentCanPin) label = t('pinLimit');
  pinButton.title = label;
  pinButton.setAttribute('aria-label', label);
}

function setView(view) {
  hidePreviewEditButton();
  const allowed = ['editor', 'split', 'preview'];
  const nextView = allowed.includes(view) ? view : 'split';
  if (activePreviewEdit && nextView === 'editor') finishPreviewBlockEdit(true);
  currentView = nextView;
  app.dataset.view = currentView;
  localStorage.setItem('mark:view', currentView);
  viewSwitchButtons.forEach((button) => {
    const active = button.dataset.view === currentView;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (currentView === 'editor') editor.focus();
}

function cancelPreviewEditHide() {
  if (!previewEditHideTimer) return;
  clearTimeout(previewEditHideTimer);
  previewEditHideTimer = null;
}

function hidePreviewEditButton() {
  cancelPreviewEditHide();
  previewEditTarget = null;
  previewEditButton.classList.remove('visible');
  previewEditButton.setAttribute('aria-hidden', 'true');
  previewEditButton.tabIndex = -1;
}

function schedulePreviewEditHide() {
  cancelPreviewEditHide();
  previewEditHideTimer = setTimeout(() => {
    previewEditHideTimer = null;
    hidePreviewEditButton();
  }, 140);
}

function positionPreviewEditButton(element) {
  if (!element?.isConnected) return;
  const paneRect = previewPane.getBoundingClientRect();
  const previewRect = preview.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight) || 24;
  const firstLineOffset = Math.max(0, Math.min(8, (lineHeight - 28) / 2));
  const top = elementRect.top - paneRect.top + previewPane.scrollTop + firstLineOffset;
  const left = Math.max(4, previewRect.left - paneRect.left + previewPane.scrollLeft - 34);

  previewEditButton.style.top = `${Math.round(top)}px`;
  previewEditButton.style.left = `${Math.round(left)}px`;
}

function showPreviewEditButton(element) {
  cancelPreviewEditHide();
  if (activePreviewEdit || !element?.dataset.mmBlockIndex) {
    hidePreviewEditButton();
    return;
  }
  previewEditTarget = element;
  positionPreviewEditButton(element);
  previewEditButton.classList.add('visible');
  previewEditButton.removeAttribute('aria-hidden');
  previewEditButton.tabIndex = 0;
}

function scrollDocumentToTop() {
  scrollLock = true;
  editor.scrollTop = 0;
  editor.scrollLeft = 0;
  previewPane.scrollTop = 0;
  previewPane.scrollLeft = 0;
  requestAnimationFrame(() => {
    editor.scrollTop = 0;
    previewPane.scrollTop = 0;
    scrollLock = false;
  });
}

function requestDocumentTopReset() {
  resetScrollAfterRender = true;
  scrollDocumentToTop();
}

function resizePreviewBlockEditor(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(72, Math.min(textarea.scrollHeight + 2, previewPane.clientHeight * 0.7))}px`;
}

function previewEditReplacement(edit) {
  return `${edit.textarea.value.replace(/\n+$/u, '')}${edit.trailingNewlines}`;
}

function finishPreviewBlockEdit(commit) {
  const edit = activePreviewEdit;
  if (!edit) return;
  activePreviewEdit = null;

  const { textarea, element, block } = edit;
  const replacement = previewEditReplacement(edit);
  textarea.remove();
  element.hidden = false;

  if (!commit || replacement === block.raw) {
    syncDirtyState();
    scheduleRecovery();
    return;
  }
  editor.setRangeText(replacement, block.start, block.end, 'end');
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function beginPreviewBlockEdit(element) {
  const blockIndex = Number(element.dataset.mmBlockIndex);
  const block = currentSourceBlocks[blockIndex];
  if (!block || activePreviewEdit) return;

  const trailingNewlines = block.raw.match(/\n+$/u)?.[0] || '';
  const textarea = document.createElement('textarea');
  textarea.className = 'preview-block-editor';
  textarea.value = trailingNewlines ? block.raw.slice(0, -trailingNewlines.length) : block.raw;
  textarea.setAttribute('aria-label', t('editBlock'));
  textarea.spellcheck = true;
  textarea.style.minHeight = `${Math.max(72, element.getBoundingClientRect().height + 24)}px`;

  activePreviewEdit = { textarea, element, block, trailingNewlines };
  element.before(textarea);
  element.hidden = true;
  resizePreviewBlockEditor(textarea);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  textarea.addEventListener('input', () => {
    resizePreviewBlockEditor(textarea);
    dirtyDot.classList.add('visible');
    saveStatus.classList.add('dirty');
    saveStatus.textContent = `${t('unsaved')} · ${t('previewModification')}`;
    window.markdownApp.setDocumentState({ dirty: true });

    cancelRecoveryTimer();
    recoveryTimer = setTimeout(() => {
      if (activePreviewEdit?.textarea !== textarea) return;
      const replacement = previewEditReplacement(activePreviewEdit);
      const recoveryContent = `${editor.value.slice(0, block.start)}${replacement}${editor.value.slice(block.end)}`;
      window.markdownApp.saveRecovery({
        dirty: true,
        content: recoveryContent,
        savedContent,
        filePath: currentFilePath,
        name: fileName.textContent,
      }).catch(console.error);
    }, 350);
  });
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      finishPreviewBlockEdit(false);
      return;
    }
    if (hasPrimaryModifier(event) && event.key === 'Enter') {
      event.preventDefault();
      finishPreviewBlockEdit(true);
    }
  });
  textarea.addEventListener('blur', () => {
    if (activePreviewEdit?.textarea === textarea) finishPreviewBlockEdit(true);
  });
}

function searchSeedFromSelection() {
  const selected = editor.value.slice(editor.selectionStart, editor.selectionEnd);
  return selected && selected.length <= 120 && !selected.includes('\n') ? selected : '';
}

function collectFindMatches(query) {
  if (!query) return [];
  const localeTag = locale === 'fr' ? 'fr-FR' : 'en-US';
  const source = editor.value.toLocaleLowerCase(localeTag);
  const needle = query.toLocaleLowerCase(localeTag);
  const matches = [];
  let position = 0;

  while (position <= source.length - needle.length) {
    const index = source.indexOf(needle, position);
    if (index < 0) break;
    matches.push({ start: index, end: index + query.length });
    position = index + Math.max(1, query.length);
  }
  return matches;
}

function clearPreviewFindHighlights() {
  preview.querySelectorAll('mark.mm-find-highlight').forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent || ''));
  });
  preview.normalize();
}

function updatePreviewFindHighlights(scrollActive = false) {
  clearPreviewFindHighlights();
  const query = findInput.value;
  if (findBar.hidden || !query) return;

  const needle = query.toLocaleLowerCase(locale === 'fr' ? 'fr-FR' : 'en-US');
  const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest('textarea, script, style, mark.mm-find-highlight')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  const highlights = [];

  textNodes.forEach((textNode) => {
    const value = textNode.nodeValue || '';
    const lower = value.toLocaleLowerCase(locale === 'fr' ? 'fr-FR' : 'en-US');
    const positions = [];
    let position = 0;
    while (position <= lower.length - needle.length) {
      const index = lower.indexOf(needle, position);
      if (index < 0) break;
      positions.push(index);
      position = index + Math.max(1, needle.length);
    }
    if (positions.length === 0) return;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    positions.forEach((index) => {
      fragment.append(document.createTextNode(value.slice(cursor, index)));
      const mark = document.createElement('mark');
      mark.className = 'mm-find-highlight';
      mark.textContent = value.slice(index, index + query.length);
      fragment.append(mark);
      highlights.push(mark);
      cursor = index + query.length;
    });
    fragment.append(document.createTextNode(value.slice(cursor)));
    textNode.replaceWith(fragment);
  });

  if (highlights.length === 0) return;
  const activeIndex = currentFindIndex < 0 ? 0 : currentFindIndex % highlights.length;
  const active = highlights[activeIndex];
  active.classList.add('active');
  if (scrollActive && currentView !== 'editor') {
    active.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }
}

function updateFindCount() {
  findCount.textContent = findMatches.length > 0
    ? `${currentFindIndex + 1} / ${findMatches.length}`
    : '0 / 0';
}

function scrollEditorToOffset(offset) {
  const lineHeight = Number.parseFloat(getComputedStyle(editor).lineHeight) || 24;
  const line = editor.value.slice(0, offset).split('\n').length - 1;
  editor.scrollTop = Math.max(0, (line * lineHeight) - (editor.clientHeight * 0.36));
}

function selectFindMatch(index, focusEditor = false, scrollPreview = false) {
  if (findMatches.length === 0) {
    currentFindIndex = -1;
    updateFindCount();
    updatePreviewFindHighlights(false);
    return;
  }

  currentFindIndex = ((index % findMatches.length) + findMatches.length) % findMatches.length;
  const match = findMatches[currentFindIndex];
  editor.setSelectionRange(match.start, match.end);
  scrollEditorToOffset(match.start);
  if (focusEditor) editor.focus({ preventScroll: true });
  updateFindCount();
  updatePreviewFindHighlights(scrollPreview);
}

function refreshFindResults(nextIndex = 0, focusEditor = false) {
  findMatches = collectFindMatches(findInput.value);
  if (findMatches.length === 0) {
    currentFindIndex = -1;
    updateFindCount();
    updatePreviewFindHighlights(false);
    return;
  }
  selectFindMatch(Math.min(Math.max(nextIndex, 0), findMatches.length - 1), focusEditor);
}

function setReplaceVisible(visible) {
  replaceRow.hidden = !visible;
  toggleReplaceButton.classList.toggle('expanded', visible);
  toggleReplaceButton.setAttribute('aria-label', visible ? t('hideReplace') : t('showReplace'));
  toggleReplaceButton.title = visible ? t('hideReplace') : t('showReplace');
}

function closeFind() {
  findBar.hidden = true;
  clearPreviewFindHighlights();
  editor.focus({ preventScroll: true });
}

function openFind(showReplace = false) {
  finishPreviewBlockEdit(true);
  if (helpDialog.open) helpDialog.close();
  if (tocDialog.open) tocDialog.close();
  if (currentView === 'preview') setView('split');

  const wasHidden = findBar.hidden;
  findBar.hidden = false;
  setReplaceVisible(showReplace || (!replaceRow.hidden && !wasHidden));
  if (wasHidden && !findInput.value) findInput.value = searchSeedFromSelection();
  refreshFindResults(0, false);
  findInput.focus();
  findInput.select();
}

function findNextMatch(direction = 1) {
  if (findMatches.length === 0) refreshFindResults(0, false);
  if (findMatches.length === 0) return;
  selectFindMatch(currentFindIndex + direction, false, true);
  findInput.focus();
}

function replaceCurrentMatch() {
  if (findMatches.length === 0 || currentFindIndex < 0) return;
  const matchIndex = currentFindIndex;
  const match = findMatches[matchIndex];
  editor.setRangeText(replaceInput.value, match.start, match.end, 'end');
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  refreshFindResults(matchIndex, false);
  replaceInput.focus();
}

function replaceAllMatches() {
  if (findMatches.length === 0) return;
  const source = editor.value;
  const replacement = replaceInput.value;
  let cursor = 0;
  let nextValue = '';

  findMatches.forEach((match) => {
    nextValue += source.slice(cursor, match.start);
    nextValue += replacement;
    cursor = match.end;
  });
  nextValue += source.slice(cursor);

  editor.value = nextValue;
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  refreshFindResults(0, false);
  replaceInput.focus();
}

function cancelRecoveryTimer() {
  if (!recoveryTimer) return;
  clearTimeout(recoveryTimer);
  recoveryTimer = null;
}

function scheduleRecovery() {
  if (!recoveryReady) return;
  cancelRecoveryTimer();

  if (!isDirty()) {
    window.markdownApp.clearRecovery().catch(console.error);
    return;
  }

  const elapsedSinceRecovery = Date.now() - lastRecoveryAt;
  const delay = lastRecoveryAt === 0 ? 0 : Math.min(700, Math.max(0, 2_000 - elapsedSinceRecovery));

  recoveryTimer = setTimeout(() => {
    recoveryTimer = null;
    if (!isDirty()) {
      lastRecoveryAt = 0;
      window.markdownApp.clearRecovery().catch(console.error);
      return;
    }
    lastRecoveryAt = Date.now();
    window.markdownApp.saveRecovery({
      dirty: true,
      content: editor.value,
      savedContent,
      filePath: currentFilePath,
      name: fileName.textContent,
    }).catch(console.error);
  }, delay);
}

async function updateDocument(data) {
  cancelRecoveryTimer();
  lastRecoveryAt = 0;
  editor.value = data.content;
  savedContent = data.content;
  currentFilePath = data.filePath || null;
  updateFileMeta(data.name, currentFilePath);
  await window.markdownApp.clearRecovery();
  syncDirtyState();
  requestDocumentTopReset();
  scheduleRender();
  editor.focus({ preventScroll: true });
  editor.setSelectionRange(0, 0);
}

async function mayReplaceDocument() {
  finishPreviewBlockEdit(true);
  if (!isDirty()) return true;
  return window.markdownApp.confirmDiscard();
}

async function newDocument() {
  if (!(await mayReplaceDocument())) return;
  cancelRecoveryTimer();
  lastRecoveryAt = 0;
  currentFilePath = null;
  currentPinned = false;
  currentCanPin = false;
  editor.value = '';
  savedContent = '';
  updateFileMeta(t('untitled'), null);
  window.markdownApp.resetDocument();
  await window.markdownApp.clearRecovery();
  syncDirtyState();
  requestDocumentTopReset();
  scheduleRender();
  editor.focus({ preventScroll: true });
  editor.setSelectionRange(0, 0);
}

async function openDocument() {
  finishPreviewBlockEdit(true);
  const result = await window.markdownApp.openFile();
  if (result?.canceled || !result?.filePath) return;
  await loadPathInCurrentWindow(result.filePath);
}

async function loadPathInCurrentWindow(filePathToOpen) {
  finishPreviewBlockEdit(true);
  if (!(await mayReplaceDocument())) return;
  try {
    const result = await window.markdownApp.loadPath(filePathToOpen);
    if (!result?.canceled) await updateDocument(result);
  } catch (error) {
    console.error(error);
  }
}

async function saveDocument(saveAs = false, closeAfter = false) {
  finishPreviewBlockEdit(true);
  cancelRecoveryTimer();
  const result = saveAs
    ? await window.markdownApp.saveFileAs(editor.value)
    : await window.markdownApp.saveFile(editor.value);

  if (result.canceled) {
    scheduleRecovery();
    return false;
  }
  savedContent = editor.value;
  lastRecoveryAt = 0;
  currentFilePath = result.filePath;
  updateFileMeta(result.name, currentFilePath);
  await window.markdownApp.clearRecovery();
  syncDirtyState();
  if (closeAfter) window.markdownApp.closeReady();
  return true;
}

function replaceSelection(before, after = '', placeholder = null) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selected = editor.value.slice(start, end) || placeholder || t('textPlaceholder');
  editor.setRangeText(`${before}${selected}${after}`, start, end, 'end');
  const contentStart = start + before.length;
  editor.setSelectionRange(contentStart, contentStart + selected.length);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function prefixSelectedLines(prefix) {
  const value = editor.value;
  const start = value.lastIndexOf('\n', editor.selectionStart - 1) + 1;
  const nextBreak = value.indexOf('\n', editor.selectionEnd);
  const end = nextBreak === -1 ? value.length : nextBreak;
  const selected = value.slice(start, end);
  const transformed = selected
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
  editor.setRangeText(transformed, start, end, 'select');
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function setHeading(level) {
  const value = editor.value;
  const start = value.lastIndexOf('\n', editor.selectionStart - 1) + 1;
  const nextBreak = value.indexOf('\n', editor.selectionEnd);
  const end = nextBreak === -1 ? value.length : nextBreak;
  const prefix = `${'#'.repeat(level)} `;
  const selected = value.slice(start, end);
  const transformed = selected
    .split('\n')
    .map((line) => `${prefix}${line.replace(/^#{1,6}\s+/, '')}`)
    .join('\n');
  editor.setRangeText(transformed, start, end, 'select');
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertTab(shiftKey) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  if (start === end && !shiftKey) {
    editor.setRangeText('  ', start, end, 'end');
  } else {
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = editor.value.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? editor.value.length : nextBreak;
    const block = editor.value.slice(lineStart, lineEnd);
    const transformed = block
      .split('\n')
      .map((line) => (shiftKey ? line.replace(/^ {1,2}/, '') : `  ${line}`))
      .join('\n');
    editor.setRangeText(transformed, lineStart, lineEnd, 'select');
  }
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function toggleTaskAtIndex(taskIndex, checked) {
  const match = taskMatches()[taskIndex];
  if (!match) return;
  const markerPosition = match.index + match[1].length;
  editor.setRangeText(checked ? 'x' : ' ', markerPosition, markerPosition + 1, 'preserve');
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function cancelPendingTocMove() {
  pendingTocMove = null;
  tocMoveConfirm.hidden = true;
  tocMoveText.textContent = '';
}

function clearTocDropIndicators() {
  tocList.querySelectorAll('.drop-before, .drop-after').forEach((item) => {
    item.classList.remove('drop-before', 'drop-after');
  });
}

function renderTableOfContents() {
  cancelPendingTocMove();
  tocList.replaceChildren();
  tocEmpty.hidden = currentHeadings.length > 0;

  const fragment = document.createDocumentFragment();
  currentHeadings.forEach((heading, index) => {
    const row = document.createElement('div');
    row.className = `toc-item level-${heading.level}`;
    row.dataset.headingIndex = String(index);
    row.dataset.headingId = heading.id;

    const jump = document.createElement('button');
    jump.type = 'button';
    jump.className = 'toc-jump';
    jump.dataset.headingIndex = String(index);
    jump.title = t('gotoLine', heading.line);

    const text = document.createElement('span');
    text.className = 'toc-item-text';
    text.textContent = heading.text;

    const line = document.createElement('span');
    line.className = 'toc-item-line';
    line.textContent = t('lineShort', heading.line);

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'toc-drag-handle';
    handle.dataset.headingIndex = String(index);
    handle.setAttribute('aria-label', t('dragHeading', heading.text));
    handle.title = t('dragHeading', heading.text);
    handle.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="4" r="1"></circle><circle cx="11" cy="4" r="1"></circle><circle cx="5" cy="8" r="1"></circle><circle cx="11" cy="8" r="1"></circle><circle cx="5" cy="12" r="1"></circle><circle cx="11" cy="12" r="1"></circle></svg>';

    jump.append(text, line);
    row.append(jump, handle);
    fragment.append(row);
  });
  tocList.append(fragment);
}

function isInvalidTocTarget(sourceIndex, targetIndex) {
  const source = currentHeadings[sourceIndex];
  const target = currentHeadings[targetIndex];
  if (!source || !target || sourceIndex === targetIndex) return true;
  return target.offset >= source.offset && target.offset < source.endOffset;
}

function updateTocDragGhost(clientX, clientY) {
  if (!tocDragState) return;
  const maxLeft = Math.max(12, window.innerWidth - tocDragState.ghost.offsetWidth - 12);
  const left = Math.min(Math.max(12, clientX - 28), maxLeft);
  const top = Math.min(
    Math.max(12, clientY - tocDragState.grabOffsetY),
    Math.max(12, window.innerHeight - tocDragState.ghost.offsetHeight - 12),
  );
  tocDragState.ghost.style.left = `${left}px`;
  tocDragState.ghost.style.top = `${top}px`;
}

function autoScrollToc(clientY) {
  const rect = tocScroll.getBoundingClientRect();
  const threshold = 46;
  if (clientY < rect.top + threshold) {
    tocScroll.scrollTop -= Math.ceil((rect.top + threshold - clientY) * 0.28);
  } else if (clientY > rect.bottom - threshold) {
    tocScroll.scrollTop += Math.ceil((clientY - (rect.bottom - threshold)) * 0.28);
  }
}

function beginTocDrag(event) {
  const handle = event.target.closest('.toc-drag-handle');
  if (!handle || event.button !== 0 || tocDragState) return;
  const sourceIndex = Number(handle.dataset.headingIndex);
  const source = currentHeadings[sourceIndex];
  const sourceRow = handle.closest('.toc-item');
  if (!source || !sourceRow) return;

  event.preventDefault();
  cancelPendingTocMove();
  const rect = sourceRow.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'toc-drag-ghost';
  ghost.textContent = source.text;
  ghost.style.width = `${Math.min(Math.max(rect.width - 16, 190), 430)}px`;
  document.body.append(ghost);

  sourceRow.classList.add('drag-source');
  tocDragState = {
    pointerId: event.pointerId,
    handle,
    sourceIndex,
    sourceRow,
    ghost,
    grabOffsetY: Math.min(Math.max(event.clientY - rect.top, 8), rect.height - 8),
    targetIndex: null,
    position: null,
  };
  try { handle.setPointerCapture?.(event.pointerId); } catch { /* Synthetic pointer or unsupported capture. */ }
  updateTocDragGhost(event.clientX, event.clientY);
}

function moveTocDrag(event) {
  if (!tocDragState || event.pointerId !== tocDragState.pointerId) return;
  event.preventDefault();
  updateTocDragGhost(event.clientX, event.clientY);
  autoScrollToc(event.clientY);
  clearTocDropIndicators();

  const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest('.toc-item');
  if (!targetRow || !tocList.contains(targetRow)) {
    tocDragState.targetIndex = null;
    tocDragState.position = null;
    return;
  }

  const targetIndex = Number(targetRow.dataset.headingIndex);
  if (isInvalidTocTarget(tocDragState.sourceIndex, targetIndex)) {
    tocDragState.targetIndex = null;
    tocDragState.position = null;
    return;
  }

  const rect = targetRow.getBoundingClientRect();
  const position = event.clientY < rect.top + (rect.height / 2) ? 'before' : 'after';
  targetRow.classList.add(position === 'before' ? 'drop-before' : 'drop-after');
  tocDragState.targetIndex = targetIndex;
  tocDragState.position = position;
}

function releaseTocGhost(state) {
  state.ghost.classList.add('releasing');
  setTimeout(() => state.ghost.remove(), 140);
}

function stageTocMove(sourceIndex, targetIndex, position) {
  const source = currentHeadings[sourceIndex];
  const target = currentHeadings[targetIndex];
  if (!source || !target || isInvalidTocTarget(sourceIndex, targetIndex)) return;
  pendingTocMove = { sourceIndex, targetIndex, position };
  tocMoveText.textContent = position === 'before'
    ? t('moveBefore', source.text, target.text)
    : t('moveAfter', source.text, target.text);
  tocMoveConfirm.hidden = false;
  tocMoveConfirm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function endTocDrag(event) {
  if (!tocDragState || event.pointerId !== tocDragState.pointerId) return;
  const state = tocDragState;
  tocDragState = null;
  try { state.handle.releasePointerCapture?.(event.pointerId); } catch { /* Pointer capture already released. */ }
  state.sourceRow.classList.remove('drag-source');
  clearTocDropIndicators();
  releaseTocGhost(state);

  if (state.targetIndex !== null && state.position) {
    stageTocMove(state.sourceIndex, state.targetIndex, state.position);
  }
}

function cancelTocDrag() {
  if (!tocDragState) return;
  const state = tocDragState;
  tocDragState = null;
  state.sourceRow.classList.remove('drag-source');
  clearTocDropIndicators();
  releaseTocGhost(state);
}

function captureTocRects() {
  return new Map([...tocList.querySelectorAll('.toc-item')].map((item) => [
    item.dataset.headingId,
    item.getBoundingClientRect(),
  ]));
}

function animateTocLayout(previousRects) {
  tocList.querySelectorAll('.toc-item').forEach((item) => {
    const previous = previousRects.get(item.dataset.headingId);
    if (!previous) return;
    const current = item.getBoundingClientRect();
    const deltaY = previous.top - current.top;
    if (Math.abs(deltaY) < 1) return;
    item.animate(
      [{ transform: `translateY(${deltaY}px)` }, { transform: 'translateY(0)' }],
      { duration: 220, easing: 'cubic-bezier(.2, .75, .25, 1)' },
    );
  });
}

function applyPendingTocMove() {
  if (!pendingTocMove) return;
  const { sourceIndex, targetIndex, position } = pendingTocMove;
  const source = currentHeadings[sourceIndex];
  const target = currentHeadings[targetIndex];
  if (!source || !target || isInvalidTocTarget(sourceIndex, targetIndex)) {
    cancelPendingTocMove();
    return;
  }

  const insertionOffset = position === 'before' ? target.offset : target.endOffset;
  if (insertionOffset >= source.offset && insertionOffset <= source.endOffset) {
    cancelPendingTocMove();
    return;
  }

  const previousRects = captureTocRects();
  const section = editor.value.slice(source.offset, source.endOffset);
  const withoutSection = `${editor.value.slice(0, source.offset)}${editor.value.slice(source.endOffset)}`;
  const adjustedInsertion = insertionOffset > source.endOffset
    ? insertionOffset - section.length
    : insertionOffset;
  const nextValue = `${withoutSection.slice(0, adjustedInsertion)}${section}${withoutSection.slice(adjustedInsertion)}`;

  cancelPendingTocMove();
  if (nextValue === editor.value) return;
  editor.value = nextValue;
  editor.setSelectionRange(adjustedInsertion, adjustedInsertion);
  editor.dispatchEvent(new Event('input', { bubbles: true }));

  if (renderTimer) clearTimeout(renderTimer);
  if (renderFrame) cancelAnimationFrame(renderFrame);
  renderTimer = null;
  renderFrame = null;
  render();
  requestAnimationFrame(() => animateTocLayout(previousRects));
}

function openHelp() {
  hidePreviewEditButton();
  finishPreviewBlockEdit(true);
  findBar.hidden = true;
  clearPreviewFindHighlights();
  if (tocDialog.open) tocDialog.close();
  if (!helpDialog.open) helpDialog.showModal();
}

function openTableOfContents() {
  hidePreviewEditButton();
  finishPreviewBlockEdit(true);
  findBar.hidden = true;
  if (helpDialog.open) helpDialog.close();
  if (renderTimer) {
    clearTimeout(renderTimer);
    renderTimer = null;
  }
  if (renderFrame) cancelAnimationFrame(renderFrame);
  render();
  renderTableOfContents();
  if (!tocDialog.open) tocDialog.showModal();
}

function scrollEditorToHeading(heading) {
  const lineHeight = Number.parseFloat(getComputedStyle(editor).lineHeight) || 24;
  editor.focus({ preventScroll: true });
  editor.setSelectionRange(heading.offset, heading.offset);
  editor.scrollTop = Math.max(0, ((heading.line - 1) * lineHeight) - (editor.clientHeight * 0.24));
}

function jumpToHeading(index) {
  const heading = currentHeadings[index];
  if (!heading) return;
  tocDialog.close();
  scrollLock = true;

  requestAnimationFrame(() => {
    if (currentView !== 'preview') scrollEditorToHeading(heading);
    if (currentView !== 'editor') {
      preview.querySelector(`[data-mm-heading-index="${index}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    requestAnimationFrame(() => { scrollLock = false; });
  });
}

function updateMenuButton(visible) {
  if (isMac()) {
    menuButton.hidden = true;
    return;
  }
  menuButton.classList.toggle('menu-hidden', !visible);
  menuButton.setAttribute('aria-label', visible ? t('hideMenu') : t('showMenu'));
  menuButton.title = `${visible ? t('hideMenu') : t('showMenu')} — Ctrl/⌘ + Shift + M`;
}

editor.addEventListener('input', () => {
  scheduleRender();
  syncDirtyState();
  scheduleRecovery();
  if (!findBar.hidden) refreshFindResults(Math.max(currentFindIndex, 0), false);
});

editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    insertTab(event.shiftKey);
    return;
  }

  if (!hasPrimaryModifier(event)) return;
  const key = event.key.toLowerCase();

  if (key === 'b') {
    event.preventDefault();
    replaceSelection('**', '**');
  } else if (key === 'i') {
    event.preventDefault();
    replaceSelection('*', '*');
  } else if (key === 'k') {
    event.preventDefault();
    replaceSelection('[', '](https://)', t('linkPlaceholder'));
  } else if (key === 'e') {
    event.preventDefault();
    replaceSelection('`', '`', t('codePlaceholder'));
  } else if (event.altKey && /^[1-6]$/.test(key)) {
    event.preventDefault();
    setHeading(Number(key));
  } else if (event.shiftKey && key === '7') {
    event.preventDefault();
    prefixSelectedLines('1. ');
  } else if (event.shiftKey && key === '8') {
    event.preventDefault();
    prefixSelectedLines('- ');
  }
});

function beginPreviewEditFromButton() {
  let element = previewEditTarget;
  if (!element) return;
  const blockIndex = element.dataset.mmBlockIndex;

  const hadPendingRender = Boolean(renderTimer || renderFrame);
  if (renderTimer) clearTimeout(renderTimer);
  if (renderFrame) cancelAnimationFrame(renderFrame);
  renderTimer = null;
  renderFrame = null;
  if (hadPendingRender) {
    render();
    element = preview.querySelector(`[data-mm-block-index="${blockIndex}"]`);
  }

  hidePreviewEditButton();
  if (element) beginPreviewBlockEdit(element);
}

previewPane.addEventListener('pointermove', (event) => {
  if (event.target.closest('#previewEditButton')) {
    cancelPreviewEditHide();
    return;
  }
  const element = event.target.closest('#preview [data-mm-block-index]');
  if (element) showPreviewEditButton(element);
  else schedulePreviewEditHide();
});
previewPane.addEventListener('pointerleave', hidePreviewEditButton);
previewEditButton.addEventListener('pointerenter', cancelPreviewEditHide);
previewEditButton.addEventListener('pointerleave', schedulePreviewEditHide);
previewEditButton.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  beginPreviewEditFromButton();
});
previewEditButton.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    hidePreviewEditButton();
    preview.focus({ preventScroll: true });
  }
});
window.addEventListener('resize', () => {
  if (previewEditTarget) positionPreviewEditButton(previewEditTarget);
});

preview.addEventListener('change', (event) => {
  const checkbox = event.target.closest('input[type="checkbox"][data-task-index]');
  if (!checkbox) return;
  toggleTaskAtIndex(Number(checkbox.dataset.taskIndex), checkbox.checked);
});

preview.addEventListener('click', async (event) => {
  if (event.target.closest('input[type="checkbox"]')) return;
  const link = event.target.closest('a[data-mm-href]');
  if (!link) return;
  event.preventDefault();
  const href = link.getAttribute('data-mm-href') || '';

  if (href.startsWith('#')) {
    const target = document.getElementById(href.slice(1));
    target?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const result = await window.markdownApp.openLink(href);
  if (result?.action === 'open-in-app' && result.filePath) {
    await loadPathInCurrentWindow(result.filePath);
  }
});

function syncScroll(source, target) {
  if (scrollLock) return;
  const maxSource = source.scrollHeight - source.clientHeight;
  const maxTarget = target.scrollHeight - target.clientHeight;
  if (maxSource <= 0 || maxTarget <= 0) return;
  scrollLock = true;
  target.scrollTop = (source.scrollTop / maxSource) * maxTarget;
  requestAnimationFrame(() => { scrollLock = false; });
}

editor.addEventListener('scroll', () => syncScroll(editor, previewPane));
previewPane.addEventListener('scroll', (event) => syncScroll(event.currentTarget, editor));

findInput.addEventListener('input', () => refreshFindResults(0, false));
findInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    findNextMatch(event.shiftKey ? -1 : 1);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeFind();
  }
});
replaceInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    replaceCurrentMatch();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeFind();
  }
});
findPreviousButton.addEventListener('click', () => findNextMatch(-1));
findNextButton.addEventListener('click', () => findNextMatch(1));
closeFindButton.addEventListener('click', closeFind);
toggleReplaceButton.addEventListener('click', () => {
  const visible = replaceRow.hidden;
  setReplaceVisible(visible);
  (visible ? replaceInput : findInput).focus();
});
replaceOneButton.addEventListener('click', replaceCurrentMatch);
replaceAllButton.addEventListener('click', replaceAllMatches);

tocButton.addEventListener('click', openTableOfContents);
helpButton.addEventListener('click', openHelp);
menuButton.addEventListener('click', async () => updateMenuButton(await window.markdownApp.toggleMenuBar()));
pinButton.addEventListener('click', async () => {
  const pin = await window.markdownApp.togglePinnedFile();
  currentPinned = Boolean(pin?.pinned);
  currentCanPin = Boolean(pin?.canPin);
  updatePinButton();
});
closeHelp.addEventListener('click', () => helpDialog.close());
closeToc.addEventListener('click', () => tocDialog.close());
helpDialog.addEventListener('click', (event) => {
  if (event.target === helpDialog) helpDialog.close();
});
tocDialog.addEventListener('click', (event) => {
  if (event.target === tocDialog) tocDialog.close();
});
tocDialog.addEventListener('close', () => {
  cancelTocDrag();
  cancelPendingTocMove();
});
tocList.addEventListener('click', (event) => {
  const item = event.target.closest('.toc-jump[data-heading-index]');
  if (item) jumpToHeading(Number(item.dataset.headingIndex));
});
tocList.addEventListener('pointerdown', beginTocDrag);
window.addEventListener('pointermove', moveTocDrag, { passive: false });
window.addEventListener('pointerup', endTocDrag);
window.addEventListener('pointercancel', endTocDrag);
tocMoveCancel.addEventListener('click', cancelPendingTocMove);
tocMoveApply.addEventListener('click', applyPendingTocMove);
viewSwitchButtons.forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (tocDragState) {
      event.preventDefault();
      cancelTocDrag();
      return;
    }
    if (pendingTocMove) {
      event.preventDefault();
      cancelPendingTocMove();
      return;
    }
    if (!findBar.hidden) {
      event.preventDefault();
      closeFind();
      return;
    }
    if (activePreviewEdit) {
      event.preventDefault();
      finishPreviewBlockEdit(false);
      return;
    }
  }

  if (!hasPrimaryModifier(event)) return;
  const key = event.key.toLowerCase();
  if (key === 'f') {
    event.preventDefault();
    openFind(false);
  } else if (key === 'h') {
    event.preventDefault();
    openFind(true);
  } else if (event.shiftKey && key === 't') {
    event.preventDefault();
    openTableOfContents();
  } else if (key === '/') {
    event.preventDefault();
    openHelp();
  } else if (key === '1') {
    event.preventDefault();
    setView('editor');
  } else if (key === '2') {
    event.preventDefault();
    setView('split');
  } else if (key === '3') {
    event.preventDefault();
    setView('preview');
  }
});

window.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dragDepth += 1;
  dropOverlay.classList.add('visible');
});
window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('dragleave', (event) => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dropOverlay.classList.remove('visible');
});
window.addEventListener('drop', async (event) => {
  event.preventDefault();
  dragDepth = 0;
  dropOverlay.classList.remove('visible');
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  const filePathToOpen = window.markdownApp.getPathForFile(file);
  if (filePathToOpen) await loadPathInCurrentWindow(filePathToOpen);
});

window.markdownApp.onCommand(async (command, payload) => {
  if (command === 'new') await newDocument();
  if (command === 'open') await openDocument();
  if (command === 'open-path') await loadPathInCurrentWindow(payload);
  if (command === 'load-path') await loadPathInCurrentWindow(payload);
  if (command === 'save') await saveDocument(false, false);
  if (command === 'save-as') await saveDocument(true, false);
  if (command === 'save-and-close') await saveDocument(false, true);
  if (command === 'view-editor') setView('editor');
  if (command === 'view-split') setView('split');
  if (command === 'view-preview') setView('preview');
  if (command === 'find') openFind(false);
  if (command === 'replace') openFind(true);
  if (command === 'toc') openTableOfContents();
  if (command === 'help') openHelp();
});

window.markdownApp.onDocumentMeta((meta) => {
  currentFilePath = meta.filePath || null;
  currentPinned = Boolean(meta.pinned);
  currentCanPin = Boolean(meta.canPin);
  updateFileMeta(meta.name, currentFilePath);
});

window.markdownApp.onMenuBarState(updateMenuButton);

async function initialize() {
  locale = (await window.markdownApp.getLocale()) === 'en' ? 'en' : 'fr';
  numberFormatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US');
  applyTranslations();

  const defaultText = t('defaultText');
  editor.value = defaultText;
  savedContent = defaultText;
  editor.placeholder = t('editorPlaceholder');
  updateFileMeta(t('untitled'), null);
  setView(currentView);
  render();

  updateMenuButton(await window.markdownApp.getMenuBarState());
  const recovery = await window.markdownApp.getRecovery();

  if (recovery) {
    const shouldRestore = await window.markdownApp.confirmRecovery(recovery);
    if (shouldRestore) {
      editor.value = recovery.content;
      savedContent = typeof recovery.savedContent === 'string' ? recovery.savedContent : '';
      currentFilePath = recovery.filePath || null;
      updateFileMeta(
        recovery.name || (currentFilePath ? currentFilePath.split(/[\\/]/).pop() : t('untitled')),
        currentFilePath,
      );
      window.markdownApp.adoptRecoveredDocument({ filePath: currentFilePath });
      render();
    } else {
      await window.markdownApp.clearRecovery();
    }
  }

  recoveryReady = true;
  syncDirtyState();
  window.markdownApp.rendererReady();
  editor.focus();
}

initialize().catch(console.error);
