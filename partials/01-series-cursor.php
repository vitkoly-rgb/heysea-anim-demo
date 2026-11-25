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
    ],
    [
        'title' => 'Explorer',
        'text'  => 'Long-range expedition yachts built for remote waters, extended autonomy and confident ocean crossings.',
        'video' => 'assets/video/series-2.mp4',
        'poster'=> 'assets/img/photo-2.jpg',
    ],
    [
        'title' => 'Bespoke Superyachts',
        'text'  => 'Fully custom builds shaped with the owner — from the first sketch to the last stitch of the interior.',
        'video' => 'assets/video/series-3.mp4',
        'poster'=> 'assets/img/photo-3.jpg',
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
      <!-- Per-panel copy: visible in the static (reduced-motion / no-JS) layout; in pinned mode it is
           visually hidden (kept for screen readers) and the fixed HUD below shows the text instead. -->
      <div class="sc__copy">
        <h2 class="sc__title"><?= $e($s['title']) ?></h2>
        <p class="sc__text"><?= $e($s['text']) ?></p>
      </div>
    </article>
    <?php endforeach; ?>

    <!-- Fixed HUD (pinned mode): text stays in place, only its content flips inside clipping masks. -->
    <div class="sc__hud">
      <div class="sc__hud-copy" aria-hidden="true">
        <div class="sc__mask sc__mask--title">
          <?php foreach ($sc_series as $s): ?><p class="sc__hud-title"><?= $e($s['title']) ?></p><?php endforeach; ?>
        </div>
        <div class="sc__mask sc__mask--text">
          <?php foreach ($sc_series as $s): ?><p class="sc__hud-text"><?= $e($s['text']) ?></p><?php endforeach; ?>
        </div>
      </div>
      <nav class="sc__nav" aria-label="Yacht series">
        <p class="sc__counter" aria-hidden="true">
          <span class="sc__mask sc__mask--num"><?php foreach ($sc_series as $i => $s): ?><span><?= sprintf('%02d', $i + 1) ?></span><?php endforeach; ?></span>
          <span class="sc__counter-total">/ <?= sprintf('%02d', count($sc_series)) ?></span>
        </p>
        <ol class="sc__ticks">
          <?php foreach ($sc_series as $i => $s): ?>
          <li><button type="button" class="sc__tick<?= $i === 0 ? ' is-active' : '' ?>" data-index="<?= $i ?>"<?= $i === 0 ? ' aria-current="true"' : '' ?>><span class="sc__sr"><?= $e($s['title']) ?></span></button></li>
          <?php endforeach; ?>
        </ol>
      </nav>
    </div>

    <!-- Static badge for touch devices (custom cursor is hidden there) -->
    <span class="sc__badge" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="40" height="40"><circle cx="24" cy="24" r="23" fill="none" stroke="#fff" stroke-width="1.3"/><circle cx="24" cy="24" r="19" fill="rgba(255,255,255,.18)"/><path d="M5 24.6 H43 A19 19 0 0 1 5 24.6Z" fill="#fff"/></svg>
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
