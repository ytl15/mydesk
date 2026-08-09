/* 《塔罗冥想》精校版 · 共用交互
   每封信原本各带一份 ~1.5KB 的内联脚本，两版行为一致但 data-k 取值不同
   （一版用「校记」，一版用「校」）。此处统一为全称，脚本合为一份。 */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  function tog(el, btn, force) {
    if (!el) return false;
    var on = force === undefined ? !el.classList.contains('on') : force;
    el.classList.toggle('on', on);
    if (btn) btn.setAttribute('aria-pressed', on);
    return on;
  }

  $$('.enbtn').forEach(function (b) {
    b.onclick = function () { tog($('#' + b.dataset.t), b); };
  });
  $$('.badge').forEach(function (b) {
    b.onclick = function () { tog($('#' + b.dataset.n), b); };
  });

  var sEn = false, sNo = false, sCol = false;
  var tEn = $('#tEn'), tNo = $('#tNo'), tCol = $('#tCol'),
      tMark = $('#tMark'), tDark = $('#tDark');

  if (tEn) tEn.onclick = function () {
    sEn = !sEn;
    tEn.setAttribute('aria-pressed', sEn);
    $$('.en').forEach(function (e) { e.classList.toggle('on', sEn); });
    $$('.enbtn').forEach(function (b) { b.setAttribute('aria-pressed', sEn); });
  };

  if (tNo) tNo.onclick = function () {
    sNo = !sNo; sCol = false;
    if (tCol) tCol.setAttribute('aria-pressed', false);
    tNo.setAttribute('aria-pressed', sNo);
    $$('.note').forEach(function (e) { e.classList.toggle('on', sNo); });
    $$('.badge').forEach(function (b) { b.setAttribute('aria-pressed', sNo); });
  };

  if (tCol) tCol.onclick = function () {
    sCol = !sCol; sNo = false;
    if (tNo) tNo.setAttribute('aria-pressed', false);
    tCol.setAttribute('aria-pressed', sCol);
    $$('.note').forEach(function (e) {
      e.classList.toggle('on', sCol && e.dataset.k === '校记');
    });
    $$('.badge').forEach(function (b) {
      b.setAttribute('aria-pressed', sCol && b.classList.contains('b4'));
    });
  };

  if (tMark) tMark.onclick = function () {
    var off = document.body.classList.toggle('hide-fix');
    document.body.classList.toggle('hide-tier', off);
    tMark.setAttribute('aria-pressed', !off);
  };

  /* 夜间模式记在 localStorage，翻到下一封信不用重按。 */
  function setDark(on) {
    if (on) document.documentElement.setAttribute('data-dark', '');
    else document.documentElement.removeAttribute('data-dark');
    if (tDark) tDark.setAttribute('aria-pressed', on);
    try { localStorage.setItem('mot-dark', on ? '1' : '0'); } catch (e) {}
  }
  try {
    if (localStorage.getItem('mot-dark') === '1') setDark(true);
  } catch (e) {}
  if (tDark) tDark.onclick = function () {
    setDark(!document.documentElement.hasAttribute('data-dark'));
  };

  var top = $('.tw-totop');
  if (top) {
    window.addEventListener('scroll', function () {
      top.style.display = window.scrollY > 700 ? 'flex' : 'none';
    });
    top.onclick = function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }
})();
