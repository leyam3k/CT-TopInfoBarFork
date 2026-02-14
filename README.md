# CT-TopInfoBarFork

A SillyTavern/CozyTavern extension that provides accessible info and dropdown selectors on the chat top bar. This fork of the original TopInfoBar extension is customized with a streamlined interface featuring quick access to OpenAI presets and connection profiles.

## Features

- **Top Info Bar**: A compact bar above the chat area with:
  - Chat name display (click to open View Chat Files dialog)
  - Web search toggle buttons (Global Web Search and API-Specific Web Search)
  - Back to Parent Chat button (for navigating from checkpoint/fork chats back to the main chat)
  - Quick access buttons for chat management (rename, new, close)

- **Second Row with Four Dropdown Selectors**:
  - **Connection Profiles Selector** (35%): Fast switching between connection profiles
  - **OpenAI Presets Selector** (27.5%): Quick switch between Chat Completion presets
  - **World Info Presets Selector** (27.5%): Quick switch between World Info presets
  - **Regex Presets Selector** (10%): Quick switch between Regex presets
  - All selectors are synced with their native SillyTavern counterparts
  - Preset names starting with "Cozy" are automatically trimmed for cleaner display

- **Sidebar Panel**: A draggable panel showing all chats for the current character/group with:
  - Chat name and last message preview
  - Message count and file size
  - Last active date
  - Quick navigation between chats

## Installation and Usage

### Installation

1. Navigate to SillyTavern's Extensions menu
2. Use the "Install Extension" feature
3. Enter the repository URL: `https://github.com/leyam3k/CT-TopInfoBarFork`
4. Click Install

Alternatively, clone this repository directly into your SillyTavern's `public/scripts/extensions/third-party/` folder.

### Usage

Once installed, the extension automatically adds a top bar above your chat area:

- **View Chat Files**: Click on the chat name to open the View Chat Files dialog
- **Global Web Search**: Click the magnifying glass with plus icon to toggle global web search
- **API-Specific Web Search**: Click the magnifying glass with location icon to toggle API-specific web search (availability depends on selected API)
- **Back to Parent Chat**: Click the left arrow icon to return to the parent chat (only active when in a checkpoint/fork chat, dimmed otherwise)
- **Rename Chat**: Click the edit icon to rename the current chat
- **New Chat**: Click the comments icon to start a new chat
- **Close Chat**: Click the X icon to close the current chat
- **Connection Profiles**: Use the first dropdown (35% width) on the second row to switch connection profiles
- **OpenAI Presets**: Use the second dropdown (27.5% width) to quickly switch Chat Completion presets
- **World Info Presets**: Use the third dropdown (27.5% width) to quickly switch World Info presets
- **Regex Presets**: Use the fourth dropdown (10% width) to quickly switch Regex presets

## Prerequisites

- SillyTavern (latest release version recommended)
- Works best with the CozyTavern fork

## Support and Contributions

For support or questions, please open an issue on the GitHub repository.

Contributions are welcome! Feel free to submit pull requests for bug fixes or new features.

## Changelog

### v1.4.1

- **Neon Purple-Blue Theme Integration**: Completely redesigned border and glow styling to match the main UI's neon aesthetic:
  - Changed all border colors to neon purple-blue (`rgba(176, 160, 232, 0.6)`) for high visibility
  - Applied consistent neon theme across sidebar items, top bar, dropdown selectors, and icon buttons
  - Hover states feature enhanced neon glow effects with layered box-shadows
  - Hover backgrounds use `rgba(176, 160, 232, 0.25)` for subtle purple tint
  - Border hover states increase to `rgba(176, 160, 232, 0.6)` with glowing effect
- **Enhanced Icon Button Design**:
  - Added neon-styled box borders with rounded corners (4px border-radius)
  - Implemented neon glow shadow (`0 0 4px rgba(176, 160, 232, 0.2)`) for ambient lighting
  - Hover state includes multi-layered neon glow (`0 0 8px` and `0 0 12px`) for depth
  - Icon buttons feature 4px padding to prevent icons from touching borders
  - Proper flexbox centering for icon alignment
- **Improved Visual Feedback**:
  - Disabled buttons maintain neon border color but no longer show hover highlights
  - Selected sidebar items feature enhanced neon glow (`0 0 8px rgba(176, 160, 232, 0.3)`)
  - All transitions include box-shadow for smooth glow animations

### v1.4.0

- **Four Dropdown Selectors**: Expanded the second row to include four preset selectors with optimized space allocation:
  - **Connection Profiles** (35%): Maintains prominence as the primary selector
  - **OpenAI Presets** (27.5%): Chat Completion presets selector
  - **World Info Presets** (27.5%): Quick access to World Info preset switching
  - **Regex Presets** (10%): Compact Regex preset selector
- **"Cozy" Prefix Trimming**: Preset names starting with "Cozy" are automatically trimmed for cleaner display (e.g., "CozyPT_Base" displays as "PT_Base")
- **Improved Visual Design**:
  - Removed down arrow SVG icons to save space
  - Added full box borders (1px solid) with 4px border-radius for all selectors
  - Borders are always visible for better visual clarity
  - Added subtle background highlight on hover for improved interactivity
- **Seamless Integration**: All four selectors are fully synced with their native SillyTavern counterparts

**Technical Changes:**

