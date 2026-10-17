// Shared script for every page: mobile menu + rendering content/*.json.
// Content is edited through Pages CMS (see .pages.yml), never by hand-editing HTML.

function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu() { document.getElementById('mobileMenu').classList.remove('open'); }
document.addEventListener('click', function (e) {
  if (!document.querySelector('nav').contains(e.target)) closeMenu();
});

(function () {
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function load(name) {
    // no-cache = always revalidate, so CMS edits show up as soon as they're deployed
    return fetch('content/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + '.json: ' + r.status);
      return r.json();
    });
  }

  function $(id) { return document.getElementById(id); }

  // "2026-10-17" -> local Date (avoids the UTC off-by-one of new Date(str))
  function parseDate(s) {
    var p = String(s || '').split('-');
    return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null;
  }

  function today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // ── SITE SETTINGS ──────────────────────────────────────────────────────────
  function renderSite(s) {
    document.querySelectorAll('[data-site="price"]').forEach(function (el) {
      if (s.price !== '' && s.price != null) el.textContent = s.price;
    });
    document.querySelectorAll('[data-site="academicYear"]').forEach(function (el) {
      if (s.academicYear) el.textContent = s.academicYear;
    });

    var join = $('joinButton');
    if (join) {
      if (s.stripeLink) {
        join.href = s.stripeLink;
      } else {
        join.removeAttribute('href');
        join.classList.add('btn-join-disabled');
        join.textContent = 'Online joining opens soon';
        var note = $('joinUnavailable');
        if (note) note.hidden = false;
      }
    }

    var hero = $('home');
    if (hero && s.heroImage) {
      hero.style.backgroundImage =
        'linear-gradient(180deg, rgba(1,24,67,0.88) 0%, rgba(1,24,67,0.72) 100%), url("' + encodeURI(s.heroImage) + '")';
    }

    var feedback = $('feedbackLink');
    if (feedback && s.feedbackForm) {
      feedback.href = s.feedbackForm;
      feedback.hidden = false;
    }
  }

  // ── COMMITTEE ──────────────────────────────────────────────────────────────
  function renderCommittee(data) {
    var grid = $('committeeGrid');
    if (!grid) return;
    grid.innerHTML = (data.members || []).map(function (m) {
      var photo = m.photo
        ? '<img src="' + esc(m.photo) + '" alt="' + esc(m.name || m.role) + '" loading="lazy" />'
        : '&#128100;';
      return '<div class="committee-card">' +
        '<div class="committee-photo">' + photo + '</div>' +
        '<div class="committee-info">' +
          '<p class="committee-role">' + esc(m.role) + '</p>' +
          '<p class="committee-name">' + (m.name ? esc(m.name) : '&mdash;') + '</p>' +
          (m.college ? '<p class="committee-college">' + esc(m.college) + '</p>' : '') +
          (m.bio ? '<p class="committee-bio">' + esc(m.bio) + '</p>' : '') +
          (m.email ? '<a class="committee-email" href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── EVENTS / TERM CARDS ────────────────────────────────────────────────────
  function eventRows(events) {
    var now = today();
    var sorted = (events || []).slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    });
    if (!sorted.length) return '';
    return '<div class="events-list">' + sorted.map(function (ev) {
      var d = parseDate(ev.date);
      var past = d && d < now;
      var meta = [ev.time, ev.location].filter(Boolean).map(esc).join(' &middot; ');
      return '<div class="event-row' + (past ? ' event-past' : '') + '">' +
        '<div class="event-date">' +
          (d ? '<div class="event-date-day">' + d.getDate() + '</div><div class="event-date-month">' + MONTHS[d.getMonth()] + '</div>'
             : '<div class="event-date-month">TBC</div>') +
        '</div>' +
        '<div class="event-body">' +
          '<strong>' + esc(ev.title) + '</strong>' +
          (meta ? '<span>' + meta + '</span>' : '') +
          (ev.description ? '<p class="event-desc">' + esc(ev.description) + '</p>' : '') +
          (ev.link && !past ? '<a class="event-link" href="' + esc(ev.link) + '" target="_blank" rel="noopener">Sign up &rarr;</a>' : '') +
        '</div>' +
        (ev.type ? '<span class="event-tag">' + esc(ev.type) + '</span>' : '<span></span>') +
      '</div>';
    }).join('') + '</div>';
  }

  function termBody(t) {
    var card = t.termCard
      ? '<a class="term-card" href="' + esc(t.termCard) + '" target="_blank" rel="noopener">' +
          '<img src="' + esc(t.termCard) + '" alt="' + esc(t.term) + ' term card" loading="lazy" /></a>'
      : '';
    var rows = eventRows(t.events);
    if (!card && !rows) return '<div class="empty-state"><p>Events for this term will be announced soon.</p></div>';
    return '<div class="term-layout' + (card && rows ? '' : ' term-layout-single') + '">' + card + rows + '</div>';
  }

  function renderEvents(data) {
    var current = $('currentTerm');
    var past = $('pastTerms');
    if (!current) return;
    var terms = (data.terms || []).slice().sort(function (a, b) {
      return String(b.startDate).localeCompare(String(a.startDate));
    });

    if (terms.length) {
      current.innerHTML = '<span class="term-label">' + esc(terms[0].term) + '</span>' + termBody(terms[0]);
    }

    if (past && terms.length > 1) {
      past.innerHTML = terms.slice(1).map(function (t) {
        return '<details class="past-term"><summary>' + esc(t.term) + '</summary>' + termBody(t) + '</details>';
      }).join('');
    }
  }

  // ── DOCUMENTS ──────────────────────────────────────────────────────────────
  function renderDocuments(data) {
    var grid = $('docGrid');
    if (!grid) return;
    grid.innerHTML = (data.documents || []).map(function (doc) {
      var ext = (String(doc.file).split('.').pop() || 'file').slice(0, 4).toUpperCase();
      return '<a class="doc-card" href="' + esc(doc.file) + '" target="_blank" rel="noopener">' +
        '<div class="doc-icon">' + esc(ext) + '</div>' +
        '<div class="doc-info">' +
          '<strong>' + esc(doc.title) + '</strong>' +
          (doc.description ? '<span>' + esc(doc.description) + '</span>' : '') +
          '<div class="doc-download">&#8595; Download ' + esc(ext) + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  // ── HOME: PHOTOS + SPONSORS ────────────────────────────────────────────────
  function renderGallery(data) {
    var section = $('photos');
    var photos = (data.photos || []).filter(function (p) { return p.image; });
    if (!section || !photos.length) return;
    $('galleryGrid').innerHTML = photos.map(function (p) {
      return '<figure class="gallery-item">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.caption || 'Oxford Motorsport Society event') + '" loading="lazy" />' +
        (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') +
      '</figure>';
    }).join('');
    section.hidden = false;
  }

  function renderSponsors(data) {
    var grid = $('sponsorGrid');
    var sponsors = (data.sponsors || []).filter(function (s) { return s.name; });
    if (!grid || !sponsors.length) return;
    grid.innerHTML = sponsors.map(function (s) {
      var inner = s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy" />' : '<span>' + esc(s.name) + '</span>';
      return s.url
        ? '<a class="sponsor" href="' + esc(s.url) + '" target="_blank" rel="noopener" title="' + esc(s.name) + '">' + inner + '</a>'
        : '<div class="sponsor" title="' + esc(s.name) + '">' + inner + '</div>';
    }).join('');
    grid.hidden = false;
    var heading = $('sponsorHeading');
    if (heading) heading.textContent = 'Our Sponsors';
  }

  var renderers = {
    site: renderSite,
    committee: renderCommittee,
    events: renderEvents,
    documents: renderDocuments,
    gallery: renderGallery,
    sponsors: renderSponsors
  };

  // Each page lists the content files it needs: <body data-content="site committee">
  (document.body.getAttribute('data-content') || 'site').split(/\s+/).forEach(function (name) {
    if (!renderers[name]) return;
    load(name).then(renderers[name]).catch(function (err) { console.error(err); });
  });
})();
