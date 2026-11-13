<?php
/**
 * HeySea — демо складних анімацій на запит дизайнерки (без адмінки).
 * Кожна секція = partials/NN-slug.php (+ assets/css/slug.css, assets/js/slug.js, якщо є).
 * Дані в partials — PHP-масиви, як потім прийдуть з ACF.
 * ?only=slug — показати одну секцію (для тестів).
 */
$parts = glob(__DIR__ . '/partials/*.php');
sort($parts);
$sections = [];
foreach ($parts as $file) {
    $slug = preg_replace('/^\d+-/', '', basename($file, '.php'));
    if (!empty($_GET['only']) && $_GET['only'] !== $slug) continue;
    $sections[] = ['slug' => $slug, 'file' => $file];
}
function asset_v($rel) { $p = __DIR__ . '/' . $rel; return file_exists($p) ? $rel . '?v=' . filemtime($p) : null; }
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HeySea — animation demos</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="<?= asset_v('assets/css/base.css') ?>">
<?php foreach ($sections as $s): if ($css = asset_v("assets/css/{$s['slug']}.css")): ?>
<link rel="stylesheet" href="<?= $css ?>">
<?php endif; endforeach; ?>
</head>
<body>
<nav class="demo-nav" aria-label="Demos">
  <strong>HeySea · demos</strong>
  <?php foreach ($sections as $s): ?><a href="#<?= $s['slug'] ?>"><?= $s['slug'] ?></a><?php endforeach; ?>
</nav>
<main>
<?php foreach ($sections as $s): ?>
<!-- ===== <?= $s['slug'] ?> ===== -->
<?php include $s['file']; ?>
<?php endforeach; ?>
<footer class="demo-end"><p>End of demos</p></footer>
</main>
<script src="vendor/gsap.min.js"></script>
<script src="vendor/ScrollTrigger.min.js"></script>
<script src="vendor/SplitText.min.js"></script>
<script src="vendor/MotionPathPlugin.min.js"></script>
<script src="vendor/Observer.min.js"></script>
<script src="vendor/lenis.min.js"></script>
<script src="vendor/d3-array.min.js"></script>
<script src="vendor/d3-geo.min.js"></script>
<script src="vendor/topojson-client.min.js"></script>
<script src="<?= asset_v('assets/js/base.js') ?>"></script>
<?php foreach ($sections as $s): if ($js = asset_v("assets/js/{$s['slug']}.js")): ?>
<script src="<?= $js ?>"></script>
<?php endif; endforeach; ?>
</body>
</html>
