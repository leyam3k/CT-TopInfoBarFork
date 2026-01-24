const {
    eventSource,
    event_types,
    getCurrentChatId,
    renameChat,
    getRequestHeaders,
    openGroupChat,
    openCharacterChat,
    executeSlashCommandsWithOptions,
    Popup,
} = SillyTavern.getContext();
import { addJQueryHighlight } from './jquery-highlight.js';
import { getGroupPastChats } from '../../../group-chats.js';
import { getPastCharacterChats, animation_duration, animation_easing, getGeneratingApi } from '../../../../script.js';
import { debounce, timestampToMoment, sortMoments, uuidv4, waitUntilCondition } from '../../../utils.js';
// MODIFICATION: Added debounce_timeout back for robust event handling
import { debounce_timeout } from '../../../constants.js';
import { t } from '../../../i18n.js';

const movingDivs = /** @type {HTMLDivElement} */ (document.getElementById('movingDivs'));
const sheld = /** @type {HTMLDivElement} */ (document.getElementById('sheld'));
const chat = /** @type {HTMLDivElement} */ (document.getElementById('chat'));
const draggableTemplate = /** @type {HTMLTemplateElement} */ (document.getElementById('generic_draggable_template'));
const apiBlock = /** @type {HTMLDivElement} */ (document.getElementById('rm_api_block'));

const topBar = document.createElement('div');
const chatNameContainer = document.createElement('div');
const chatNameText = document.createElement('div');
const searchInput = document.createElement('input');
const connectionProfiles = document.createElement('div');
const presetsSelect = document.createElement('select');
const connectionProfilesSelect = document.createElement('select');
const quickSettingsIconsContainer = document.createElement('div');
const connectionProfilesIcon = document.createElement('img');

const icons = [
    {
        id: 'extensionTopBarPresetSaver',
        icon: 'fa-fw fa-solid fa-floppy-disk',
        position: 'right',
        title: 'Preset & Connection Saver',
        onClick: onPresetSaverClick,
    },
    {
        id: 'extensionTopBarAfterResponse',
        icon: 'fa-fw fa-solid fa-angles-right',
        position: 'right',
        title: 'After Response',
        onClick: onAfterResponseClick,
    },
    {
        id: 'extensionTopBarCharNotes',
        icon: 'fa-fw fa-solid fa-clipboard',
        position: 'right',
        title: t`Character Notes`,
        onClick: onCharNotesClick,
    },
    {
        id: 'extensionTopBarNewChat',
        icon: 'fa-fw fa-solid fa-comments',
        position: 'right',
        title: t`New chat`,
        onClick: onNewChatClick,
    },
    {
        id: 'extensionTopBarRenameChat',
        icon: 'fa-fw fa-solid fa-edit',
        position: 'right',
        title: t`Rename chat`,
        onClick: onRenameChatClick,
    },
    {
        id: 'extensionTopBarDeleteChat',
        icon: 'fa-fw fa-solid fa-trash',
        position: 'right',
        title: t`Delete chat`,
        onClick: async () => {
            const confirm = await Popup.show.confirm(t`Are you sure?`);
            if (confirm) {
                await executeSlashCommandsWithOptions('/delchat');
            }
        },
    },
    {
        id: 'extensionTopBarCloseChat',
        icon: 'fa-fw fa-solid fa-times',
        position: 'right',
        title: t`Close chat`,
        onClick: onCloseChatClick,
    },
];

function onPresetSaverClick() {
    document.querySelector('#pcs-menu-item')?.click();
}

function onAfterResponseClick() {
    document.querySelector('#ar-menu-item')?.click();
}

