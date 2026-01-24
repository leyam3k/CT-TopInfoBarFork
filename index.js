const {
    eventSource,
    event_types,
    getCurrentChatId,
    renameChat,
    openGroupChat,
    openCharacterChat,
    Popup,
} = SillyTavern.getContext();
import { getGroupPastChats } from '../../../group-chats.js';
import { getPastCharacterChats, animation_duration, animation_easing } from '../../../../script.js';
import { debounce, timestampToMoment, sortMoments, uuidv4, waitUntilCondition } from '../../../utils.js';
import { debounce_timeout } from '../../../constants.js';
import { t } from '../../../i18n.js';

const movingDivs = /** @type {HTMLDivElement} */ (document.getElementById('movingDivs'));
const sheld = /** @type {HTMLDivElement} */ (document.getElementById('sheld'));
const chat = /** @type {HTMLDivElement} */ (document.getElementById('chat'));
const draggableTemplate = /** @type {HTMLTemplateElement} */ (document.getElementById('generic_draggable_template'));

const topBar = document.createElement('div');
const chatName = document.createElement('div');
const connectionProfiles = document.createElement('div');
const connectionProfilesSelect = document.createElement('select');
const openaiPresetsSelect = document.createElement('select');

const icons = [
    {
        id: 'extensionTopBarGlobalSearch',
        icon: 'fa-fw fa-solid fa-magnifying-glass-plus',
        position: 'right',
        title: t`Toggle Global Web Search`,
        isToggle: true,
        target: '#websearch_enabled',
        isTemporaryAllowed: true,
        onClick: onGlobalSearchClick,
    },
    {
        id: 'extensionTopBarApiSearch',
        icon: 'fa-fw fa-solid fa-magnifying-glass-location',
        position: 'right',
        title: t`Toggle API-Specific Web Search`,
        isToggle: true,
        target: '#openai_enable_web_search',
        isTemporaryAllowed: true,
        onClick: onApiSearchClick,
    },
    {
        id: 'extensionTopBarBackToParent',
        icon: 'fa-fw fa-solid fa-left-long',
        position: 'right',
        title: t`Back to parent chat`,
        isTemporaryAllowed: true,
        onClick: onBackToParentClick,
    },
    {
        id: 'extensionTopBarRenameChat',
        icon: 'fa-fw fa-solid fa-edit',
        position: 'right',
        title: t`Rename chat`,
        onClick: onRenameChatClick,
    },
    {
        id: 'extensionTopBarNewChat',
        icon: 'fa-fw fa-solid fa-comments',
        position: 'right',
        title: t`New chat`,
        isTemporaryAllowed: true,
        onClick: onNewChatClick,
    },
    {
        id: 'extensionTopBarCloseChat',
        icon: 'fa-fw fa-solid fa-times',
        position: 'right',
        title: t`Close chat`,
        isTemporaryAllowed: true,
        onClick: onCloseChatClick,
    },
];

function onChatManagerClick() {
    document.getElementById('option_select_chat')?.click();
}

function onCloseChatClick() {
    document.getElementById('option_close_chat')?.click();
}

function onNewChatClick() {
    document.getElementById('option_start_new_chat')?.click();
}

async function onRenameChatClick() {
    const currentChatName = getCurrentChatId();

    if (!currentChatName) {
        return;
    }

    const newChatName = await Popup.show.input(t`Enter new chat name`, null, currentChatName);

    if (!newChatName || newChatName === currentChatName) {
        return;
    }

    await renameChat(currentChatName, String(newChatName));
}

function onGlobalSearchClick() {
    const globalSearchToggle = /** @type {HTMLInputElement} */ (document.getElementById('websearch_enabled'));
    if (globalSearchToggle) {
        globalSearchToggle.click();
        updateWebSearchIconsState();
    }
}

function onApiSearchClick() {
    const apiSearchIcon = document.getElementById('extensionTopBarApiSearch');
    if (apiSearchIcon?.classList.contains('disabled')) {
        return;
    }
    const apiSearchToggle = /** @type {HTMLInputElement} */ (document.getElementById('openai_enable_web_search'));
    if (apiSearchToggle) {
        apiSearchToggle.click();
        updateWebSearchIconsState();
    }
}