- Added [`worldInfoPresetsSelect`](index.js:26) and [`regexPresetsSelect`](index.js:27) elements
- Added [`syncSelectWithTrimmedCozy()`](index.js:258) helper function to trim "Cozy" prefix from option text
- Updated [`addConnectionProfiles()`](index.js:322) to include all four selectors
- Updated [`bindConnectionProfilesSelect()`](index.js:338) to bind World Info and Regex preset selectors
- Updated [`onOnlineStatusChange()`](index.js:637) to sync all four selectors
- Updated CSS with flex-basis allocation: 35%, 27.5%, 27.5%, 10% for the four selectors
- Replaced down arrow SVG background images with box borders and border-radius
- Added hover effects with background color transitions
- World Info Presets uses `.stwip--preset` selector from CT-WorldInfoPresetsFork extension
- Regex Presets uses `#regex_presets` selector from the regex extension

### v1.3.0

- **Back to Parent Chat Button**: Added a new button to the top bar before the Rename Chat button:
  - **Back to Parent Chat**: Navigate from checkpoint/fork chats back to the main/parent chat
  - Button is automatically dimmed and disabled when not in a checkpoint chat
  - Hovering shows the parent chat name when available
- **Visual Feedback**: Button shows disabled state (dimmed, cursor: not-allowed) when current chat has no parent

**Technical Changes:**

- Added `extensionTopBarBackToParent` icon with `fa-left-long` icon
- Added `onBackToParentClick()` click handler that triggers `#option_back_to_main`
- Added `updateBackToParentState()` function to check `chatMetadata['main_chat']` for parent chat detection
- Added `updateBackToParentStateDebounced` for debounced state updates on chat changes
- Added CSS styles for `.disabled` state on back to parent button
- Button state updates on `CHAT_CHANGED`, `CHAT_DELETED`, and `GROUP_CHAT_DELETED` events

### v1.2.0

- **Web Search Toggle Buttons**: Added two new toggle buttons to the top bar before the Rename Chat button:
  - **Global Web Search**: Toggle the global web search feature (targets `#websearch_enabled`)
  - **API-Specific Web Search**: Toggle API-specific web search (targets `#openai_enable_web_search`), automatically disabled when not available for the selected API
- **Visual Feedback**: Toggle buttons show active state with highlight color when enabled
- **Smart Availability**: API-specific web search button is automatically disabled and dimmed when the feature is not available for the current API

**Technical Changes:**

- Added `extensionTopBarGlobalSearch` icon with `fa-magnifying-glass-plus` icon
- Added `extensionTopBarApiSearch` icon with `fa-magnifying-glass-location` icon
- Added `onGlobalSearchClick()` and `onApiSearchClick()` click handlers
- Added `updateWebSearchIconsState()` function to sync button states with checkboxes
- Added `updateWebSearchIconsStateDebounced` for debounced state updates
- Added `bindWebSearchToggles()` function to bind change listeners and MutationObserver
- Added CSS styles for `.active` and `.disabled` states on web search buttons
- Icons update state when presets or connection profiles change

### v1.1.0

- **Streamlined Top Bar**: Removed toggle sidebar button, search bar, View Chat Files button, and Delete Chat button for a cleaner interface
- **Reordered Buttons**: Rename Chat button now appears before New Chat button
- **Simplified Chat Name**: Chat name is now a clickable text that opens the View Chat Files dialog instead of a dropdown select
- **Code Cleanup**: Removed unused search functionality and related jQuery highlight code

**Technical Changes:**

- Removed `extensionTopBarToggleSidebar` icon
- Removed `extensionTopBarChatManager` icon (View Chat Files)
- Removed `extensionTopBarDeleteChat` icon
- Removed `searchInput` element and search functionality
- Removed jQuery highlight import and initialization
- Changed `chatName` from `<select>` to `<div>` element
- Chat name click now triggers `onChatManagerClick()` to open View Chat Files
- Removed `savePanelsState()` and `restorePanelsState()` functions
- Updated CSS to remove search input styles and simplify chat name styles

### v1.0.0

- **Permanent Second Row**: The connection profiles row is now always visible (removed toggle functionality)
- **Removed Status Display**: Removed the `extensionConnectionProfilesIcon` and `extensionConnectionProfilesStatus` elements for a cleaner interface
- **Added OpenAI Presets Selector**: New dropdown selector for Chat Completion presets, placed before the connection profiles selector
- **Equal Width Dropdowns**: Both the OpenAI Presets and Connection Profiles selectors now share equal space on the second row
- **Streamlined UI**: Removed the toggle button for the second row from the top bar icons
- **Code Cleanup**: Removed unused functions and variables related to the status display and toggle functionality

**Technical Changes:**

- Removed `extensionTopBarToggleConnectionProfiles` icon from the icons array
- Removed `connectionProfilesStatus` and `connectionProfilesIcon` elements
- Added `openaiPresetsSelect` element with ID `extensionOpenaiPresetsSelect`
- Added binding logic for OpenAI presets to sync with `#settings_preset_openai`
- Updated `addConnectionProfiles()` to add `visible` class by default
- Simplified `onOnlineStatusChange()` to only handle dropdown syncing
- Updated `savePanelsState()` and `restorePanelsState()` to only handle sidebar state
- Combined CSS styles for both dropdown selectors with `flex: 1` and `width: 50%`

## License

AGPLv3
