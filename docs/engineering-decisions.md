# Engineering decisions

Mark is intentionally small, so its architecture should be easy to explain. These notes capture decisions where product quality, security, or simplicity required a real tradeoff.

## 1. Keep documents local by default

**Problem**  
A writing tool should feel immediate and trustworthy. Accounts, sync state, and network failure modes add product surface area and privacy questions that are not required for the core job.

**Decision**  
Keep editing, recovery, preferences, and file operations local. The renderer has no network access; web links are delegated to the operating system.

**Alternative rejected**  
Cloud documents, mandatory accounts, or built-in sync in the first product surface.

**Tradeoff**  
Users remain responsible for their backup or sync strategy, and collaboration is outside the current scope.

**What I'd change now**  
Nothing without evidence. If cross-device loss repeatedly becomes a user problem, add an explicit optional integration point before making cloud state a prerequisite for editing.

## 2. Treat Markdown as untrusted input

**Problem**  
Markdown can contain HTML and links. A desktop shell has more privilege than a normal web page, so a rendering bug should not become a filesystem or process compromise.

**Decision**  
Run the renderer sandboxed with Node.js integration disabled and context isolation enabled. Render Markdown through Marked, sanitize the resulting HTML with DOMPurify, deny unexpected navigation and permission requests, and validate IPC senders before privileged operations.

**Alternative rejected**  
Expose filesystem APIs directly to the renderer for convenience.

**Tradeoff**  
The preload bridge and IPC layer add code and require deliberate API design.

**What I'd change now**  
If the privileged surface grows, split IPC contracts into small domain modules and add contract tests rather than widening the bridge.

## 3. Let the document be the workspace

**Problem**  
Long Markdown files need structure, but a permanent project sidebar or workspace model adds visual and conceptual weight for users who only want to work with a file.

**Decision**  
Derive an on-demand table of contents directly from headings. Let it navigate and reorder complete sections, then disappear when it is no longer needed.

**Alternative rejected**  
A persistent navigation sidebar, project database, or proprietary document hierarchy.

**Tradeoff**  
Navigation is one action away instead of permanently visible, and structure depends on meaningful Markdown headings.

**What I'd change now**  
Add more persistent structure only if real usage shows that repeated outline access is a larger cost than the extra chrome.

## 4. Edit preview blocks without becoming a WYSIWYG editor

**Problem**  
Direct manipulation in the preview is useful, but a full rich-text editor can silently rewrite Markdown and make source output unpredictable.

**Decision**  
Map rendered blocks back to their source ranges and edit the Markdown for one block at a time.

**Alternative rejected**  
Use a contenteditable-based rich-text model as the primary document representation.

**Tradeoff**  
Editing is less visually seamless than a true WYSIWYG experience, but Markdown remains the source of truth.

**What I'd change now**  
Improve source mapping incrementally for complex nested structures. Adopt a structured document model only if user demand clearly outweighs the loss of source fidelity and added complexity.

## 5. Recovery is not autosave

**Problem**  
Writers need protection from crashes, but silently overwriting the user's file can be surprising and can interfere with external tools or version control.

**Decision**  
Write a separate local recovery copy while the document is dirty. Explicit Save remains the action that changes the user's file.

**Alternative rejected**  
Continuously overwrite the open file after every edit.

**Tradeoff**  
There are two states to manage: the real file and the recovery copy.

**What I'd change now**  
If recovery data becomes large or numerous, add retention limits and integrity metadata before changing the save model.

## 6. Use Electron, but define “lightweight” precisely

**Problem**  
The product needs polished desktop behavior on Windows, macOS, and Linux without maintaining three UI implementations. Electron solves that, but it carries a larger binary and memory footprint than a native shell.

**Decision**  
Use Electron for the desktop shell while keeping runtime dependencies limited to the Markdown parser and sanitizer. Optimize scope, background activity, dependency count, and document responsiveness instead of claiming a tiny binary.

**Alternative rejected**  
Build three native clients before validating the product surface, or optimize for installer size at the expense of iteration speed and cross-platform consistency.

**Tradeoff**  
The application distribution remains heavier than a small native editor.

**What I'd change now**  
Measure cold start, idle memory/CPU, installer size, and large-document latency on real machines. Reconsider the shell only if measured footprint becomes a meaningful user problem rather than an aesthetic concern.