function onBackToParentClick() {
    const backToParentIcon = document.getElementById('extensionTopBarBackToParent');
    if (backToParentIcon?.classList.contains('disabled')) {
        return;
    }
    // Trigger the native back to main button from SillyTavern
    document.getElementById('option_back_to_main')?.click();
}

/**
 * Updates the state of the Back to Parent Chat button based on whether the current chat has a parent.
 */
function updateBackToParentState() {
    const backToParentIcon = document.getElementById('extensionTopBarBackToParent');
    if (!backToParentIcon) {
        return;
    }

    const context = SillyTavern.getContext();
    const chatMetadata = context.chatMetadata;

    // Check if we're in a checkpoint/fork chat (has a main_chat in metadata)
    const hasParentChat = chatMetadata && chatMetadata['main_chat'];

    backToParentIcon.classList.toggle('disabled', !hasParentChat);

    // Update title to indicate why it's disabled
    if (hasParentChat) {
        backToParentIcon.title = t`Back to parent chat` + `: ${chatMetadata['main_chat']}`;
    } else {
        backToParentIcon.title = t`Back to parent chat` + ` (${t`not in a branch/checkpoint chat`})`;
    }
}

const updateBackToParentStateDebounced = debounce(updateBackToParentState, 150);

function updateWebSearchIconsState() {
    // Global Search Icon
    const globalSearchToggle = /** @type {HTMLInputElement} */ (document.getElementById('websearch_enabled'));
    const globalSearchIcon = document.getElementById('extensionTopBarGlobalSearch');
    if (globalSearchToggle && globalSearchIcon) {
        globalSearchIcon.classList.toggle('active', globalSearchToggle.checked);
    }

    // API-Specific Search Icon
    const apiSearchToggle = /** @type {HTMLInputElement} */ (document.getElementById('openai_enable_web_search'));
    const apiSearchIcon = document.getElementById('extensionTopBarApiSearch');
    if (apiSearchToggle && apiSearchIcon) {
        const apiSearchContainer = apiSearchToggle.closest('.range-block[data-source]');
        const isAvailable = apiSearchContainer && getComputedStyle(apiSearchContainer).display !== 'none';

        apiSearchIcon.classList.toggle('disabled', !isAvailable);

        if (isAvailable) {
            apiSearchIcon.classList.toggle('active', apiSearchToggle.checked);
        } else {
            apiSearchIcon.classList.remove('active');
        }
    }
}

const updateWebSearchIconsStateDebounced = debounce(updateWebSearchIconsState, 150);

function patchSheldIfNeeded() {
    // Fun fact: sheld is a typo. It should be shell.
    // It was fixed in OG TAI long ago, but we still have it here.
    if (!sheld) {
        console.error('Sheld not found. Did you finally rename it?');
        return;
    }

    const computedStyle = getComputedStyle(sheld);
    // Alert: We're not in a version that switched sheld to flex yet.
    if (computedStyle.display === 'grid') {
        sheld.classList.add('flexPatch');
    }
}

function setChatName(name) {
    const isNotInChat = !name;
    chatName.textContent = name || t`No chat selected`;
    chatName.classList.toggle('not-in-chat', isNotInChat);

    icons.forEach(icon => {
        const iconElement = document.getElementById(icon.id);
        if (iconElement && !icon.isTemporaryAllowed) {
            iconElement.classList.toggle('not-in-chat', isNotInChat);
        }
    });

    if (!isNotInChat) {
        setTimeout(async () => {
            await populateSideBar();
        }, 0);
    }

    if (isNotInChat) {
        setTimeout(() => populateSideBar(), 0);
    }
}

async function getChatFiles() {
    const context = SillyTavern.getContext();
    const chatId = getCurrentChatId();

    if (!chatId) {
        return [];
    }

    if (context.groupId) {
        return await getGroupPastChats(context.groupId);
    }

    if (context.characterId !== undefined) {
        return await getPastCharacterChats(context.characterId);
    }

    return [];
}

const updateStatusDebounced = debounce(onOnlineStatusChange, 1000);