function onCharNotesClick() {
    document.querySelector('.stqq--toggle')?.click();
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

function patchSheldIfNeeded() {
    if (!sheld) {
        console.error('Sheld not found. Did you finally rename it?');
        return;
    }

    const computedStyle = getComputedStyle(sheld);
    if (computedStyle.display === 'grid') {
        sheld.classList.add('flexPatch');
    }
}

function setChatName(name) {
    const isNotInChat = !name;
    const currentName = name || t`No chat selected`;
    chatNameText.innerText = currentName;
    chatNameContainer.title = currentName;

    icons.forEach(icon => {
        const iconElement = document.getElementById(icon.id);
        if (iconElement) {
            iconElement.classList.toggle('not-in-chat', isNotInChat);
        }
    });
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

/**
 * Highlight search query in chat messages
 * @param {string} query Search query
 * @returns {void}
 */
function searchInChat(query) {
    const options = { element: 'mark', className: 'highlight' };
    const messages = jQuery(chat).find('.mes_text');
    messages.unhighlight(options);
    if (!query) {
        return;
    }
    const splitQuery = query.split(/\s|\b/);
    messages.highlight(splitQuery, options);
}

const searchDebounced = debounce((x) => searchInChat(x), 500);

const updateStatusAndIconsDebounced = debounce(() => {
    onOnlineStatusChange();
    updateQuickSettingIconsState();
}, 1000);

// MODIFICATION: Added a debounced updater specifically for the icons to react to preset changes.
const updateQuickSettingIconsStateDebounced = debounce(updateQuickSettingIconsState, 150);

const setChatNameDebounced = debounce(() => setChatName(getCurrentChatId()), debounce_timeout.short);

function addTopBar() {
    chatNameContainer.id = 'extensionTopBarChatNameContainer';
    chatNameText.id = 'extensionTopBarChatName';

    const chatNameIcon = document.createElement('i');
    chatNameIcon.className = 'fa-solid fa-xs fa-caret-down';
    chatNameIcon.title = t`Open Chat Drawer`;

    chatNameContainer.append(chatNameText, chatNameIcon);

    topBar.id = 'extensionTopBar';
    searchInput.id = 'extensionTopBarSearchInput';
    searchInput.placeholder = 'Search...';
    searchInput.classList.add('text_pole');
    searchInput.type = 'search';
    searchInput.addEventListener('input', () => searchDebounced(searchInput.value.trim()));
    topBar.append(chatNameContainer, searchInput);
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

        if (icon.position === 'right') {
            topBar.appendChild(iconElement);
            return;
        }
        if (icon.position === 'middle') {
            topBar.insertBefore(iconElement, searchInput);
            return;
        }
        if (icon.id === 'extensionTopBarRenameChat' && typeof renameChat !== 'function') {
            iconElement.classList.add('displayNone');
        }
    });
}

function addConnectionProfiles() {
    connectionProfiles.id = 'extensionConnectionProfiles';
    presetsSelect.id = 'extensionTopBarPresetsSelect';
    presetsSelect.title = t`Switch chat completion preset`;
    connectionProfilesSelect.id = 'extensionConnectionProfilesSelect';

    const presetsContainer = document.createElement('div');
    presetsContainer.id = 'extensionPresetsContainer';

    const presetsDropdownIcon = document.createElement('i');
    presetsDropdownIcon.id = 'extensionPresetsDropdownIcon';
    presetsDropdownIcon.className = 'fa-solid fa-xs fa-caret-down';
    presetsDropdownIcon.title = t`Select a chat preset`;

    presetsContainer.append(presetsSelect, presetsDropdownIcon);

    const connectionProfilesSelectContainer = document.createElement('div');
    connectionProfilesSelectContainer.id = 'extensionConnectionProfilesSelectContainer';

    const connectionProfileDropdownIcon = document.createElement('i');
    connectionProfileDropdownIcon.id = 'extensionConnectionProfilesDropdownIcon';
    connectionProfileDropdownIcon.className = 'fa-solid fa-xs fa-caret-down';
	connectionProfileDropdownIcon.title = t`Select a connection preset`;

    connectionProfilesSelectContainer.append(connectionProfilesSelect, connectionProfileDropdownIcon);

    quickSettingsIconsContainer.id = 'quickSettingsIconsContainer';
    const quickSettingsIcons = [
        { id: 'quickSettingStream', icon: 'fa-solid fa-faucet', title: t`Toggle Streaming`, target: '#stream_toggle' },
        { id: 'quickSettingGlobalSearch', icon: 'fa-solid fa-magnifying-glass-plus', title: t`Toggle Global Web Search`, target: '#websearch_enabled' },
        { id: 'quickSettingApiSearch', icon: 'fa-solid fa-magnifying-glass-location', title: t`Toggle API-Specific Web Search`, target: '#openai_enable_web_search' },
    ];

    quickSettingsIcons.forEach(data => {
        const icon = document.createElement('i');
        icon.id = data.id;
        icon.className = data.icon;
        icon.title = data.title;
        icon.dataset.target = data.target;
        quickSettingsIconsContainer.append(icon);
    });

    connectionProfiles.append(presetsContainer, connectionProfilesSelectContainer, quickSettingsIconsContainer, connectionProfilesIcon);
    sheld.insertBefore(connectionProfiles, chat);

    apiBlock.querySelectorAll('select').forEach(select => {
        select.addEventListener('input', () => updateStatusAndIconsDebounced());
    });
}

