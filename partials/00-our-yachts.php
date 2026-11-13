<?php
/**
 * Intro · Our yachts — Figma 2065:21717 (frame 1440×800).
 * Pinned (~250%); photos fly toward the viewer from depth (perspective projection around the frame centre),
 * dissolve near the "camera" and new ones keep emerging from the vanishing point. The italic tail of the
 * title fills grey → navy with scroll. The title uses mix-blend-mode:difference so it stays readable
 * ("in negative") when a photo passes under it.
 *
 * Photos: 'slots' = the Figma composition (x, y, w, h in the 1440×800 frame, initial opacity = Figma wash).
 *         'stream' = extra photos that emerge from depth later: offset (dx, dy) from the centre and size (w, h)
 *         are the values at depth 1, 'z' = starting depth (bigger = farther).
 * 'm' => false hides a photo on phones.
 */
$oy_block = [
    'eyebrow' => 'Our yachts',
    // line parts: [text, italic?, fills-on-scroll?]
    'lines' => [
        [['Distinctive', true, false], [' by design.', false, false]],
        [['Crafted ', false, false], ['with purpose.', true, true]],
    ],
];
$oy_dir = 'assets/img/our-yachts/';
$oy_slots = [
    ['img' => 'raw-4.jpg',  'x' => 416,  'y' => 157, 'w' => 151, 'h' => 178, 'o' => 1,    'm' => true,  'alt' => 'HeySea yacht cruising, aerial view'],
    ['img' => 'raw-1.jpg',  'x' => 853,  'y' => 458, 'w' => 151, 'h' => 178, 'o' => 1,    'm' => true,  'alt' => 'Teak side deck at sunset'],
    ['img' => 'raw-7.jpg',  'x' => 895,  'y' => 189, 'w' => 90,  'h' => 106, 'o' => 0.95, 'm' => true,  'alt' => 'Yacht along a rocky coast'],
    ['img' => 'raw-5.jpg',  'x' => 1122, 'y' => 246, 'w' => 113, 'h' => 134, 'o' => 0.7,  'm' => false, 'alt' => 'Master cabin'],
    ['img' => 'raw-2.jpg',  'x' => 251,  'y' => 446, 'w' => 128, 'h' => 150, 'o' => 0.55, 'm' => true,  'alt' => 'Yacht on a bright sea'],
    ['img' => 'raw-15.jpg', 'x' => 548,  'y' => 530, 'w' => 95,  'h' => 112, 'o' => 0.75, 'm' => false, 'alt' => 'Guest bathroom'],
    ['img' => 'raw-9.jpg',  'x' => 185,  'y' => 260, 'w' => 57,  'h' => 68,  'o' => 0.4,  'm' => false, 'alt' => 'Interior staircase'],
    ['img' => 'raw-16.jpg', 'x' => 1197, 'y' => 512, 'w' => 57,  'h' => 68,  'o' => 0.4,  'm' => false, 'alt' => 'Yacht underway'],
];
$oy_stream = [
    ['img' => 'raw-10.jpg', 'dx' => 260,  'dy' => -420, 'w' => 200, 'h' => 236, 'z' => 3.4, 'm' => true],
    ['img' => 'raw-13.jpg', 'dx' => -560, 'dy' => -400, 'w' => 200, 'h' => 236, 'z' => 3.7, 'm' => true],
    ['img' => 'raw-6.jpg',  'dx' => 620,  'dy' => 400,  'w' => 200, 'h' => 236, 'z' => 4.0, 'm' => true],
    ['img' => 'raw-12.jpg', 'dx' => -1000,'dy' => 120,  'w' => 200, 'h' => 236, 'z' => 4.3, 'm' => true],
    ['img' => 'raw-14.jpg', 'dx' => -380, 'dy' => 430,  'w' => 200, 'h' => 236, 'z' => 4.6, 'm' => false],
    ['img' => 'raw-8.jpg',  'dx' => 1000, 'dy' => -160, 'w' => 200, 'h' => 236, 'z' => 4.9, 'm' => false],
    ['img' => 'raw-3.jpg',  'dx' => 420,  'dy' => -440, 'w' => 200, 'h' => 236, 'z' => 5.2, 'm' => true],
    ['img' => 'raw-11.jpg', 'dx' => -260, 'dy' => 440,  'w' => 200, 'h' => 236, 'z' => 5.5, 'm' => true],
    ['img' => 'raw-2.jpg',  'dx' => 900,  'dy' => 260,  'w' => 200, 'h' => 236, 'z' => 5.8, 'm' => true],
    ['img' => 'raw-4.jpg',  'dx' => -880, 'dy' => -240, 'w' => 200, 'h' => 236, 'z' => 6.1, 'm' => false],
];
$e = static fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
?>
<section id="our-yachts" class="demo-sec oy" aria-labelledby="oy-title">
  <span class="demo-label">00 · Our yachts — depth fly-through</span>
  <div class="oy__stage">
    <div class="oy__photos" aria-hidden="true">
      <?php foreach ($oy_slots as $p): ?>
      <img class="oy__ph" src="<?= $e($oy_dir . $p['img']) ?>" alt="" decoding="async"
           data-x="<?= (int) $p['x'] ?>" data-y="<?= (int) $p['y'] ?>" data-w="<?= (int) $p['w'] ?>" data-h="<?= (int) $p['h'] ?>"
           data-o="<?= (float) $p['o'] ?>" data-m="<?= $p['m'] ? 1 : 0 ?>">
      <?php endforeach; ?>
      <?php foreach ($oy_stream as $p): ?>
      <img class="oy__ph oy__ph--stream" src="<?= $e($oy_dir . $p['img']) ?>" alt="" decoding="async" loading="lazy"
           data-dx="<?= (int) $p['dx'] ?>" data-dy="<?= (int) $p['dy'] ?>" data-w="<?= (int) $p['w'] ?>" data-h="<?= (int) $p['h'] ?>"
           data-z="<?= (float) $p['z'] ?>" data-m="<?= $p['m'] ? 1 : 0 ?>">
      <?php endforeach; ?>
    </div>
    <div class="oy__text">
      <p class="oy__eyebrow"><?= $e($oy_block['eyebrow']) ?></p>
      <h2 class="oy__title" id="oy-title">
        <?php foreach ($oy_block['lines'] as $line): ?>
        <span class="oy__line"><?php foreach ($line as [$txt, $italic, $fill]): ?><span class="<?= $italic ? 'oy__it' : '' ?><?= $fill ? ' oy__fill' : '' ?>"><?= $e($txt) ?></span><?php endforeach; ?></span>
        <?php endforeach; ?>
      </h2>
    </div>
  </div>
</section>
<div class="demo-spacer">↓ series</div>