function addTopBar() {
    chatName.id = 'extensionTopBarChatName';
    chatName.title = t`Click to view chat files`;
    topBar.id = 'extensionTopBar';
    topBar.append(chatName);
    sheld.insertBefore(topBar, chat);
}

function addIcons() {
    icons.forEach(icon => {
        const iconElement = document.createElement('i');
        iconElement.id = icon.id;
        iconElement.className = icon.icon;
        iconElement.title = icon.title;
        iconElement.tabIndex = 0;
        iconElement.classList.add('right_menu_button');
        iconElement.addEventListener('click', () => {
            if (iconElement.classList.contains('not-in-chat')) {
                return;
            }
            icon.onClick();
        });
        if (icon.position === 'left') {
            topBar.insertBefore(iconElement, chatName);
            return;
        }
        if (icon.position === 'right') {
            topBar.appendChild(iconElement);
            return;
        }
        if (icon.id === 'extensionTopBarRenameChat' && typeof renameChat !== 'function') {
            iconElement.classList.add('displayNone');
        }
    });
}

function addSideBar() {
    if (!draggableTemplate) {
        console.warn(t`Draggable template not found. Side bar will not be added.`);
        return;
    }

    const fragment = /** @type {DocumentFragment} */ (draggableTemplate.content.cloneNode(true));
    const draggable = fragment.querySelector('.draggable');
    const closeButton = fragment.querySelector('.dragClose');

    if (!draggable || !closeButton) {
        console.warn(t`Failed to find draggable or close button. Side bar will not be added.`);
        return;
    }

    draggable.id = 'extensionSideBar';
    closeButton.addEventListener('click', closeSidebar);

    const scrollContainer = document.createElement('div');
    scrollContainer.id = 'extensionSideBarContainer';
    draggable.appendChild(scrollContainer);

    const loaderContainer = document.createElement('div');
    loaderContainer.id = 'extensionSideBarLoader';
    draggable.appendChild(loaderContainer);

    const loaderIcon = document.createElement('i');
    loaderIcon.className = 'fa-2x fa-solid fa-gear fa-spin';
    loaderContainer.appendChild(loaderIcon);

    movingDivs.appendChild(draggable);
}

function addConnectionProfiles() {
    connectionProfiles.id = 'extensionConnectionProfiles';
    connectionProfilesSelect.id = 'extensionConnectionProfilesSelect';
    connectionProfilesSelect.title = t`Switch connection profile`;
    openaiPresetsSelect.id = 'extensionOpenaiPresetsSelect';
    openaiPresetsSelect.title = t`Switch OpenAI preset`;

    connectionProfiles.classList.add('visible'); // Make it permanently visible
    connectionProfiles.append(openaiPresetsSelect, connectionProfilesSelect);
    sheld.insertBefore(connectionProfiles, chat);
}

function bindConnectionProfilesSelect() {
    waitUntilCondition(() => document.getElementById('connection_profiles') !== null).then(() => {
        const connectionProfilesMainSelect = /** @type {HTMLSelectElement} */ (document.getElementById('connection_profiles'));
        if (!connectionProfilesMainSelect) {
            return;
        }
        connectionProfilesSelect.addEventListener('change', async () => {
            connectionProfilesMainSelect.value = connectionProfilesSelect.value;
            connectionProfilesMainSelect.dispatchEvent(new Event('change'));
            updateWebSearchIconsStateDebounced();
        });
        connectionProfilesMainSelect.addEventListener('change', async () => {
            connectionProfilesSelect.value = connectionProfilesMainSelect.value;
            updateWebSearchIconsStateDebounced();
        });
        const observer = new MutationObserver(() => {
            connectionProfilesSelect.innerHTML = connectionProfilesMainSelect.innerHTML;
            connectionProfilesSelect.value = connectionProfilesMainSelect.value;
        });
        observer.observe(connectionProfilesMainSelect, { childList: true });
    });

    // Bind OpenAI presets select
    waitUntilCondition(() => document.getElementById('settings_preset_openai') !== null).then(() => {
        const openaiPresetsMainSelect = /** @type {HTMLSelectElement} */ (document.getElementById('settings_preset_openai'));
        if (!openaiPresetsMainSelect) {
            return;
        }
        // Initial sync
        openaiPresetsSelect.innerHTML = openaiPresetsMainSelect.innerHTML;
        openaiPresetsSelect.value = openaiPresetsMainSelect.value;

        openaiPresetsSelect.addEventListener('change', async () => {
            openaiPresetsMainSelect.value = openaiPresetsSelect.value;
            openaiPresetsMainSelect.dispatchEvent(new Event('change'));
            updateWebSearchIconsStateDebounced();
        });
        openaiPresetsMainSelect.addEventListener('change', async () => {
            openaiPresetsSelect.value = openaiPresetsMainSelect.value;
            updateWebSearchIconsStateDebounced();
        });
        const observer = new MutationObserver(() => {
            openaiPresetsSelect.innerHTML = openaiPresetsMainSelect.innerHTML;
            openaiPresetsSelect.value = openaiPresetsMainSelect.value;
        });
        observer.observe(openaiPresetsMainSelect, { childList: true });
    });
}

