import { AUTH_USER_KEY, getStoredUser, persistUser, onAuthReady } from './auth.js';

/**
 * Resolve a site path from the project root (e.g. pages/login.html) to a URL that works
 * from both /index.html and /pages/*.html (and avoids broken absolute /pages/... on some hosts).
 */
function appHref(pathFromProjectRoot) {
    const pathname = window.location.pathname || '';
    const inPages = pathname.includes('/pages/');
    if (inPages) {
        if (pathFromProjectRoot === 'index.html' || pathFromProjectRoot === 'home.html') {
            return '../' + pathFromProjectRoot;
        }
        return pathFromProjectRoot.replace(/^pages\//, '');
    }
    return pathFromProjectRoot;
}

/** True on main marketing landing (`/` or `.../index.html`). Guests see Login only there. */
function isLandingPage() {
    const path = (window.location.pathname || '').toLowerCase();
    return path === '/' || /\/index\.html$/.test(path);
}

/** Whether the current URL matches a nav target like `pages/feed.html` (works from `/` or `/pages/…`). */
function isActiveNavPath(pathFromProjectRoot) {
    const p = (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    const norm = pathFromProjectRoot.replace(/\\/g, '/').toLowerCase();
    const file = norm.includes('/') ? norm.split('/').pop() : norm;
    if (file === 'index.html') {
        return p === '/' || p.endsWith('/index.html') || p.endsWith('index.html');
    }
    return p.endsWith('/' + file) || p.endsWith(file);
}

function appendNavLink(primaryNav, item) {
    const link = document.createElement('a');
    link.href = appHref(item.path);
    let cls = 'nav-link' + (item.class ? ' ' + item.class : '');
    if (isActiveNavPath(item.path)) cls += ' nav-link-active';
    link.className = cls;
    link.innerText = item.text;
    primaryNav.appendChild(link);
}

/**
 * Route guarding and UI adjustment helper
 */
function initNav(user) {
    const currentPath = window.location.pathname;

    const primaryNav = document.querySelector('.primary-nav');
    if (!primaryNav) return;

    primaryNav.innerHTML = '';

    if (user) {
        const navItems = [
            { text: 'Stories', path: 'pages/feed.html' },
            { text: 'Chautari', path: 'pages/groups.html' },
            { text: 'Helpline', path: 'pages/professionals.html', class: 'nav-link-support' },
            { text: 'My space', path: 'pages/profile.html' }
        ];

        navItems.forEach(item => appendNavLink(primaryNav, item));

        if (user.role === 'mentor') {
            appendNavLink(primaryNav, {
                text: 'Mentor Dash',
                path: 'pages/mentor-dashboard.html',
                class: 'nav-link-mentor'
            });
        }

        const userDropdown = document.createElement('div');
        userDropdown.className = 'nav-user-cluster nav-user-dropdown';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'nav-dropdown-trigger';
        trigger.id = 'navUserMenuBtn';
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', 'navUserMenu');
        trigger.title = 'Account menu';

        const avatarEmoji = document.createElement('span');
        avatarEmoji.className = 'nav-avatar-emoji';
        avatarEmoji.setAttribute('aria-hidden', 'true');
        avatarEmoji.textContent = user.anon_avatar || '🪔';

        const chevron = document.createElement('span');
        chevron.className = 'nav-dropdown-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.textContent = '▾';

        trigger.appendChild(avatarEmoji);
        trigger.appendChild(chevron);

        const panel = document.createElement('div');
        panel.className = 'nav-dropdown-panel';
        panel.id = 'navUserMenu';
        panel.setAttribute('role', 'menu');
        panel.hidden = true;

        const userHead = document.createElement('div');
        userHead.className = 'nav-dropdown-user';
        const nameEl = document.createElement('span');
        nameEl.className = 'nav-dropdown-name';
        nameEl.textContent = user.anon_name || 'Anonymous';
        const subEl = document.createElement('span');
        subEl.className = 'nav-dropdown-sub';
        subEl.textContent = 'Anonymous identity';
        userHead.appendChild(nameEl);
        userHead.appendChild(subEl);

        const div1 = document.createElement('div');
        div1.className = 'nav-dropdown-divider';

        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'nav-dropdown-item nav-dropdown-item-logout';
        logoutBtn.id = 'navLogout';
        logoutBtn.setAttribute('role', 'menuitem');
        logoutBtn.textContent = 'Log out';

        panel.appendChild(userHead);
        panel.appendChild(div1);
        panel.appendChild(logoutBtn);

        userDropdown.appendChild(trigger);
        userDropdown.appendChild(panel);

        function closeMenu() {
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            userDropdown.classList.remove('is-open');
        }

        function openMenu() {
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            userDropdown.classList.add('is-open');
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (panel.hidden) openMenu();
            else closeMenu();
        });

        document.addEventListener('click', closeMenu);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeMenu();
            import('./auth.js').then(m => m.logout());
        });

        primaryNav.appendChild(userDropdown);

    } else {
        if (!isLandingPage()) {
            const publicNavItems = [
                { text: 'Stories', path: 'pages/feed.html' },
                { text: 'Chautari', path: 'pages/groups.html' },
                { text: 'Helpline', path: 'pages/professionals.html', class: 'nav-link-support' },
                { text: 'My space', path: 'pages/profile.html' }
            ];

            publicNavItems.forEach(item => appendNavLink(primaryNav, item));
        }

        const loginLink = document.createElement('a');
        loginLink.href = appHref('pages/login.html');
        loginLink.id = 'navLogin';
        loginLink.className = 'nav-link';
        loginLink.innerText = 'Login';
        primaryNav.appendChild(loginLink);
    }

    const protectedRoutes = ['/pages/profile.html', '/pages/mentor-dashboard.html', '/pages/mentor-verify.html'];
    const isProtectedRoute = protectedRoutes.some(route => currentPath.includes(route));

    if (isProtectedRoute && !user) {
        window.location.href = appHref('pages/login.html');
        return;
    }

    if (currentPath.includes('mentor-dashboard.html')) {
        if (user.role !== 'mentor') {
            window.location.href = appHref('pages/feed.html');
            return;
        }
        if (!user.is_verified) {
            window.location.href = appHref('pages/mentor-verify.html');
            return;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthReady((firebaseUser) => {
        if (firebaseUser) {
            // Ensure localStorage is populated with Firebase user
            const stored = getStoredUser();
            const user = stored && stored.uid === firebaseUser.uid
                ? stored
                : persistUser(firebaseUser);
            initNav(user);
        } else {
            initNav(null);
        }
    });
});

export function checkAuth() {
    return !!getStoredUser();
}
