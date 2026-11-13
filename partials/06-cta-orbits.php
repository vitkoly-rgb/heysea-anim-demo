<?php
/**
 * CTA with orbiting coordinates.
 * Background canvas (assets/js/cta-orbits.js): faint ellipses, a dot travels each one with a fading trail
 * and a live "[lat lon]" label derived from its position. Continuous, NOT scroll-bound.
 * The last heading word gets a scroll-scrubbed text fill (grey → white).
 */
$cta = [
    'eyebrow'    => 'Get in touch',
    'title'      => 'Ready to create something',
    'title_em'   => 'exceptional?',
    'text'       => 'Start a conversation with our team and discover how your vision can take shape at sea.',
    'button'     => ['label' => 'Contact us', 'url' => '#contact'],
    // Orbit config. cx/cy = center as a fraction of the block, rx = fraction of width, ry = fraction of height,
    // rot = tilt (deg), speed = rad/s (sign = direction; Round 3: ÷10 — slow "stars"), lat/lon = where the coordinate "ground track" starts.
    'orbits'     => [
        ['cx' => 0.16, 'cy' => 0.92, 'rx' => 0.40, 'ry' => 0.62, 'rot' => -16, 'speed' => 0.0070, 'phase' => 5.00, 'lat' => 39.9, 'lon' => 116.4],
        ['cx' => 0.86, 'cy' => 0.10, 'rx' => 0.30, 'ry' => 0.80, 'rot' => 28,  'speed' => -0.0055, 'phase' => 1.25, 'lat' => 43.5, 'lon' => 7.0],
        ['cx' => 0.62, 'cy' => 0.50, 'rx' => 0.48, 'ry' => 0.95, 'rot' => 12,  'speed' => -0.0045, 'phase' => 2.75, 'lat' => 22.3, 'lon' => 114.2],
    ],
];
$e = static fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
?>
<section id="cta-orbits" class="demo-sec cta" aria-labelledby="cta-title">
  <span class="demo-label">06 · CTA orbits</span>
  <canvas class="cta-canvas" aria-hidden="true" data-orbits="<?= $e(json_encode($cta['orbits'])) ?>"></canvas>
  <div class="container cta-inner">
    <p class="cta-eyebrow"><?= $e($cta['eyebrow']) ?></p>
    <h2 class="cta-title" id="cta-title"><?= $e($cta['title']) ?> <em class="cta-em"><?= $e($cta['title_em']) ?></em></h2>
    <p class="cta-text"><?= $e($cta['text']) ?></p>
    <a class="cta-btn" href="<?= $e($cta['button']['url']) ?>">
      <span><?= $e($cta['button']['label']) ?></span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M14 6l6 6-6 6"/></svg>
    </a>
  </div>
</section>
<div class="demo-spacer">↓ scroll past the CTA</div>
