(function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var projet = projets.find(function (p) { return p.id === id; });

  if (!projet) {
    window.location.href = 'index.html';
    return;
  }

  document.title = projet.titre + ' | Maxime Romieu';
  document.getElementById('btn-behance').href = projet.behance;
  var mobileBehance = document.getElementById('mobile-behance');
  if(mobileBehance) mobileBehance.href = projet.behance;

  var html = '';

  var videoIndex = 0;
  var coverImages = projet.coverImages || [];
  var imagePositions = projet.imagePositions || {};
  var imageRotations = projet.imageRotations || {};

  function renderMedia(src, titre, index) {
    if (/\.mp4$/i.test(src)) {
      var vid = 'mp4-' + (videoIndex++);
      return '<div class="video-mp4-wrapper">'
        + '<video class="projet-video-mp4" id="' + vid + '" autoplay loop muted playsinline>'
        + '<source src="' + src + '" type="video/mp4">'
        + '</video>'
        + '<button class="video-sound-btn" data-vid="' + vid + '">SOUND OFF</button>'
        + '</div>';
    }
    if (imageRotations[index]) {
      return '<div class="img-rot90-wrap"><img src="' + src + '" alt="' + titre + ' — ' + index + '" loading="lazy"></div>';
    }
    var cls = coverImages.indexOf(index) !== -1 ? ' class="img-cover"' : '';
    var styleVal = '';
    if (imagePositions[index]) styleVal += 'object-position:' + imagePositions[index] + ';';
    var style = styleVal ? ' style="' + styleVal + '"' : '';
    return '<img src="' + src + '" alt="' + titre + ' — ' + index + '" loading="lazy"' + cls + style + '>';
  }

  // Header
  var tagsHtml = projet.tags.map(function (t) {
    return '<span class="tag">' + t + '</span>';
  }).join('');

  html += '<header class="projet-header">'
    + '<h1 class="projet-titre">' + projet.titre + '</h1>'
    + '<div class="projet-meta">'
    +   '<span class="projet-categorie">' + projet.categorie + '</span>'
    +   '<span class="projet-annee">' + projet.annee + '</span>'
    + '</div>'
    + '<div class="projet-tags">' + tagsHtml + '</div>'
    + '</header>';

  // Cover
  if (projet.images.length > 0) {
    html += '<img src="' + projet.images[0] + '" alt="' + projet.titre + '" class="projet-cover">';
  }

  // Description
  html += '<div class="projet-description"><p>' + projet.description + '</p></div>';

  // Vidéo YouTube (seulement si renseignée)
  if (projet.video) {
    var match = projet.video.match(/embed\/([^?&]+)/);
    var videoId = match ? match[1] : null;
    if (videoId) {
      html += '<div class="projet-video-yt">'
        + '<div class="yt-wrapper">'
        + '<div id="yt-player"></div>'
        + '<div class="yt-overlay" id="yt-overlay"></div>'
        + '<button class="yt-sound-btn" id="yt-sound-btn">SON OFF</button>'
        + '</div>'
        + '</div>';
    }
  }

  // Galerie (images[1] et suivantes)
  if (projet.images.length > 1) {
    var grids = projet.galerieGrids || [];

    // Compatibilité avec l'ancienne config single-grid
    if (grids.length === 0 && projet.galerieGridCount) {
      grids = [{
        start: projet.galerieGridStart !== undefined ? projet.galerieGridStart : 1,
        count: projet.galerieGridCount,
        cols: projet.galerieGridCols || 2,
        natural: projet.galerieGridNatural || false
      }];
    }

    if (grids.length === 0) {
      html += '<div class="projet-galerie">';
      for (var i = 1; i < projet.images.length; i++) {
        html += renderMedia(projet.images[i], projet.titre, i);
      }
      html += '</div>';
    } else {
      var cursor = 1;
      for (var g = 0; g < grids.length; g++) {
        var grid = grids[g];
        var gEnd = Math.min(grid.start + grid.count, projet.images.length);

        // Colonne avant cette grille
        if (cursor < grid.start) {
          html += '<div class="projet-galerie">';
          for (var i = cursor; i < grid.start; i++) {
            html += renderMedia(projet.images[i], projet.titre, i);
          }
          html += '</div>';
        }

        // Grille
        var gridClass = 'projet-galerie-grid' + (grid.natural ? ' projet-galerie-grid--natural' : '');
        html += '<div class="' + gridClass + '" style="grid-template-columns:repeat(' + (grid.cols || 2) + ',1fr)">';
        for (var i = grid.start; i < gEnd; i++) {
          html += renderMedia(projet.images[i], projet.titre, i);
        }
        html += '</div>';

        cursor = gEnd;
      }

      // Colonne après la dernière grille
      if (cursor < projet.images.length) {
        html += '<div class="projet-galerie">';
        for (var i = cursor; i < projet.images.length; i++) {
          html += renderMedia(projet.images[i], projet.titre, i);
        }
        html += '</div>';
      }
    }
  }

  // Crédit
  if (projet.credit) {
    html += '<div class="projet-credit">'
      + '<span class="projet-credit-label">' + projet.credit + '</span>'
      + '<span class="projet-credit-name">by Maxime Romieu</span>'
      + '<ul class="projet-credit-links">'
      + '<li><a href="https://www.linkedin.com/in/maximeromieu/" target="_blank" rel="noopener">LinkedIn</a></li>'
      + '<li><a href="https://www.behance.net/maximeromieu" target="_blank" rel="noopener">Behance</a></li>'
      + '<li><a href="https://instagram.com/maxime.romieu" target="_blank" rel="noopener">Instagram</a></li>'
      + '</ul>'
      + '</div>';
  }

  document.getElementById('contenu-projet').innerHTML = html;

  // Rotation 90° sans crop : adapter le wrapper aux dimensions réelles de l'image
  document.querySelectorAll('.img-rot90-wrap img').forEach(function(img) {
    function applyRot() {
      var r = img.naturalWidth / img.naturalHeight; // > 1 si paysage
      var wrap = img.parentElement;
      wrap.style.aspectRatio = '1/' + r;
      img.style.height = (100 / r).toFixed(4) + '%';
      img.style.width = 'auto';
    }
    if (img.complete && img.naturalWidth > 0) { applyRot(); }
    else { img.addEventListener('load', applyRot); }
  });

  // Boutons son pour les vidéos mp4
  document.querySelectorAll('.video-sound-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var video = document.getElementById(btn.getAttribute('data-vid'));
      if (!video) return;
      video.muted = !video.muted;
      btn.textContent = video.muted ? 'SOUND OFF' : 'SOUND ON';
    });
  });

  // Initialisation YouTube IFrame API (si applicable)
  if (projet.video) {
    var match2 = projet.video.match(/embed\/([^?&]+)/);
    var ytId = match2 ? match2[1] : null;
    if (ytId) {
      var ytPlayer = null;
      var isMuted = true;
      var isPlaying = true;

      function initYT() {
        ytPlayer = new YT.Player('yt-player', {
          videoId: ytId,
          playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: ytId, controls: 0, modestbranding: 1, rel: 0 },
          events: { onReady: function(e) { e.target.playVideo(); } }
        });
      }

      if (window.YT && window.YT.Player) { initYT(); }
      else {
        window.onYouTubeIframeAPIReady = initYT;
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      document.getElementById('yt-overlay').addEventListener('click', function() {
        if (!ytPlayer) return;
        if (isPlaying) { ytPlayer.pauseVideo(); } else { ytPlayer.playVideo(); }
        isPlaying = !isPlaying;
      });

      document.getElementById('yt-sound-btn').addEventListener('click', function() {
        if (!ytPlayer) return;
        if (isMuted) { ytPlayer.unMute(); this.textContent = 'SON ON'; }
        else { ytPlayer.mute(); this.textContent = 'SON OFF'; }
        isMuted = !isMuted;
      });
    }
  }

})();
