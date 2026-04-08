export function buildQueryWindow(win:number=0) {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const now = new Date();
    const window = new Date();
    window.setDate(now.getDate() - win);
    const nowStr = formatDate(now);
    const windowStr = formatDate(window);
    return { $gte: windowStr, $lte: nowStr }
}

