# CT-TopInfoBarFork

A SillyTavern/CozyTavern  extension that provides accessible info and dropdown selectors on the chat top bar. This fork of the original TopInfoBar extension is customized with a streamlined interface featuring quick access to OpenAI presets and connection profiles.

## Features

- **Top Info Bar**: A compact bar above the chat area with:
  - Sidebar toggle button
  - Chat name selector with dropdown for switching chats
  - Search functionality to highlight messages in chat
  - Quick access buttons for chat management (new, rename, delete, close)

- **Second Row with Dual Dropdown Selectors**:
  - **OpenAI Presets Selector**: Quick switch between Chat Completion presets
  - **Connection Profiles Selector**: Fast switching between connection profiles
  - Both selectors are synced with their native SillyTavern counterparts

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

- **Toggle Sidebar**: Click the archive icon (📦) on the left to show/hide the chat sidebar
- **Switch Chats**: Use the chat name dropdown to switch between different chats
- **Search**: Type in the search box to highlight matching text in messages
- **OpenAI Presets**: Use the first dropdown on the second row to quickly switch presets
- **Connection Profiles**: Use the second dropdown to switch connection profiles
- **Chat Actions**: Use the icons on the right for quick chat management

## Prerequisites

- SillyTavern (latest release version recommended)
- Works best with the CozyTavern fork

## Support and Contributions

For support or questions, please open an issue on the GitHub repository.

Contributions are welcome! Feel free to submit pull requests for bug fixes or new features.

## Changelog

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