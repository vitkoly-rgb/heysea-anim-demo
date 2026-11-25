<?php
/**
 * Contacts / Brochure Request — брошура на чистому CSS 3D (без відео), за підписаним Figma
 * («08 Contacts / Brochure Request», Brochure animation 01–16 desktop, 01–10 mobile):
 * text-fill заголовка (pin) → брошура піднімається до тексту → обкладинка відкривається, брошура росте →
 * 8 розворотів (перегортання з curl) → брошура закривається → лишається закритою, сторінка скролиться далі.
 *
 * ДАНІ = те, що редагуватиме адмін (ACF): обкладинка + список розворотів, кожен — ліва/права сторінка
 * з типом макета і полями. Типи сторінок: logo, title, image, image-text, bleed (половина фото на весь розворот,
 * опційно panel / callouts), plan, spec.
 */
$book = [
    'eyebrow' => 'Explore the collection',
    'title'   => ['A closer look at every model, ', 'brought to life.'],   // [текст, акцент italic serif]
    'cta'     => ['label' => 'Download brochure', 'href' => '#brochure-form', 'meta' => 'PDF · 12 MB'],
    'cover'   => ['model' => 'Asteria', 'size' => '142', 'image' => 'assets/img/our-yachts/raw-4.jpg'],
    'spreads' => [
        ['name' => 'Intro',
            'left'  => ['type' => 'logo'],
            'right' => ['type' => 'title', 'title' => 'Asteria 142', 'text' => 'Explorer yacht · 43 m · 2026']],
        ['name' => 'Design',
            'left'  => ['type' => 'image', 'image' => 'assets/img/our-yachts/raw-1.jpg'],
            'right' => ['type' => 'image-text', 'image' => 'assets/img/our-yachts/raw-13.jpg',
                        'title' => 'Effortless balance', 'text' => 'Long, low lines and a plumb bow give Asteria a quiet confidence on any sea.']],
        ['name' => 'Exterior',
            'left'  => ['type' => 'image', 'image' => 'assets/img/our-yachts/raw-7.jpg'],
            'right' => ['type' => 'image', 'image' => 'assets/img/our-yachts/raw-8.jpg']],
        ['name' => 'Profile',
            'left'  => ['type' => 'bleed', 'side' => 'l', 'image' => 'assets/img/our-yachts/raw-16.jpg',
                        'callouts' => [['Flybridge', 46, 26], ['Sky lounge', 74, 44]]],
            'right' => ['type' => 'bleed', 'side' => 'r', 'image' => 'assets/img/our-yachts/raw-16.jpg',
                        'panel' => ['side' => 'right', 'title' => 'Profile', 'text' => 'Four decks, a full-beam owner’s suite and a beach club at the waterline.']]],
        ['name' => 'Salon',
            'left'  => ['type' => 'bleed', 'side' => 'l', 'image' => 'assets/img/our-yachts/raw-9.jpg',
                        'panel' => ['side' => 'left', 'title' => 'Main salon', 'text' => 'Floor-to-ceiling glass, oak and linen.']],
            'right' => ['type' => 'bleed', 'side' => 'r', 'image' => 'assets/img/our-yachts/raw-9.jpg']],
        ['name' => 'Owner cabin',
            'left'  => ['type' => 'bleed', 'side' => 'l', 'image' => 'assets/img/our-yachts/raw-5.jpg',
                        'panel' => ['side' => 'left', 'title' => 'Owner cabin', 'text' => 'A private deck forward with panoramic views.']],
            'right' => ['type' => 'bleed', 'side' => 'r', 'image' => 'assets/img/our-yachts/raw-5.jpg']],
        ['name' => 'Deck plans',
            'left'  => ['type' => 'plan', 'title' => 'Main deck'],
            'right' => ['type' => 'plan', 'title' => 'Upper deck']],
        ['name' => 'Specification',
            'left'  => ['type' => 'image', 'image' => 'assets/img/our-yachts/raw-2.jpg'],
            'right' => ['type' => 'spec', 'title' => 'Specification',
                        'rows' => ['Length overall' => '43.2 m', 'Beam' => '8.6 m', 'Guests' => '12', 'Cabins' => '6',
                                   'Crew' => '9', 'Range' => '4,500 nm', 'Max speed' => '17 kn', 'Hull' => 'Steel / aluminium']]],
    ],
];
$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