async function bindPresetsSelect() {
    await waitUntilCondition(() => document.getElementById('settings_preset_openai') && jQuery.fn.select2);
    const originalSelect = document.getElementById('settings_preset_openai');
    const topBarSelect = document.getElementById('extensionTopBarPresetsSelect');

    if (!originalSelect || !topBarSelect) {
        console.warn('[TopInfoBar] Original or Top Bar preset select not found.');
        return;
    }

    const $originalSelect = $(originalSelect);
    const $topBarSelect = $(topBarSelect);

    const syncPresetOptions = () => {
        const currentValue = $originalSelect.val();
        $topBarSelect.html('');
        $originalSelect.find('option').each(function() {
            $topBarSelect.append($('<option>', {
                value: $(this).val(),
                text: $(this).text(),
            }));
        });
        $topBarSelect.val(currentValue).trigger('change.select2');
    };

    syncPresetOptions();

    $topBarSelect.select2({
        searchInputPlaceholder: 'Search presets...',
        width: 'resolve',
        dropdownAutoWidth: true,
        dropdownParent: jQuery('body'),
        dropdownCssClass: 'topinfo-preset-dropdown',
    });

    const isMobileDevice = () => {
        if (typeof window.isMobile === 'function') {
            return window.isMobile();
        }
        return /iphone|ipad|ipod|android|mobile/i.test(navigator.userAgent);
    };

    $topBarSelect.on('select2:open', function () {
        if (isMobileDevice()) {
            const $searchInput = $('.topinfo-preset-dropdown .select2-search__field');
            if ($searchInput.length) {
                $searchInput.prop('readonly', true);
                $searchInput.one('touchstart mousedown', function () {
                    $(this).prop('readonly', false);
                    setTimeout(() => $(this).trigger('focus'), 0);
                });
            }
        }
    });

    $topBarSelect.on('change', function() {
        const newValue = $(this).val();
        if ($originalSelect.val() !== newValue) {
            $originalSelect.val(newValue).trigger('change');
        }
        // MODIFICATION: Trigger icon state update after a delay
        updateQuickSettingIconsStateDebounced();
    });

    $originalSelect.on('change', function() {
        const newValue = $(this).val();
        if ($topBarSelect.val() !== newValue) {
            $topBarSelect.val(newValue).trigger('change.select2');
        }
        // MODIFICATION: Trigger icon state update after a delay
        updateQuickSettingIconsStateDebounced();
    });

    const presetObserver = new MutationObserver(syncPresetOptions);
    presetObserver.observe(originalSelect, { childList: true });
}

