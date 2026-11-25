<?php
/**
 * Global Network — hero з живим глобусом (d3-geo orthographic на <canvas>), за підписаним Figma
 * («06 About Heysea / Global Network», Globe · Rotation 01–06): navy-фон, темно-синя планета.
 * Порядок: text-fill заголовка (pin) → планета піднімається до центру → м'який поворот з офісами →
 * планета їде вгору, внизу — статистика. Дані як з ACF.
 */
$globe = [
    'eyebrow' => 'Global Network',
    'title'   => ['A growing presence across key', 'yachting markets worldwide.'], // [рядок, акцент italic serif]
    'lead'    => 'A worldwide network built to support every Heysea owner.',
    'cta'     => ['label' => 'Start Your Journey', 'href' => '#contact'],
    // tone: light — світлий тег, dark — акцентний; side: left/right — тег збоку від точки (Malta й Istanbul поруч)
    'offices' => [
        ['label' => 'Federal Highway, Boca Raton', 'lat' => 26.36, 'lng' => -80.08, 'tone' => 'light'],
        ['label' => 'Howard Street, Malta',        'lat' => 35.90, 'lng' => 14.50,  'tone' => 'light', 'side' => 'left'],
        ['label' => 'Istanbul, Türkiye',           'lat' => 41.01, 'lng' => 28.98,  'tone' => 'light', 'side' => 'right'],
        ['label' => 'Guangdong Province, China',   'lat' => 23.10, 'lng' => 113.30, 'tone' => 'dark'],
    ],
    'stats' => [
        ['value' => 15, 'suffix' => '+', 'label' => 'Countries Served'],
        ['value' => 30, 'suffix' => '+', 'label' => 'Dealer & Service Partners'],
        ['value' => 4,  'suffix' => '',  'label' => 'Continents'],
    ],
];
$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
?>
<section id="globe" class="demo-sec globe" aria-labelledby="globe-title">
  <div class="globe__stage">
    <span class="demo-label">04 · Globe — live d3-geo canvas, scroll-scrubbed</span>
    <header class="globe__head container">
      <p class="globe__eyebrow"><?= $e($globe['eyebrow']) ?></p>
      <h2 class="globe__title" id="globe-title"><?= $e($globe['title'][0]) ?><br><em><?= $e($globe['title'][1]) ?></em></h2>
      <p class="globe__lead"><?= $e($globe['lead']) ?></p>
      <a class="globe__cta" href="<?= $e($globe['cta']['href']) ?>"><?= $e($globe['cta']['label']) ?>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a>
    </header>

    <div class="globe__planet" aria-hidden="true">
      <canvas class="globe__canvas"></canvas>
      <div class="globe__markers">
        <?php foreach ($globe['offices'] as $o): ?>
        <span class="globe-marker globe-marker--<?= $e($o['tone']) ?><?= !empty($o['side']) ? ' globe-marker--' . $e($o['side']) : '' ?>" data-lat="<?= $e($o['lat']) ?>" data-lng="<?= $e($o['lng']) ?>">
          <i class="globe-marker__dot"></i>
          <b class="globe-marker__label"><?= $e($o['label']) ?></b>
        </span>
        <?php endforeach; ?>
      </div>
    </div>

    <div class="globe__fade" aria-hidden="true"></div>

    <!-- Доступний текстовий список офісів (маркери на глобусі декоративні) -->
    <ul class="visually-hidden-globe">
      <?php foreach ($globe['offices'] as $o): ?><li><?= $e($o['label']) ?></li><?php endforeach; ?>
    </ul>

    <dl class="globe__stats container">
      <?php foreach ($globe['stats'] as $s): ?>
      <div class="globe-stat">
        <dt class="globe-stat__value"><span data-count="<?= (int)$s['value'] ?>"><?= (int)$s['value'] ?></span><?= $e($s['suffix']) ?></dt>
        <dd class="globe-stat__label"><?= $e($s['label']) ?></dd>
      </div>
      <?php endforeach; ?>
    </dl>
  </div>
</section>
<div class="demo-spacer">↓ next block: “Trusted partners, around the world.”</div>
