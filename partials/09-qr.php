<?php
/**
 * Contacts · "Follow HeySea" — QR columns (matches Figma node 970:59416, initial state).
 * One column per channel, zig-zag: odd columns = QR + label on top, description at the bottom;
 * even columns = description on top, QR + label at the bottom. Each description stays in its own column.
 * Desktop: section pins and vertical scroll moves the row right → left (scrub), then releases.
 * Mobile: native horizontal swipe with scroll-snap. Reduced motion: static wrap.
 * QR codes are decorative pseudo-QR SVGs; in production they're uploaded images (ACF image field).
 */
$qr_block = [
    'eyebrow' => 'Follow HeySea',
    'title'   => 'Scan to follow our official channels and stay connected.',
];
// 'dy' = small vertical offset of the QR group (px) for the irregular rhythm of the mockup
$qr_channels = [
    ['name' => 'Instagram',   'url' => '#instagram',   'dy' => 0,   'text' => 'Moments at sea, owner stories and life on board from our global community.'],
    ['name' => 'YouTube',     'url' => '#youtube',     'dy' => 0,   'text' => 'New launches, yard updates, and behind-the-scenes moments — wherever you spend your time online.'],
    ['name' => 'LinkedIn',    'url' => '#linkedin',    'dy' => 16,  'text' => 'Company news, partnerships and careers at the HeySea shipyard.'],
    ['name' => 'WeChat',      'url' => '#wechat',      'dy' => -34, 'text' => 'Stories from the shipyard, new launches worth sharing.'],
    ['name' => 'Facebook',    'url' => '#facebook',    'dy' => -36, 'text' => 'Stories from the shipyard, new launches worth sharing.'],
    ['name' => 'Weibo',       'url' => '#weibo',       'dy' => 10,  'text' => 'Daily updates from the yard and boat shows across China.'],
    ['name' => 'Douyin',      'url' => '#douyin',      'dy' => 20,  'text' => 'Short films from sea trials and behind-the-scenes builds.'],
    ['name' => 'Xiaohongshu', 'url' => '#xiaohongshu', 'dy' => -20, 'text' => 'Interior details, lifestyle notes and owner journeys.'],
];
$e = static fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

/** Deterministic pseudo-QR (25×25 modules) as one SVG path: 3 finder patterns, timing lines, seeded data. */
function qr_svg(string $seed, string $label): string {
    $n = 25;
    mt_srand(crc32($seed));
    $finder = static function ($x, $y) use ($n) {
        foreach ([[0, 0], [$n - 7, 0], [0, $n - 7]] as [$fx, $fy]) {
            if ($x >= $fx - 1 && $x <= $fx + 7 && $y >= $fy - 1 && $y <= $fy + 7) return [$x - $fx, $y - $fy];
        }
        return null;
    };
    $d = '';
    for ($y = 0; $y < $n; $y++) {
        for ($x = 0; $x < $n; $x++) {
            $f = $finder($x, $y);
            if ($f) {
                [$fx, $fy] = $f;
                $ring = max(abs($fx - 3), abs($fy - 3));
                $fill = $fx >= 0 && $fy >= 0 && $fx <= 6 && $fy <= 6 && ($ring === 3 || $ring <= 1);
            } elseif ($x >= $n - 9 && $x <= $n - 5 && $y >= $n - 9 && $y <= $n - 5) {
                $ring = max(abs($x - ($n - 7)), abs($y - ($n - 7)));
                $fill = $ring !== 1; // alignment pattern
            } elseif ($y === 6 || $x === 6) {
                $fill = ($x + $y) % 2 === 0; // timing patterns
            } else {
                $fill = mt_rand(0, 99) < 50;
            }
            if ($fill) $d .= "M$x {$y}h1v1h-1z";
        }
    }
    return '<svg class="qr__code" viewBox="0 0 25 25" role="img" aria-label="' . htmlspecialchars('QR code ' . $label, ENT_QUOTES, 'UTF-8') . '">'
        . '<path d="' . $d . '" fill="currentColor" shape-rendering="crispEdges"/></svg>';
}
?>
<div class="demo-spacer">↓ QR columns (contacts)</div>
<section id="qr" class="demo-sec qr" aria-labelledby="qr-title">
  <span class="demo-label">09 · QR columns — horizontal scroll</span>
  <div class="qr__inner">
    <header class="qr__head">
      <p class="qr__eyebrow"><?= $e($qr_block['eyebrow']) ?></p>
      <h2 class="qr__title" id="qr-title"><?= $e($qr_block['title']) ?></h2>
    </header>
    <div class="qr__viewport">
      <ul class="qr__track" role="list">
        <?php foreach ($qr_channels as $i => $c): ?>
        <li class="qr__col <?= $i % 2 ? 'qr__col--even' : 'qr__col--odd' ?>" style="--dy:<?= (int) $c['dy'] ?>px">
          <a class="qr__fig" href="<?= $e($c['url']) ?>">
            <?= qr_svg($c['name'], $c['name']) ?>
            <span class="qr__name"><?= $e($c['name']) ?></span>
          </a>
          <p class="qr__desc"><?= $e($c['text']) ?></p>
        </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </div>
</section>
<div class="demo-spacer">↑ page continues</div>