/** Рендер однієї сторінки за типом макета */
$bookPage = function (array $p) use ($e) {
    $img = fn($src, $cls = 'pg__img') => '<img class="' . $cls . '" src="' . $e($src) . '" alt="" loading="lazy" decoding="async">';
    switch ($p['type']) {
        case 'logo': ?>
            <div class="pg pg--logo"><svg class="pg__wave" viewBox="0 0 200 40" aria-hidden="true"><path d="M2 26c30-14 52-14 78-2s52 10 70-4 30-10 48-6"/><path d="M14 32c28-10 50-9 72 0s46 8 64-2 28-8 40-6"/></svg></div>
            <?php break;
        case 'title': ?>
            <div class="pg pg--title"><p class="pg__big"><?= $e($p['title']) ?></p><p class="pg__small"><?= $e($p['text']) ?></p></div>
            <?php break;
        case 'image': ?>
            <div class="pg pg--image"><?= $img($p['image']) ?></div>
            <?php break;
        case 'image-text': ?>
            <div class="pg pg--image pg--overlay"><?= $img($p['image']) ?><div class="pg__over"><p class="pg__h"><?= $e($p['title']) ?></p><p><?= $e($p['text']) ?></p></div></div>
            <?php break;
        case 'bleed': // половина фото, що йде через увесь розворот
            $pan = $p['panel'] ?? null; ?>
            <div class="pg pg--bleed pg--bleed-<?= $e($p['side']) ?>"><?= $img($p['image'], 'pg__img pg__img--wide') ?>
              <?php foreach ($p['callouts'] ?? [] as [$t, $x, $y]): ?><span class="pg__callout" style="left:<?= (float)$x ?>%;top:<?= (float)$y ?>%"><?= $e($t) ?></span><?php endforeach; ?>
              <?php if ($pan): ?><div class="pg__panel pg__panel--<?= $e($pan['side']) ?>"><p class="pg__h"><?= $e($pan['title']) ?></p><p><?= $e($pan['text']) ?></p></div><?php endif; ?>
            </div>
            <?php break;
        case 'plan': ?>
            <div class="pg pg--plan"><p class="pg__h"><?= $e($p['title']) ?></p>
              <svg viewBox="0 0 300 90" aria-hidden="true"><path class="hull" d="M8 45 C 40 12, 210 10, 292 30 L 292 60 C 210 80, 40 78, 8 45 Z"/>
                <path d="M70 22v46M120 18v54M170 17v56M220 20v50M250 25v40"/><rect x="128" y="34" width="34" height="22" rx="2"/><circle cx="96" cy="45" r="8"/></svg></div>
            <?php break;
        case 'spec': ?>
            <div class="pg pg--spec"><p class="pg__h"><?= $e($p['title']) ?></p>
              <dl><?php foreach ($p['rows'] as $k => $v): ?><div><dt><?= $e($k) ?></dt><dd><?= $e($v) ?></dd></div><?php endforeach; ?></dl></div>
            <?php break;
    }
};
$sp = $book['spreads'];
$n  = count($sp);
?>
<section id="book" class="demo-sec book" aria-labelledby="book-title">
  <div class="book__stage">
    <span class="demo-label">05 · Book — pure CSS 3D, 8 spreads, scroll-scrubbed</span>
    <header class="book__head container">
      <p class="book__eyebrow"><?= $e($book['eyebrow']) ?></p>
      <h2 class="book__title" id="book-title"><?= $e($book['title'][0]) ?><em><?= $e($book['title'][1]) ?></em></h2>
    </header>

    <!-- Сцена: .book__obj — це «права сторінка»; все інше позиціонується відносно неї в 3D -->
    <div class="book__scene" role="img" aria-label="<?= $e($book['cover']['model'] . ' ' . $book['cover']['size'] . ' brochure: ' . implode(', ', array_column($sp, 'name'))) ?>">
      <div class="book__obj">
        <div class="book__back"></div>
        <div class="book__lshadow"></div>
        <div class="book__spine"><span><?= $e('HeySea · ' . $book['cover']['model'] . ' ' . $book['cover']['size']) ?></span></div>
        <div class="book__edge book__edge--side"></div>
        <div class="book__edge book__edge--top"></div>

        <!-- Нижній шар: права сторінка останнього розвороту -->
        <div class="book__leaf book__leaf--base"><div class="face face--front"><?php $bookPage($sp[$n - 1]['right']); ?></div></div>

        <div class="book__cast book__cast--r"></div>
        <div class="book__cast book__cast--l"></div>

        <?php // Аркуші знизу вгору: аркуш i (1..n-1): лице = права сторінка розвороту i, зворот = ліва сторінка розвороту i+1
        for ($i = $n - 1; $i >= 1; $i--): ?>
        <div class="book__leaf book__leaf--turn" data-leaf="<?= $i ?>" data-depth="<?= $n - $i ?>">
          <div class="face face--front"><?php $bookPage($sp[$i - 1]['right']); ?></div>
          <div class="face face--back"><?php $bookPage($sp[$i]['left']); ?></div>
        </div>
        <?php endfor; ?>

        <!-- Обкладинка: лице = cover, зворот = ліва сторінка першого розвороту -->
        <div class="book__leaf book__leaf--turn book__leaf--cover" data-leaf="0" data-depth="<?= $n ?>">
          <div class="face face--front cover">
            <img class="cover__img" src="<?= $e($book['cover']['image']) ?>" alt="">
            <p class="cover__title"><?= $e($book['cover']['model']) ?> <span><?= $e($book['cover']['size']) ?></span></p>
          </div>
          <div class="face face--back"><?php $bookPage($sp[0]['left']); ?></div>
        </div>
      </div>
    </div>

    <a class="book__cta" href="<?= $e($book['cta']['href']) ?>">
      <span><?= $e($book['cta']['label']) ?></span><small><?= $e($book['cta']['meta']) ?></small>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v9m0 0 4-4m-4 4L4 7M3 14h10" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
    </a>
  </div>
</section>
<div class="demo-spacer">↓ brochure request form</div>