function bindConnectionProfilesSelect() {
    const updateTitle = () => {
        if (connectionProfilesSelect.selectedIndex >= 0) {
            connectionProfilesSelect.title = connectionProfilesSelect.options[connectionProfilesSelect.selectedIndex].text;
        }
    };

    waitUntilCondition(() => document.getElementById('connection_profiles') !== null).then(() => {
        const connectionProfilesMainSelect = /** @type {HTMLSelectElement} */ (document.getElementById('connection_profiles'));
        if (!connectionProfilesMainSelect) {
            return;
        }
        connectionProfilesSelect.addEventListener('change', async () => {
            connectionProfilesMainSelect.value = connectionProfilesSelect.value;
            connectionProfilesMainSelect.dispatchEvent(new Event('change'));
            updateTitle();
            // MODIFICATION: Trigger icon state update after a delay
            updateQuickSettingIconsStateDebounced();
        });
        connectionProfilesMainSelect.addEventListener('change', async () => {
            connectionProfilesSelect.value = connectionProfilesMainSelect.value;
            updateTitle();
            // MODIFICATION: Trigger icon state update after a delay
            updateQuickSettingIconsStateDebounced();
        });
        const observer = new MutationObserver(() => {
            connectionProfilesSelect.innerHTML = connectionProfilesMainSelect.innerHTML;
            connectionProfilesSelect.value = connectionProfilesMainSelect.value;
            updateTitle();
        });
        observer.observe(connectionProfilesMainSelect, { childList: true });

        updateTitle();
    });
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

function onChatNameClick() {
    document.querySelector('.drawer-toggle.stcd--hasPoster')?.click();
}

async function onOnlineStatusChange() {
    const connectionProfilesMainSelect = /** @type {HTMLSelectElement} */ (document.getElementById('connection_profiles'));
    if (connectionProfilesMainSelect) {
        connectionProfilesSelect.innerHTML = connectionProfilesMainSelect.innerHTML;
        connectionProfilesSelect.value = connectionProfilesMainSelect.value;
        connectionProfilesSelect.classList.remove('displayNone');
    } else {
        connectionProfilesSelect.classList.add('displayNone');
    }

    const container = document.getElementById('quickSettingsIconsContainer');
    if (container.nextElementSibling?.classList?.contains('icon-svg')) {
        container.nextElementSibling.remove();
    }

    const { onlineStatus } = SillyTavern.getContext();

    if (onlineStatus === 'no_connection') {
        const nullIcon = new Image();
        nullIcon.classList.add('icon-svg', 'null-icon');
        container.insertAdjacentElement('afterend', nullIcon);
        return;
    }

    await addConnectionProfileIcon();
}

function updateQuickSettingIconsState() {
    // Streaming Icon
    const streamToggle = document.getElementById('stream_toggle');
    const streamIcon = document.getElementById('quickSettingStream');
    if (streamToggle && streamIcon) {
        streamIcon.classList.toggle('active', streamToggle.checked);
    }

    // Global Search Icon
    const globalSearchToggle = document.getElementById('websearch_enabled');
    const globalSearchIcon = document.getElementById('quickSettingGlobalSearch');
    if (globalSearchToggle && globalSearchIcon) {
        globalSearchIcon.classList.toggle('active', globalSearchToggle.checked);
    }

    // API-Specific Search Icon
    const apiSearchToggle = document.getElementById('openai_enable_web_search');
    const apiSearchIcon = document.getElementById('quickSettingApiSearch');
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

async function bindQuickSettingsToggles() {
    await waitUntilCondition(() =>
        document.getElementById('stream_toggle') &&
        document.getElementById('websearch_enabled') &&
        document.getElementById('openai_enable_web_search'),
    );

    const toggles = [
        { el: document.getElementById('stream_toggle') },
        { el: document.getElementById('websearch_enabled') },
        { el: document.getElementById('openai_enable_web_search') },
    ];

    quickSettingsIconsContainer.addEventListener('click', (event) => {
        if (event.target.matches('i[data-target]')) {
            const icon = event.target;
            if (icon.classList.contains('disabled')) return;

            const targetCheckbox = document.querySelector(icon.dataset.target);
            if (targetCheckbox) {
                targetCheckbox.click();
            }
        }
    });

    toggles.forEach(toggle => {
        if (toggle.el) {
            toggle.el.addEventListener('change', updateQuickSettingIconsState);
        }
    });

    const apiSearchContainer = document.getElementById('openai_enable_web_search')?.closest('.range-block[data-source]');
    if (apiSearchContainer) {
        const observer = new MutationObserver(updateQuickSettingIconsState);
        observer.observe(apiSearchContainer, { attributes: true, attributeFilter: ['style'] });
    }

    updateQuickSettingIconsState();
}


async function addConnectionProfileIcon() {
    return new Promise((resolve) => {
        const modelName = getGeneratingApi();
        const image = new Image();
        image.classList.add('icon-svg');
        image.src = `/img/${modelName}.svg`;
        const container = document.getElementById('quickSettingsIconsContainer');

        image.onload = async function () {
            container.insertAdjacentElement('afterend', image);
            await SVGInject(image);
            resolve();
        };

        image.onerror = function () {
            resolve();
        };

        setTimeout(() => resolve(), 500);
    });
}

// Init extension on load
(async function () {
    addJQueryHighlight();
    patchSheldIfNeeded();
    addTopBar();
    addIcons();
    addConnectionProfiles();
    setChatName(getCurrentChatId());
    chatNameContainer.addEventListener('click', onChatNameClick);
    for (const eventName of [event_types.CHAT_CHANGED, event_types.CHAT_DELETED, event_types.GROUP_CHAT_DELETED]) {
        eventSource.on(eventName, setChatNameDebounced);
    }
    eventSource.once(event_types.APP_READY, () => {
        bindPresetsSelect();
        bindConnectionProfilesSelect();
        onOnlineStatusChange();
        bindQuickSettingsToggles();
    });
    eventSource.on(event_types.ONLINE_STATUS_CHANGED, updateStatusAndIconsDebounced);
})();