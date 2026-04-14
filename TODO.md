# Minecraft Star Launcher TODO

## Working Directory Changes Plan (Approved - In Progress)

### Step 1: Create Missing Directories [x]
- backend/
- launcher/assets/
- launcher/servers/
- launcher/website-dist/
- launcher/data/

### Step 2: Initialize Backend [x]
- Create backend/package.json
- Create backend/server.js (Express API)

### Step 3: Update Website Build [Skipped - already targets launcher/website-dist/]
- Edit website/package.json build script to target launcher/website-dist/

### Step 4: Organize Launcher Data [x]
- Move launcher/mods.json → launcher/data/mods.json
- Create launcher/assets/icon.png (placeholder)

### Step 5: Update Root Configs/Docs [x]
- Edit root package.json (postinstall)
- Edit README.md (add backend instructions)
- Edit .gitignore (add new dirs)

### Step 6: Test Changes [Partial - npm install running; website deps need retry]
- npm install
- cd website && npm run build:launcher
- npm run dev

### Step 7: Git Commit [ ]
- git add .
- git commit -m \"Restructure working dir: launcher/website/backend\"

Track by marking [x] when complete.

