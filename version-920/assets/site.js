(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
      return;
    }
    document.addEventListener('DOMContentLoaded', fn);
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 6200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    show(0);
    start();
  }

  function matchYear(year, rule) {
    if (rule === 'all') {
      return true;
    }
    if (!year) {
      return false;
    }
    if (rule === 'new') {
      return year >= 2024;
    }
    if (rule === '2020s') {
      return year >= 2020 && year <= 2029;
    }
    if (rule === '2010s') {
      return year >= 2010 && year <= 2019;
    }
    if (rule === 'classic') {
      return year > 0 && year < 2010;
    }
    return true;
  }

  function initFiltering() {
    var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-card-search]'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-year-filter]'));
    if (!cards.length) {
      return;
    }
    var query = '';
    var yearRule = 'all';

    function apply() {
      var q = query.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-text') || '').toLowerCase();
        var year = parseInt(card.getAttribute('data-year') || '0', 10);
        var visible = (!q || text.indexOf(q) !== -1) && matchYear(year, yearRule);
        card.classList.toggle('hidden-card', !visible);
      });
    }

    searchInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        query = input.value || '';
        apply();
      });
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        yearRule = chip.getAttribute('data-year-filter') || 'all';
        chips.forEach(function (item) {
          item.classList.toggle('active', item === chip);
        });
        apply();
      });
    });
  }

  function initPlayers() {
    var frames = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    frames.forEach(function (frame) {
      var video = frame.querySelector('video');
      var overlay = frame.querySelector('.player-overlay');
      var stream = frame.getAttribute('data-stream');
      var started = false;
      var hlsInstance = null;

      if (!video || !stream) {
        return;
      }

      function begin() {
        if (started) {
          video.play().catch(function () {});
          return;
        }
        started = true;
        if (overlay) {
          overlay.classList.add('hidden');
        }
        video.setAttribute('controls', 'controls');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          video.play().catch(function () {});
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
          if (window.Hls.Events && window.Hls.Events.MANIFEST_PARSED) {
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
          } else {
            video.play().catch(function () {});
          }
          return;
        }

        video.src = stream;
        video.play().catch(function () {});
      }

      if (overlay) {
        overlay.addEventListener('click', begin);
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          begin();
        }
      });
      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function createSearchCard(item) {
    var card = document.createElement('article');
    card.className = 'search-result';
    card.innerHTML = [
      '<a href="' + item.url + '"><img src="' + item.cover + '" alt="' + item.title.replace(/"/g, '&quot;') + '"></a>',
      '<div>',
      '<h3><a href="' + item.url + '">' + item.title + '</a></h3>',
      '<p>' + item.line + '</p>',
      '<div class="mini-meta">' + item.region + ' · ' + item.year + ' · ' + item.type + '</div>',
      '</div>'
    ].join('');
    return card;
  }

  function initGlobalSearch() {
    var input = document.querySelector('[data-global-search]');
    var results = document.querySelector('[data-search-results]');
    if (!input || !results || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    function render(items) {
      results.innerHTML = '';
      items.slice(0, 80).forEach(function (item) {
        results.appendChild(createSearchCard(item));
      });
    }

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        render(window.MOVIE_SEARCH_INDEX.slice(0, 24));
        return;
      }
      var matches = window.MOVIE_SEARCH_INDEX.filter(function (item) {
        return item.text.toLowerCase().indexOf(q) !== -1;
      });
      render(matches);
    });

    render(window.MOVIE_SEARCH_INDEX.slice(0, 24));
  }

  ready(function () {
    initMenu();
    initHero();
    initFiltering();
    initPlayers();
    initGlobalSearch();
  });
})();
