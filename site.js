// Header scroll state, mobile menu, active nav, hero board carousel.
(function () {
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var btn = document.querySelector('.menu-btn');
  var mobile = document.querySelector('.mobile-nav');
  if (btn && mobile) {
    btn.addEventListener('click', function () { mobile.classList.toggle('open'); });
    mobile.addEventListener('click', function (e) { if (e.target.tagName === 'A') mobile.classList.remove('open'); });
  }

  var page = (location.pathname.split('/').pop() || 'index.html');
  if (page === '') page = 'index.html';
  document.querySelectorAll('[data-nav]').forEach(function (a) {
    if (a.getAttribute('data-nav') === page) a.classList.add('active');
  });

  // ----- hero board carousel -----
  var board = document.querySelector('.board');
  if (!board) return;
  var slides = Array.prototype.slice.call(board.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(board.querySelectorAll('.board-dots button'));
  var creditEl = board.querySelector('.board-credit');
  var credits = slides.map(function (s) { return s.getAttribute('data-credit') || ''; });
  var i = 0, timer = null, DURATION = 7000;

  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    if (creditEl) creditEl.textContent = credits[i];
  }
  function next() { show(i + 1); }
  function prev() { show(i - 1); }
  function start() { stop(); timer = window.setInterval(next, DURATION); }
  function stop() { if (timer) window.clearInterval(timer); timer = null; }
  function go(n) { show(n); start(); }

  var rightBtn = board.querySelector('.board-edge.right .arrow');
  var leftBtn = board.querySelector('.board-edge.left .arrow');
  if (rightBtn) rightBtn.addEventListener('click', function () { go(i + 1); });
  if (leftBtn) leftBtn.addEventListener('click', function () { go(i - 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });

  var info = board.querySelector('.board-info');
  var attrib = board.querySelector('.board-attrib');
  if (info && attrib) {
    info.addEventListener('click', function (e) {
      e.stopPropagation();
      attrib.hidden = !attrib.hidden;
    });
    document.addEventListener('click', function (e) {
      if (!attrib.hidden && !attrib.contains(e.target) && e.target !== info) attrib.hidden = true;
    });
  }

  board.addEventListener('mouseenter', stop);
  board.addEventListener('mouseleave', start);

  show(0);
  start();
})();
