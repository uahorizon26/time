/*
 * Lampa plugin: "Скільки залишилось"
 * Коли інтерфейс плеєра зникає (через ~5 с бездіяльності), у правому нижньому
 * куті показується час до кінця фільму / серії: "35 хв" або "1:23 хв".
 * Не залежить від внутрішніх API Lampa — працює напряму з <video>.
 */
(function () {
    'use strict';

    if (window.plugin_time_left_ready) return;
    window.plugin_time_left_ready = true;

    var IDLE_MS = 5000;          // через скільки мс бездіяльності показувати лічильник
    var lastActivity = Date.now();
    var box = null;

    function injectStyle() {
        if (document.getElementById('time-left-style')) return;
        var st = document.createElement('style');
        st.id = 'time-left-style';
        st.textContent =
            '.time-left-box{position:fixed;right:2em;bottom:1.6em;z-index:99999;' +
            'padding:.35em .8em;border-radius:.5em;background:rgba(0,0,0,.45);' +
            'color:#fff;font-size:1.6em;font-weight:500;pointer-events:none;' +
            'opacity:0;transition:opacity .4s;text-shadow:0 0 6px rgba(0,0,0,.8)}' +
            '.time-left-box.show{opacity:1}';
        document.head.appendChild(st);
    }

    function getBox() {
        if (!box) {
            box = document.createElement('div');
            box.className = 'time-left-box';
            document.body.appendChild(box);
        }
        return box;
    }

    function format(sec) {
        var mins = Math.ceil(sec / 60);
        if (mins < 1) mins = 1;
        if (mins < 60) return mins + ' хв';
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return h + ':' + (m < 10 ? '0' : '') + m + ' хв';
    }

    function findVideo() {
        var list = document.querySelectorAll('video');
        for (var i = 0; i < list.length; i++) {
            var v = list[i];
            if (v.offsetWidth > 0 && v.readyState > 0) return v;
        }
        return null;
    }

    // чи видно зараз панель плеєра (за обчислених стилями)
    function panelVisible() {
        var els = document.querySelectorAll('.player-panel, .player-info');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            if (parseFloat(cs.opacity) < 0.05) continue;
            var r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.bottom < 0 || r.top > window.innerHeight) continue;
            if (r.right < 0 || r.left > window.innerWidth) continue;
            return true;
        }
        return false;
    }

    function tick() {
        var b = getBox();
        var v = findVideo();
        var ok = v && isFinite(v.duration) && v.duration > 0 && !v.paused && !v.ended;

        if (ok && Date.now() - lastActivity >= IDLE_MS && !panelVisible()) {
            var rate = v.playbackRate || 1;
            var left = (v.duration - v.currentTime) / rate;
            if (left < 0) left = 0;
            b.textContent = format(left);
            b.classList.add('show');
        } else {
            b.classList.remove('show');
        }
    }

    function activity() {
        lastActivity = Date.now();
        if (box) box.classList.remove('show');
    }

    function start() {
        injectStyle();
        ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'].forEach(function (e) {
            document.addEventListener(e, activity, true);
        });
        setInterval(tick, 500);
    }

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();
