<?php
/**
 * Brand Story — "timeline compass".
 * Data shape mirrors future ACF fields: heading + repeater [year, text].
 * Behaviour lives in assets/js/timeline.js (dial rotation, digit roll, auto-advance timer).
 */
$tl = [
    'eyebrow'    => 'Our story',
    'heading'    => 'From new deliveries to',
    'heading_em' => 'international boat shows', // italic serif accent (Figma "Intro · Our yachts" style)
    'start'      => 2008,  // first year; in pinned scroll mode the top of the pin = first year, so keep it in sync
    'autoplay'  => 8000,   // ms per year; 0 = off (production: 30000–120000)
    'skip_text' => 'Skip Timeline',
    'items'     => [
        ['year' => 2008, 'text' => 'Heysea is founded in Guangdong by a small team of naval engineers with a single 20-metre mould and a big idea: build yachts the way shipyards build ships.'],
        ['year' => 2009, 'text' => 'The first hull leaves the shed. The Heysea 62 is delivered to a private owner in Hong Kong and becomes the yard\'s calling card in the region.'],
        ['year' => 2010, 'text' => 'A new 18,000 m² facility opens, adding an in-house carpentry workshop so every interior is built under the same roof as the hull.'],
        ['year' => 2011, 'text' => 'Heysea signs its first dealer agreement in Australia and debuts at the Sanctuary Cove International Boat Show.'],
        ['year' => 2012, 'text' => 'The Asteria line is launched — semi-displacement hulls tuned for long passages with low fuel burn.'],
        ['year' => 2013, 'text' => 'Heysea achieves CE certification across its range, opening the door to European owners and charter fleets.'],
        ['year' => 2014, 'text' => 'The 27-metre Asteria 88 is delivered, the largest composite yacht built by the yard at the time.'],
        ['year' => 2015, 'text' => 'Infusion moulding becomes standard on every hull, cutting weight by up to 12% while improving structural consistency.'],
        ['year' => 2016, 'text' => 'Heysea debuts at the Fort Lauderdale International Boat Show and appoints its first North American representative.'],
        ['year' => 2017, 'text' => 'A dedicated R&D centre opens, pairing CFD hull analysis with full-scale tank testing in partnership with a local university.'],
        ['year' => 2018, 'text' => 'The 100th Heysea yacht is delivered. Owners from 14 countries join the celebration in Zhongshan.'],
        ['year' => 2019, 'text' => 'Heysea unveils its first steel-and-aluminium superyacht project, a 43-metre tri-deck built to class.'],
        ['year' => 2020, 'text' => 'Remote commissioning and virtual sea trials keep deliveries on schedule while borders are closed.'],
        ['year' => 2021, 'text' => 'The Vista series launches with hybrid propulsion options and a redesigned, light-flooded main deck.'],
        ['year' => 2022, 'text' => 'Heysea returns to Cannes Yachting Festival with three yachts in the water and a sold-out order book for the season.'],
        ['year' => 2023, 'text' => 'The first New Energy catamaran prototype completes 1,200 nm of open-water testing on solar and battery power alone.'],
        ['year' => 2024, 'text' => 'Heysea enters the explorer-yacht segment, signing its first European contract for a 35-metre Explorer — delivery set for 2028. The Seaview 60, Heysea\'s New Energy catamaran, crosses to Europe for its official debut at the International Multihull Show.'],
        ['year' => 2025, 'text' => 'A second yard opens on the Pearl River estuary, doubling capacity for 30–50 metre custom builds.'],
    ],
];
$tl_years = array_column($tl['items'], 'year');
$tl_start = array_search($tl['start'], $tl_years, true);
if ($tl_start === false) $tl_start = 0;
$tl_total = count($tl['items']);
$e = static fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
?>
<section id="timeline" class="demo-sec tl" data-autoplay="<?= (int) $tl['autoplay'] ?>" data-start="<?= (int) $tl_start ?>" aria-roledescription="timeline" aria-label="Brand history">
  <span class="demo-label">03 · Timeline compass</span>

  <div class="tl-stage">
    <!-- Dial: static ring + rotating ticks/years. Center sits behind the text column (as in the design). -->
    <div class="tl-dial" tabindex="0" role="slider"
         aria-label="Year" aria-valuemin="<?= $e($tl_years[0]) ?>" aria-valuemax="<?= $e(end($tl_years)) ?>"
         aria-valuenow="<?= $e($tl_years[$tl_start]) ?>" aria-valuetext="<?= $e($tl_years[$tl_start]) ?>">
      <svg class="tl-ring" viewBox="-500 -500 1000 1000" aria-hidden="true" focusable="false">
        <defs>
          <!-- Static fade: the ring dissolves to the left so it reads as a partial arc behind the text. -->
          <linearGradient id="tlFade" gradientUnits="userSpaceOnUse" x1="-500" y1="0" x2="500" y2="0">
            <stop offset="0" stop-color="#fff" stop-opacity="0"/>
            <stop offset=".45" stop-color="#fff" stop-opacity=".35"/>
            <stop offset=".8" stop-color="#fff" stop-opacity="1"/>
          </linearGradient>
          <mask id="tlMask" maskUnits="userSpaceOnUse" x="-500" y="-500" width="1000" height="1000">
            <rect x="-500" y="-500" width="1000" height="1000" fill="url(#tlFade)"/>
          </mask>
        </defs>
        <g mask="url(#tlMask)">
          <circle class="tl-ring__band" r="390" />
          <circle class="tl-ring__edge" r="355" />
          <circle class="tl-ring__edge" r="425" />
          <g class="tl-ring__ticks"><!-- filled by JS (keeps markup light) --></g>
        </g>
        <!-- Pointer: dot + shaft + arrow head, fixed at 3 o'clock -->
        <g class="tl-pointer">
          <circle r="9" cx="250" class="tl-pointer__dot"/>
          <circle r="3.5" cx="250" class="tl-pointer__core"/>
          <line x1="268" y1="0" x2="420" y2="0" class="tl-pointer__shaft"/>
          <path d="M404 -9 L424 0 L404 9" class="tl-pointer__head"/>
        </g>
      </svg>

      <ol class="tl-years" aria-hidden="true">
        <?php foreach ($tl['items'] as $i => $it): ?>
          <li><button type="button" class="tl-year" data-index="<?= $i ?>" tabindex="-1"><?= $e($it['year']) ?></button></li>
        <?php endforeach; ?>
      </ol>

      <!-- Big current year; on change it trades places with the ring label (shared-element flight, see JS) -->
      <div class="tl-big" aria-hidden="true"><span class="tl-big__txt"><?= $e($tl_years[$tl_start]) ?></span></div>
    </div>

    <div class="container tl-grid">
      <div class="tl-copy">
        <p class="tl-eyebrow"><?= $e($tl['eyebrow']) ?></p>
        <h2 class="tl-heading"><?= $e($tl['heading']) ?> <em><?= $e($tl['heading_em']) ?></em></h2>

        <div class="tl-texts" aria-live="polite">
          <?php foreach ($tl['items'] as $i => $it): ?>
            <div class="tl-text<?= $i === $tl_start ? ' is-active' : '' ?>" data-index="<?= $i ?>"<?= $i === $tl_start ? '' : ' aria-hidden="true"' ?>>
              <span class="visually-hidden"><?= $e($it['year']) ?>: </span><p><?= $e($it['text']) ?></p>
            </div>
          <?php endforeach; ?>
        </div>

        <div class="tl-controls">
          <div class="tl-counter" aria-hidden="true">
            <span class="tl-counter__num"><span class="tl-counter__cur"><?= $tl_start + 1 ?></span><span class="tl-counter__tot">/<?= $tl_total ?></span></span>
            <span class="tl-progress"><span class="tl-progress__bar"></span></span>
          </div>
          <div class="tl-arrows">
            <button type="button" class="tl-btn tl-prev" aria-label="Previous year">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"/></svg>
            </button>
            <button type="button" class="tl-btn tl-next" aria-label="Next year">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <a class="tl-skip" href="#timeline-after"><?= $e($tl['skip_text']) ?> <span aria-hidden="true">›</span></a>
  </div>
</section>
<div id="timeline-after" class="demo-spacer" tabindex="-1">↓ after timeline</div>
