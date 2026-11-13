<?php
/**
 * Series slider (pinned, panels slide over each other) + "ONBOARD" water cursor.
 * Reference: feadship.nl home. Data mimics an ACF repeater "series".
 */
$sc_series = [
    [
        'title' => 'Asteria',
        'text'  => 'Elegant and timeless yachts designed around open spaces, refined interiors and effortless comfort at sea.',
        'video' => 'assets/video/series-1.mp4',
        'poster'=> 'assets/img/photo-1.jpg',
        'link'  => '#asteria',
    ],
    [
        'title' => 'Explorer',
        'text'  => 'Long-range expedition yachts built for remote waters, extended autonomy and confident ocean crossings.',
        'video' => 'assets/video/series-2.mp4',
        'poster'=> 'assets/img/photo-2.jpg',
        'link'  => '#explorer',
    ],
    [
        'title' => 'Bespoke Superyachts',
        'text'  => 'Fully custom builds shaped with the owner — from the first sketch to the last stitch of the interior.',
        'video' => 'assets/video/series-3.mp4',
        'poster'=> 'assets/img/photo-3.jpg',
        'link'  => '#bespoke',
    ],
];
$sc_cursor_label = 'Onboard';
$e = static fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
?>
<section id="series-cursor" class="demo-sec sc" aria-label="Yacht series">
  <span class="demo-label">01 · Series slider + water cursor</span>

  <div class="sc__stage">
    <?php foreach ($sc_series as $i => $s): ?>
    <article class="sc__panel" data-index="<?= $i ?>" data-title="<?= $e($s['title']) ?>">
      <div class="sc__media">
        <video class="sc__video" src="<?= $e($s['video']) ?>" poster="<?= $e($s['poster']) ?>"
               muted loop playsinline preload="<?= $i === 0 ? 'auto' : 'metadata' ?>" aria-hidden="true"></video>
        <span class="sc__shade" aria-hidden="true"></span>
      </div>
      <div class="sc__copy">
        <p class="sc__count"><?= sprintf('%02d', $i + 1) ?> / <?= sprintf('%02d', count($sc_series)) ?></p>
        <h2 class="sc__title"><?= $e($s['title']) ?></h2>
        <p class="sc__text"><?= $e($s['text']) ?></p>
        <a class="sc__cta" href="<?= $e($s['link']) ?>"><?= $e($sc_cursor_label) ?> <span aria-hidden="true">→</span></a>
      </div>
    </article>
    <?php endforeach; ?>

    <!-- Static badge for touch devices (custom cursor is hidden there) -->
    <span class="sc__badge" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="40" height="40"><circle cx="24" cy="24" r="22.5" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M3.1 26 H44.9 A21 21 0 0 1 3.1 26Z" fill="#fff"/></svg>
      <?= $e($sc_cursor_label) ?>
    </span>
  </div>

  <!-- Custom cursor: canvas water simulation + label. Fixed-positioned, driven by JS. -->
  <div class="sc-cursor" aria-hidden="true">
    <canvas class="sc-cursor__water" width="64" height="64"></canvas>
    <span class="sc-cursor__label"><?= $e($sc_cursor_label) ?></span>
  </div>
</section>
<div class="demo-spacer">↓ before / after</div>
