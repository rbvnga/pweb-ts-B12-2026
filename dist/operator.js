document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard: Validasi Sesi Local Storage
    const authDataStr = localStorage.getItem('auth_user');
    if (!authDataStr) {
        alert('Akses Ditolak! Silakan login terlebih dahulu.');
        window.location.href = 'login.html';
        return;
    }
    try {
        const authData = JSON.parse(authDataStr);
        const nameEl = document.getElementById('operatorName');
        const roleEl = document.getElementById('operatorRole');
        const avatarEl = document.getElementById('operatorAvatar');
        const displayName = authData.firstName || authData.username || 'Operator';
        const displayRole = authData.role ? `Role: ${authData.role.toUpperCase()}` : 'Operator Loket';
        if (nameEl)
            nameEl.textContent = displayName;
        if (roleEl)
            roleEl.textContent = displayRole;
        if (avatarEl)
            avatarEl.textContent = displayName.substring(0, 2).toUpperCase();
    }
    catch (e) {
        console.error('Data sesi korup:', e);
        window.location.href = 'login.html';
        return;
    }
    // Tombol Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('auth_user');
            window.location.href = 'login.html';
        });
    }
    // Inisialisasi Data Default jika belum ada di Local Storage
    initDefaultData();
    // Render Awal & Jam Sistem
    renderOperatorPanel();
    updateClock();
    setInterval(updateClock, 1000);
    // Sinkronisasi Real-Time lintas tab & polling interval
    window.addEventListener('storage', () => {
        renderOperatorPanel();
    });
    setInterval(() => {
        renderOperatorPanel();
    }, 2000);
});
function updateClock() {
    const clockEl = document.getElementById('systemClock');
    if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}
