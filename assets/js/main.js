/* Beaumont Healthcare: progressive navigation, care search and appointment review. */
(function () {
  'use strict';
  var body = document.body;
  var nav = document.getElementById('site-nav');
  var toggle = document.querySelector('.nav-toggle');
  var header = document.querySelector('.site-header');
  function setNav(open, returnFocus) {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.innerHTML = open ? '<span aria-hidden="true" style="font-size:28px;line-height:1">×</span>' : '<span aria-hidden="true" style="font-size:24px;line-height:1">☰</span>';
    if (returnFocus) toggle.focus();
  }
  if (nav && toggle) {
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setNav(false, true);
    });
    document.addEventListener('click', function (event) {
      if (event.composedPath().indexOf(header) === -1) setNav(false);
    });
    header.addEventListener('focusout', function () {
      setTimeout(function () { if (!header.contains(document.activeElement)) setNav(false); }, 0);
    });
    nav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { setNav(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1120) setNav(false); });
  }
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Keep the heading readable without JavaScript or motion, and give visitors control.
  var rotatingWord = document.querySelector('[data-rotating-word]');
  var rotationToggle = document.querySelector('[data-rotation-toggle]');
  if (rotatingWord && rotationToggle) {
    var headlineWords = ['listening.', 'kindness.', 'you.'];
    var headlineIndex = 0;
    var headlinePaused = false;
    var headlineTimer;
    var headlineTransition;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var rotationLabel = rotationToggle.querySelector('[data-rotation-label]');
    var rotationIcon = rotationToggle.querySelector('.rotation-toggle__icon');
    function stopHeadline() {
      window.clearTimeout(headlineTimer);
      window.clearTimeout(headlineTransition);
      rotatingWord.classList.remove('is-changing');
    }
    function canRotateHeadline() {
      return !headlinePaused && !reducedMotion.matches && !document.hidden;
    }
    function scheduleHeadline() {
      if (!canRotateHeadline()) return;
      headlineTimer = window.setTimeout(function () {
        if (!canRotateHeadline()) return;
        rotatingWord.classList.add('is-changing');
        headlineTransition = window.setTimeout(function () {
          if (!canRotateHeadline()) return;
          headlineIndex = (headlineIndex + 1) % headlineWords.length;
          rotatingWord.textContent = headlineWords[headlineIndex];
          rotatingWord.classList.remove('is-changing');
          scheduleHeadline();
        }, 180);
      }, 3800);
    }
    function syncHeadline() {
      stopHeadline();
      rotationToggle.hidden = reducedMotion.matches;
      rotationToggle.setAttribute('aria-label', headlinePaused ? 'Resume changing headline' : 'Pause changing headline');
      if (rotationLabel) rotationLabel.textContent = headlinePaused ? 'Play animation' : 'Pause animation';
      if (rotationIcon) rotationIcon.textContent = headlinePaused ? '▷' : 'Ⅱ';
      if (reducedMotion.matches) {
        headlineIndex = 0;
        rotatingWord.textContent = headlineWords[0];
      }
      scheduleHeadline();
    }
    rotationToggle.addEventListener('click', function () {
      headlinePaused = !headlinePaused;
      syncHeadline();
    });
    document.addEventListener('visibilitychange', syncHeadline);
    window.addEventListener('pagehide', stopHeadline);
    window.addEventListener('pageshow', syncHeadline);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncHeadline);
    else reducedMotion.addListener(syncHeadline);
    syncHeadline();
  }

  var search = document.getElementById('care-search');
  if (search) {
    var cards = Array.from(document.querySelectorAll('[data-service-card]'));
    var groups = document.querySelectorAll('[data-service-group]');
    var count = document.getElementById('care-count');
    var empty = document.querySelector('[data-no-results]');
    search.addEventListener('input', function () {
      var terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = (card.getAttribute('data-search') + ' ' + card.textContent).toLowerCase();
        var match = terms.every(function (term) { return haystack.indexOf(term) !== -1; });
        card.hidden = !match;
        if (match) visible++;
      });
      groups.forEach(function (group) { group.hidden = !Array.from(group.querySelectorAll('[data-service-card]')).some(function (card) { return !card.hidden; }); });
      empty.hidden = visible > 0;
      count.textContent = terms.length ? visible + (visible === 1 ? ' service found' : ' services found') : 'Showing all ' + cards.length + ' services';
    });
    document.querySelectorAll('.service-jumps a').forEach(function (link) {
      link.addEventListener('click', function () { search.value = ''; search.dispatchEvent(new Event('input')); });
    });
  }

  function localToday() {
    var now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  var params = new URLSearchParams(window.location.search);
  var form = document.querySelector('form[data-booking]');
  if (!form) return;
  var details = form.querySelector('[data-details]');
  var review = form.querySelector('[data-review]');
  var reviewList = form.querySelector('[data-review-list]');
  var status = form.querySelector('.form-success');
  var date = form.querySelector('[name="date"]');
  var time = form.querySelector('[name="time"]');
  var service = form.querySelector('[name="service"]');
  var reviewButton = form.querySelector('[data-via="review"]');
  date.min = localToday();
  var requestedDate = params.get('date');
  if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate >= date.min) {
    date.value = requestedDate;
  }
  var requestedTime = params.get('time');
  if (time && requestedTime && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(requestedTime)) time.value = requestedTime;
  Array.from(service.options).forEach(function (option) {
    if (option.getAttribute('data-slug') === params.get('service')) service.value = option.value;
  });
  // Enhance only after the elements are available. No personal information is stored.
  form.setAttribute('novalidate', '');
  form.querySelectorAll('button[type="submit"]').forEach(function (button) { button.disabled = false; });
  form.querySelectorAll('.field').forEach(function (field) {
    var input = field.querySelector('input,select,textarea');
    var error = field.querySelector('.field__error');
    if (input && input.id && error) {
      error.id = input.id + '-error';
      var existing = input.getAttribute('aria-describedby');
      input.setAttribute('aria-describedby', (existing ? existing + ' ' : '') + error.id);
    }
  });
  function setError(input, message) {
    var field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('has-error', !!message);
    var error = field.querySelector('.field__error');
    if (error) error.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  function focusFormTarget(target) {
    target.focus({preventScroll: true});
    var visibleTarget = target.closest('.field') || target;
    var headerSpace = (header ? header.offsetHeight : 0) + 24;
    window.scrollTo({top: Math.max(0, window.scrollY + visibleTarget.getBoundingClientRect().top - headerSpace), behavior: 'instant'});
  }
  function validate() {
    var first = null;
    date.min = localToday();
    form.querySelectorAll('input,select,textarea').forEach(function (input) {
      var value = input.value.trim();
      var error = '';
      if (input.required && !value) error = input.getAttribute('data-msg') || 'Please choose an option.';
      else if (input.type === 'tel' && (!/^[+\d\s().-]+$/.test(value) || value.replace(/\D/g, '').length < 9 || value.replace(/\D/g, '').length > 15)) error = 'Please enter a valid phone number, including the area code.';
      else if (input.type === 'email' && value && input.validity.typeMismatch) error = 'Please check your email address.';
      else if (input.type === 'date' && (input.validity.badInput || (value && value < date.min))) error = 'Please choose today or a future date, or leave this blank.';
      else if (input.type === 'time' && input.validity.badInput) error = 'Please choose a valid time, or leave this blank.';
      setError(input, error);
      if (error && !first) first = input;
    });
    if (first) { showReview(false); focusFormTarget(first); }
    return !first;
  }
  function fields() {
    return Array.from(form.querySelectorAll('[data-label]')).map(function (input) {
      var value = input.value.trim();
      if (input.type === 'date') value = value ? new Date(value + 'T12:00:00').toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'long', year:'numeric'}) : 'Flexible — please suggest a date';
      if (input.type === 'time') value = value ? new Date('1970-01-01T' + value + ':00').toLocaleTimeString('en-GB', {hour:'numeric', minute:'2-digit'}) : 'Flexible — please suggest a time';
      return {label: input.getAttribute('data-label'), value:value};
    }).filter(function (entry) { return entry.value; });
  }
  function showReview(on) {
    details.hidden = on;
    review.hidden = !on;
    reviewButton.disabled = on;
    form.querySelectorAll('[data-progress]').forEach(function (step) {
      if (step.getAttribute('data-progress') === (on ? 'review' : 'details')) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    status.classList.remove('is-visible');
    if (on) {
      reviewList.replaceChildren();
      fields().forEach(function (entry) {
        var row = document.createElement('div');
        var label = document.createElement('dt');
        var value = document.createElement('dd');
        label.textContent = entry.label;
        value.textContent = entry.value;
        row.append(label, value);
        reviewList.appendChild(row);
      });
      focusFormTarget(document.getElementById('review-heading'));
    }
  }
  form.querySelector('[data-edit-request]').addEventListener('click', function () {
    showReview(false);
    focusFormTarget(form.querySelector('[name="name"]'));
  });
  form.addEventListener('input', function (event) { if (event.target.closest('.field')) setError(event.target, ''); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validate()) return;
    var via = event.submitter && event.submitter.getAttribute('data-via');
    if (review.hidden || via === 'review') { showReview(true); return; }
    if (via !== 'email' && via !== 'whatsapp') return;
    var message = form.getAttribute('data-intro') + '\n\n' + fields().map(function (entry) { return entry.label + ': ' + entry.value; }).join('\n');
    var url = via === 'email'
      ? 'mailto:' + body.getAttribute('data-email') + '?subject=' + encodeURIComponent(form.getAttribute('data-subject')) + '&body=' + encodeURIComponent(message)
      : 'https://wa.me/' + body.getAttribute('data-wa') + '?text=' + encodeURIComponent(message);
    if (via === 'email') window.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
    var paragraph = status.querySelector('p');
    paragraph.replaceChildren();
    paragraph.appendChild(document.createTextNode((via === 'email' ? 'Your email app' : 'WhatsApp') + ' should open with your request ready. Press send there to finish. Your appointment is not confirmed yet. If the app didn’t open, '));
    var retry = document.createElement('a');
    retry.textContent = 'open your request again';
    retry.href = url;
    if (via === 'whatsapp') { retry.target = '_blank'; retry.rel = 'noopener noreferrer'; }
    paragraph.append(retry, document.createTextNode(' or call '));
    var phone = document.createElement('a');
    phone.href = 'tel:' + body.getAttribute('data-phone');
    phone.textContent = '050 078 7348';
    paragraph.append(phone, document.createTextNode('.'));
    status.classList.add('is-visible');
    status.setAttribute('tabindex', '-1');
    focusFormTarget(status);
  });
})();
