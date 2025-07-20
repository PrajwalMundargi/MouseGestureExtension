chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'gesture') {
        const gesture = message.path[0];
        switch (gesture) {
            case 'L':
                chrome.tabs.goBack(sender.tab.id);
                break;
            case 'R':
                chrome.tabs.goForward(sender.tab.id);
                break;
            case 'U':
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    func: () => window.scrollBy(0, -300)
                });
                break;
            case 'D':
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    func: () => window.scrollBy(0, 300)
                });
                break;
            case 'UD':
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    func: () => location.reload()
                });
                break;
            case 'LU':
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                        const currentIndex = activeTabs[0].index;
                        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        chrome.tabs.update(tabs[prevIndex].id, { active: true });
                    });
                });
                break;
            case 'RU':
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                        const currentIndex = activeTabs[0].index;
                        const nextIndex = (currentIndex + 1) % tabs.length;
                        chrome.tabs.update(tabs[nextIndex].id, { active: true });
                    });
                });
                break;
            case 'BUCKET':
                chrome.tabs.create({ url: 'https://www.google.com' });
                break;
        }
        sendResponse({ status: 'ok' });
    }
});
