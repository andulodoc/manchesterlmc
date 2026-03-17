(function () {
  var denied  = document.getElementById('cms-access-denied');
  var loading = document.getElementById('cms-loading');
  var content = document.getElementById('cms-guide-content');

  function show(el) { el.style.display = ''; }
  function hide(el) { el.style.display = 'none'; }

  fetch('/.netlify/functions/auth-status', {
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      hide(loading);
      if (data.authenticated && data.role === 'lmc_admin') {
        show(content);
      } else {
        show(denied);
      }
    })
    .catch(function () {
      hide(loading);
      show(denied);
    });
}());