async function bindWebSearchToggles() {
    await waitUntilCondition(() =>
        document.getElementById('websearch_enabled') &&
        document.getElementById('openai_enable_web_search'),
    );

    const toggles = [
        { el: /** @type {HTMLInputElement} */ (document.getElementById('websearch_enabled')) },
        { el: /** @type {HTMLInputElement} */ (document.getElementById('openai_enable_web_search')) },
    ];

    toggles.forEach(toggle => {
        if (toggle.el) {
            toggle.el.addEventListener('change', updateWebSearchIconsState);
        }
    });

    // Watch for API search container visibility changes
    const apiSearchContainer = document.getElementById('openai_enable_web_search')?.closest('.range-block[data-source]');
    if (apiSearchContainer) {
        const observer = new MutationObserver(updateWebSearchIconsState);
        observer.observe(apiSearchContainer, { attributes: true, attributeFilter: ['style'] });
    }

    updateWebSearchIconsState();
}

async function closeSidebar() {
    const sidebar = document.getElementById('extensionSideBar');

    if (!sidebar) {
        return;
    }

    const alreadyVisible = sidebar.classList.contains('visible');
    if (!alreadyVisible) {
        return;
    }

    const keyframes = [
        { opacity: 1 },
        { opacity: 0 },
    ];
    const options = {
        duration: animation_duration,
        easing: animation_easing,
    };

    const animation = sidebar.animate(keyframes, options);
    await animation.finished;
    sidebar.classList.remove('visible');
    const container = document.getElementById('extensionSideBarContainer');
    if (container) {
        container.innerHTML = '';
    }
}

