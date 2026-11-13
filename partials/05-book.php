<?php
/**
 * Contacts — брошура на чистому CSS 3D (без відео): виїжджає над заголовком,
 * розвертається фронтально, відкривається обкладинка, перегортається сторінка.
 * Дані як з ACF: заголовок, CTA, моделі (по одному розвороту на модель).
 */
$book = [
    'eyebrow' => 'Brochures',
    'title'   => 'A closer look at every model, brought to life.',
    'cta'     => ['label' => 'Download brochure', 'href' => '#book', 'meta' => 'PDF · 12 MB'],
    'brand'   => 'HeySea',
    'edition' => 'Yacht Collection 2026',
    'models'  => [
        [
            'name'   => 'Asteria',
            'type'   => 'Explorer · 42 m',
            'specs'  => ['Length' => '42 m', 'Guests' => '12', 'Cabins' => '6', 'Range' => '4,500 nm'],
            'intro'  => 'Built for long passages and quiet anchorages, Asteria pairs an ocean-going hull with interiors that feel like a private residence.',
            'text'   => 'Full-beam owner’s suite, a beach club at the waterline and a flybridge lounge that opens to the horizon. Every surface is finished by hand in our Guangdong yard.',
            'cover'  => 'assets/img/photo-2.jpg',
            'photos' => ['assets/img/photo-1.jpg', 'assets/img/photo-3.jpg', 'assets/img/photo-4.jpg'],
        ],
        [
            'name'   => 'Solara',
            'type'   => 'Sport Fly · 28 m',
            'specs'  => ['Length' => '28 m', 'Guests' => '8', 'Cabins' => '4', 'Speed' => '32 kn'],
            'intro'  => 'Solara is the sun-seeker of the range: fast, light and wrapped in glass so the sea is always in view.',
            'text'   => 'A hydraulic swim platform, foredeck sun pads and an open-plan saloon make her the natural choice for Mediterranean summers.',
            'cover'  => 'assets/img/photo-5.jpg',
            'photos' => ['assets/img/photo-6.jpg', 'assets/img/photo-3.jpg', 'assets/img/photo-1.jpg'],
        ],
    ],
];
$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
[$m1, $m2] = $book['models'];

/** Ліва сторінка розвороту: великий кадр + назва */
$bookLeftPage = function (array $m) use ($e) { ?>
  <div class="pg pg--left">
    <p class="pg__kicker"><?= $e($m['type']) ?></p>
    <h3 class="pg__title"><?= $e($m['name']) ?></h3>
    <img class="pg__hero" src="<?= $e($m['cover']) ?>" alt="" loading="lazy" decoding="async">
    <p class="pg__folio"><?= $e($m['name']) ?> — HeySea</p>
  </div>
<?php };

/** Права сторінка: інтро, дві колонки, мініатюри, характеристики */
$bookRightPage = function (array $m) use ($e) { ?>
  <div class="pg pg--right">
    <p class="pg__lead"><?= $e($m['intro']) ?></p>
    <div class="pg__cols"><p><?= $e($m['text']) ?></p><p><?= $e($m['text']) ?></p></div>
    <div class="pg__thumbs">
      <?php foreach ($m['photos'] as $p): ?><img src="<?= $e($p) ?>" alt="" loading="lazy" decoding="async"><?php endforeach; ?>
    </div>
    <dl class="pg__specs">
      <?php foreach ($m['specs'] as $k => $v): ?><div><dt><?= $e($k) ?></dt><dd><?= $e($v) ?></dd></div><?php endforeach; ?>
    </dl>
  </div>
<?php };
?>
<section id="book" class="demo-sec book" aria-labelledby="book-title">
  <div class="book__stage">
    <span class="demo-label">05 · Book — pure CSS 3D, scroll-scrubbed</span>
    <header class="book__head container">
      <p class="book__eyebrow"><?= $e($book['eyebrow']) ?></p>
      <h2 class="book__title" id="book-title"><?= $e($book['title']) ?></h2>
    </header>

    <!-- Сцена: .book — це «права сторінка»; все інше позиціонується відносно неї в 3D -->
    <div class="book__scene" role="img" aria-label="<?= $e($book['brand'] . ' brochure: ' . $m1['name'] . ', ' . $m2['name']) ?>">
      <div class="book__obj">
        <div class="book__back"></div>
        <div class="book__lshadow"></div>
        <div class="book__spine"><span><?= $e($book['brand'] . ' · ' . $book['edition']) ?></span></div>
        <div class="book__edge book__edge--side"></div>
        <div class="book__edge book__edge--top"></div>

        <!-- Нижній шар: права сторінка 2-го розвороту (статична) -->
        <div class="book__leaf book__leaf--base">
          <div class="face face--front"><?php $bookRightPage($m2); ?></div>
        </div>

        <!-- Тіні від аркуша, що перегортається (на праву й ліву сторінки) -->
        <div class="book__cast book__cast--r"></div>
        <div class="book__cast book__cast--l"></div>

        <!-- Аркуш: лице = права сторінка розвороту 1, зворот = ліва сторінка розвороту 2 -->
        <div class="book__leaf book__leaf--page" data-depth="1">
          <div class="face face--front"><?php $bookRightPage($m1); ?></div>
          <div class="face face--back"><?php $bookLeftPage($m2); ?></div>
        </div>

        <!-- Обкладинка: лице = cover, зворот = ліва сторінка розвороту 1 -->
        <div class="book__leaf book__leaf--cover" data-depth="2">
          <div class="face face--front cover">
            <img class="cover__img" src="<?= $e($m1['cover']) ?>" alt="">
            <div class="cover__text">
              <p class="cover__brand"><?= $e($book['brand']) ?></p>
              <p class="cover__title"><?= $e($m1['name']) ?></p>
              <p class="cover__edition"><?= $e($book['edition']) ?></p>
            </div>
          </div>
          <div class="face face--back"><?php $bookLeftPage($m1); ?></div>
        </div>
      </div>
    </div>

    <a class="book__cta" href="<?= $e($book['cta']['href']) ?>">
      <span><?= $e($book['cta']['label']) ?></span><small><?= $e($book['cta']['meta']) ?></small>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v9m0 0 4-4m-4 4L4 7M3 14h10" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
    </a>
  </div>
</section>
<div class="demo-spacer">↓</div>
