<?php
/**
 * Contacts — світова мапа офісів (SVG d3.geoEqualEarth) з автоперемиканням локацій (Figma «Map»).
 * Таймер = пагінація (активний сегмент довгий і заповнюється), стрілки, пін на мапі й картка — синхронні.
 * Дані як з ACF.
 */
$hsmap = [
    'eyebrow'  => 'Global Network',
    'title'    => ['Connect with HeySea and ', 'discover more', ' about the company, its yachts and services.'], // [до, акцент (italic serif), після]
    'interval' => 6,   // сек; у продакшені 30–120 (поле ACF)
    'contact'  => ['label' => 'Contact us', 'href' => '#contact'],
    'offices'  => [
        [
            'label' => 'Guangdong Province, China',   // підпис піна й назва в навігації
            'kicker' => 'HeySea Asia', 'city' => 'Guangdong Province, China',
            'lat' => 23.10, 'lng' => 113.30, 'zoom' => 1.3,
            'address' => '1610, Level 16, Landmark North, 39 Lung Sum Avenue, Sheung Shui, N.T. HK',
            'email' => 'info@heysea.com',
        ],
        [
            'label' => 'Howard Street, Malta',
            'kicker' => 'HeySea Europe', 'city' => 'Malta',
            'lat' => 35.90, 'lng' => 14.50, 'zoom' => 1.35,
            'address' => '11/158 Howard Street, Malta',
            'email' => 'sales@heyseayachts.eu',
        ],
        [
            'label' => 'Federal Highway, Boca Raton',
            'kicker' => 'HeySea America', 'city' => 'Boca Raton, USA',
            'lat' => 26.36, 'lng' => -80.08, 'zoom' => 1.3,
            'address' => '1200N Federal Hwy Suite 300 Boca Raton FL33432 USA',
            'email' => 'chris@heysea.com',
        ],
    ],
];
$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$hsmapJson = array_map(fn($o) => ['label' => $o['label'], 'lat' => $o['lat'], 'lng' => $o['lng'], 'zoom' => $o['zoom']], $hsmap['offices']);
$hsmapIcon = [
    'pin'  => '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.5s4.5-4.2 4.5-7.7A4.5 4.5 0 0 0 3.5 6.8c0 3.5 4.5 7.7 4.5 7.7Z"/><circle cx="8" cy="6.8" r="1.6"/></svg>',
    'mail' => '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
    'chev' => '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>',
];
?>
<section id="map" class="demo-sec hsmap" aria-labelledby="map-title" data-interval="<?= (int)$hsmap['interval'] ?>">
  <span class="demo-label">08 · Map — SVG pan/zoom + autoplay timer</span>
  <script type="application/json" class="hsmap__data"><?= json_encode($hsmapJson, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?></script>

  <div class="hsmap__top container">
    <div>
      <p class="hsmap__eyebrow"><?= $e($hsmap['eyebrow']) ?></p>
      <h2 class="hsmap__title" id="map-title"><?= $e($hsmap['title'][0]) ?><em><?= $e($hsmap['title'][1]) ?></em><?= $e($hsmap['title'][2]) ?></h2>
    </div>

    <div class="hsmap__nav" role="group" aria-label="Office locations">
      <div class="hsmap__now">
        <span class="hsmap__name" aria-live="polite"><?= $e($hsmap['offices'][0]['label']) ?></span>
        <!-- Пагінація = таймер: активний сегмент розтягується (довгий) і заповнюється, інші — короткі -->
        <div class="hsmap__steps">
          <?php foreach ($hsmap['offices'] as $i => $o): ?>
          <button type="button" class="hsmap__step<?= $i === 0 ? ' is-active' : '' ?>" data-i="<?= $i ?>" aria-label="Show <?= $e($o['label']) ?> (<?= $i + 1 ?> of <?= count($hsmap['offices']) ?>)"<?= $i === 0 ? ' aria-current="true"' : '' ?>><i></i></button>
          <?php endforeach; ?>
        </div>
        <span class="hsmap__status" aria-hidden="true"></span>
      </div>
      <button type="button" class="hsmap__btn hsmap__btn--prev" aria-label="Previous office">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>
      </button>
      <button type="button" class="hsmap__btn hsmap__btn--next" aria-label="Next office">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>
      </button>
      <button type="button" class="hsmap__btn hsmap__btn--play" aria-label="Pause autoplay" aria-pressed="false">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path class="i-pause" d="M6 4.5v7M10 4.5v7"/><path class="i-play" d="M5.5 3.5v9l7-4.5z"/></svg>
      </button>
    </div>
  </div>

  <div class="hsmap__map">
    <svg class="hsmap__svg" aria-hidden="true" preserveAspectRatio="none">
      <path class="hsmap__land"/><path class="hsmap__borders"/>
    </svg>
    <div class="hsmap__pins">
      <?php foreach ($hsmap['offices'] as $i => $o): ?>
      <button type="button" class="hsmap__pin" data-i="<?= $i ?>" aria-label="Show <?= $e($o['label']) ?> office" tabindex="-1">
        <i class="hsmap__pin-dot"></i><span class="hsmap__pin-label"><?= $e($o['label']) ?></span>
      </button>
      <?php endforeach; ?>
    </div>
  </div>

  <div class="hsmap__cards container">
    <?php foreach ($hsmap['offices'] as $i => $o): $on = $i === 0; ?>
    <article class="hsmap__card<?= $on ? ' is-active' : '' ?>" data-i="<?= $i ?>">
      <p class="hsmap__card-kicker"><?= $e($o['kicker']) ?></p>
      <h3 class="hsmap__card-city">
        <button type="button" class="hsmap__card-btn" aria-pressed="<?= $on ? 'true' : 'false' ?>"><?= $e($o['city']) ?></button>
      </h3>
      <ul class="hsmap__card-info">
        <li><?= $hsmapIcon['pin'] ?><span><span class="hsmap-vh">Address: </span><?= $e($o['address']) ?></span></li>
        <li><?= $hsmapIcon['mail'] ?><a href="mailto:<?= $e($o['email']) ?>"><?= $e($o['email']) ?></a></li>
      </ul>
      <!-- «Contact us» — лише в активній картці (розкривається, картка «підростає» вгору) -->
      <div class="hsmap__card-cta"><div><a href="<?= $e($hsmap['contact']['href']) ?>"<?= $on ? '' : ' tabindex="-1"' ?>><?= $e($hsmap['contact']['label']) ?><?= $hsmapIcon['chev'] ?></a></div></div>
    </article>
    <?php endforeach; ?>
  </div>
</section>