async function populateSideBar() {
    const sidebar = document.getElementById('extensionSideBar');
    const loader = document.getElementById('extensionSideBarLoader');
    const container = document.getElementById('extensionSideBarContainer');

    if (!loader || !container || !sidebar) {
        return;
    }

    if (!sidebar.classList.contains('visible')) {
        container.innerHTML = '';
        return;
    }

    loader.classList.add('displayNone');
    const processId = uuidv4();
    const scrollTop = container.scrollTop;
    const prettify = x => {
        x.last_mes = timestampToMoment(x.last_mes);
        x.file_name = String(x.file_name).replace('.jsonl', '');
        return x;
    };
    container.dataset.processId = processId;
    const chatId = getCurrentChatId();
    const chats = (await getChatFiles()).map(prettify).sort((a, b) => sortMoments(a.last_mes, b.last_mes));

    if (container.dataset.processId !== processId) {
        console.log(t`Aborting populateSideBar due to process id mismatch`);
        return;
    }

    container.innerHTML = '';

    for (const chat of chats) {
        const sideBarItem = document.createElement('div');
        sideBarItem.classList.add('sideBarItem');

        sideBarItem.addEventListener('click', async () => {
            if (chat.file_name === chatId || sideBarItem.classList.contains('selected')) {
                return;
            }

            container.childNodes.forEach(x => x instanceof HTMLElement && x.classList.remove('selected'));
            sideBarItem.classList.add('selected');
            await openChatById(chat.file_name);
        });

        const isSelected = chat.file_name === chatId;
        sideBarItem.classList.toggle('selected', isSelected);

        const chatName = document.createElement('div');
        chatName.classList.add('chatName');
        chatName.textContent = chat.file_name;
        chatName.title = chat.file_name;

        const chatDate = document.createElement('small');
        chatDate.classList.add('chatDate');
        chatDate.textContent = chat.last_mes.format('l');
        chatDate.title = chat.last_mes.format('LL LT');

        const chatNameContainer = document.createElement('div');
        chatNameContainer.classList.add('chatNameContainer');
        chatNameContainer.append(chatName, chatDate);

        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chatMessage');
        chatMessage.textContent = chat.mes;
        chatMessage.title = chat.mes;

        const chatStats = document.createElement('div');
        chatStats.classList.add('chatStats');

        const counterBlock = document.createElement('div');
        counterBlock.classList.add('counterBlock');

        const counterIcon = document.createElement('i');
        counterIcon.classList.add('fa-solid', 'fa-comment', 'fa-xs');

        const counterText = document.createElement('small');
        counterText.textContent = chat.chat_items;

        counterBlock.append(counterIcon, counterText);

        const fileSizeText = document.createElement('small');
        fileSizeText.classList.add('fileSize');
        fileSizeText.textContent = chat.file_size;

        chatStats.append(counterBlock, fileSizeText);

        const chatMessageContainer = document.createElement('div');
        chatMessageContainer.classList.add('chatMessageContainer');
        chatMessageContainer.append(chatMessage, chatStats);

        sideBarItem.append(chatNameContainer, chatMessageContainer);
        container.appendChild(sideBarItem);
    }

    container.scrollTop = scrollTop;

    /** @type {HTMLElement} */
    const selectedElement = container.querySelector('.selected');
    const isSelectedElementVisible = selectedElement && selectedElement.offsetTop >= container.scrollTop && selectedElement.offsetTop <= container.scrollTop + container.clientHeight;
    if (!isSelectedElementVisible) {
        container.scrollTop = selectedElement.offsetTop - container.clientHeight / 2;
    }

    loader.classList.add('displayNone');
}

async function openChatById(chatId) {
    const context = SillyTavern.getContext();

    if (!chatId) {
        return;
    }

    if (typeof openGroupChat === 'function' && context.groupId) {
        await openGroupChat(context.groupId, chatId);
        return;
    }

    if (typeof openCharacterChat === 'function' && context.characterId !== undefined) {
        await openCharacterChat(chatId);
        return;
    }
}

async function onOnlineStatusChange() {
    const connectionProfilesMainSelect = /** @type {HTMLSelectElement} */ (document.getElementById('connection_profiles'));
    if (connectionProfilesMainSelect) {
        connectionProfilesSelect.innerHTML = connectionProfilesMainSelect.innerHTML;
        connectionProfilesSelect.value = connectionProfilesMainSelect.value;
    } else {
        connectionProfilesSelect.classList.add('displayNone');
    }

    const openaiPresetsMainSelect = /** @type {HTMLSelectElement} */ (document.getElementById('settings_preset_openai'));
    if (openaiPresetsMainSelect) {
        openaiPresetsSelect.innerHTML = openaiPresetsMainSelect.innerHTML;
        openaiPresetsSelect.value = openaiPresetsMainSelect.value;
    } else {
        openaiPresetsSelect.classList.add('displayNone');
    }
}

// Init extension on load
(async function () {
    patchSheldIfNeeded();
    addTopBar();
    addIcons();
    addSideBar();
    addConnectionProfiles();
    setChatName(getCurrentChatId());
    chatName.addEventListener('click', () => {
        if (!chatName.classList.contains('not-in-chat')) {
            onChatManagerClick();
        }
    });
    const setChatNameDebounced = debounce(() => setChatName(getCurrentChatId()), debounce_timeout.short);
    for (const eventName of [event_types.CHAT_CHANGED, event_types.CHAT_DELETED, event_types.GROUP_CHAT_DELETED]) {
        eventSource.on(eventName, setChatNameDebounced);
        eventSource.on(eventName, updateBackToParentStateDebounced);
    }
    eventSource.once(event_types.APP_READY, () => {
        bindConnectionProfilesSelect();
        bindWebSearchToggles();
        updateBackToParentState();
    });
    eventSource.on(event_types.ONLINE_STATUS_CHANGED, updateStatusDebounced);
})();