function initDefaultData() {
    if (!localStorage.getItem('queueTypes')) {
        const defaultTypes = [
            { code: 'A', name: 'UMUM-1', active: true },
            { code: 'B', name: 'UMUM-2', active: true },
            { code: 'C', name: 'UMUM-3', active: true },
            { code: 'G', name: 'GIGI', active: true },
            { code: 'F', name: 'FARMASI', active: true },
            { code: 'P', name: 'PSIKOLOG', active: true }
        ];
        localStorage.setItem('queueTypes', JSON.stringify(defaultTypes));
    }
    if (!localStorage.getItem('tickets')) {
        const defaultTickets = [
            { id: 'A-001', queueCode: 'A', number: 1, priority: 'Normal', status: 'Dipanggil', createdAt: new Date().toISOString() },
            { id: 'B-001', queueCode: 'B', number: 1, priority: 'VIP', status: 'Menunggu', createdAt: new Date().toISOString() },
            { id: 'G-003', queueCode: 'G', number: 3, priority: 'Disabilitas', status: 'Dipanggil', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('tickets', JSON.stringify(defaultTickets));
    }
}
function getQueueTypes() {
    const data = localStorage.getItem('queueTypes');
    return data ? JSON.parse(data) : [];
}
function getTickets() {
    const data = localStorage.getItem('tickets');
    return data ? JSON.parse(data) : [];
}
function saveTickets(tickets) {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}
// Bobot Prioritas: VIP (3) > Disabilitas (2) > Lansia (1) > Normal (0)
function getPriorityWeight(priority) {
    switch (priority) {
        case 'VIP': return 3;
        case 'Disabilitas': return 2;
        case 'Lansia': return 1;
        case 'Normal':
        default: return 0;
    }
}
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container)
        return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
function renderOperatorPanel() {
    const container = document.getElementById('queueOperatorContainer');
    if (!container)
        return;
    const queueTypes = getQueueTypes().filter(q => q.active);
    const tickets = getTickets();
    // Update Statistik Atas
    const totalWaiting = tickets.filter(t => t.status === 'Menunggu' || t.status === 'Lewati').length;
    const totalActive = tickets.filter(t => t.status === 'Dipanggil').length;
    const totalWaitingEl = document.getElementById('totalWaitingCount');
    const totalActiveEl = document.getElementById('totalActiveCount');
    if (totalWaitingEl)
        totalWaitingEl.textContent = totalWaiting.toString();
    if (totalActiveEl)
        totalActiveEl.textContent = totalActive.toString();
    if (queueTypes.length === 0) {
        container.innerHTML = '<p class="no-ticket-message">Tidak ada jenis antrian aktif saat ini. Atur melalui Dashboard Admin.</p>';
        return;
    }
    container.innerHTML = '';
    queueTypes.forEach(qType => {
        const queueTickets = tickets.filter(t => t.queueCode === qType.code);
        const currentTicket = queueTickets.find(t => t.status === 'Dipanggil');
        const waitingTickets = queueTickets
            .filter(t => t.status === 'Menunggu' || t.status === 'Lewati')
            .sort((a, b) => {
            const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
            if (weightDiff !== 0)
                return weightDiff;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        const nextTicket = waitingTickets.length > 0 ? waitingTickets[0] : null;
        const waitingCount = waitingTickets.length;
        const card = document.createElement('div');
        card.className = 'queue-card';
        card.innerHTML = `
            <div class="queue-card-header">
                <span class="queue-title">${qType.name} (${qType.code})</span>
                <span class="waiting-badge">${waitingCount} dalam antrian</span>
            </div>
            <div class="queue-status-body">
                <div class="status-box">
                    <span>Sedang Dipanggil</span>
                    <div class="status-value ${!currentTicket ? 'empty' : ''}">
                        ${currentTicket ? currentTicket.id : '-'}
                    </div>
                    ${currentTicket ? `<small class="priority-tag">${currentTicket.priority}</small>` : ''}
                </div>
                <div class="status-box">
                    <span>Berikutnya</span>
                    <div class="status-value ${!nextTicket ? 'empty' : ''}">
                        ${nextTicket ? nextTicket.id : '-'}
                    </div>
                    ${nextTicket ? `<small class="priority-tag">${nextTicket.priority}</small>` : ''}
                </div>
            </div>
            <div class="queue-actions">
                <button class="btn btn-call" onclick="window.callNextTicket('${qType.code}')">Panggil Berikutnya</button>
                <button class="btn btn-skip" onclick="window.skipTicket('${qType.code}')" ${!nextTicket ? 'disabled' : ''}>Lewati</button>
                <button class="btn btn-finish" onclick="window.finishTicket('${qType.code}')" ${!currentTicket ? 'disabled' : ''}>Selesai</button>
            </div>
        `;
        container.appendChild(card);
    });
}
window.callNextTicket = function (queueCode) {
    let tickets = getTickets();
    tickets = tickets.map(t => {
        if (t.queueCode === queueCode && t.status === 'Dipanggil') {
            return { ...t, status: 'Selesai' };
        }
        return t;
    });
    const waitingTickets = tickets.filter(t => t.queueCode === queueCode && (t.status === 'Menunggu' || t.status === 'Lewati'))
        .sort((a, b) => {
        const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (weightDiff !== 0)
            return weightDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    if (waitingTickets.length > 0) {
        // Gunakan optional chaining (?.) untuk mengatasi error undefined
        const nextId = waitingTickets[0]?.id;
        if (nextId) {
            tickets = tickets.map(t => {
                if (t.id === nextId) {
                    return { ...t, status: 'Dipanggil' };
                }
                return t;
            });
            showToast(`Memanggil nomor tiket ${nextId}`, 'success');
        }
    }
    else {
        showToast(`Tidak ada antrian menunggu untuk kode ${queueCode}`, 'warning');
    }
    saveTickets(tickets);
    renderOperatorPanel();
};
window.skipTicket = function (queueCode) {
    let tickets = getTickets();
    // PERBAIKAN: Gunakan '===' alih-alih '---'
    const waitingTickets = tickets.filter(t => t.queueCode === queueCode && t.status === 'Menunggu')
        .sort((a, b) => {
        const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (weightDiff !== 0)
            return weightDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    if (waitingTickets.length > 0) {
        // Gunakan optional chaining (?.) di sini juga
        const targetId = waitingTickets[0]?.id;
        if (targetId) {
            tickets = tickets.map(t => {
                if (t.id === targetId) {
                    return { ...t, status: 'Lewati', createdAt: new Date().toISOString() };
                }
                return t;
            });
            saveTickets(tickets);
            showToast(`Tiket ${targetId} dilewati`, 'warning');
            renderOperatorPanel();
        }
    }
};
window.finishTicket = function (queueCode) {
    let tickets = getTickets();
    // Perbaiki typo dari 'lickels' menjadi 'tickets' dan '---' menjadi '==='
    tickets = tickets.map(t => {
        if (t.queueCode === queueCode && t.status === 'Dipanggil') {
            return { ...t, status: 'Selesai' };
        }
        return t;
    });
    saveTickets(tickets);
    showToast(`Sesi layanan ${queueCode} diselesaikan`, 'success');
    renderOperatorPanel();
};
export {};
//# sourceMappingURL=operator.js.map