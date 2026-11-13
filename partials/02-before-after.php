<?php
/**
 * Before/after deck plan comparison ("Sketch" ↔ "Layout") with tabs per deck.
 * The SAME geometry array is rendered twice (pencil sketch / coloured layout), so both layers align 1:1.
 * In production each deck would be either two uploaded images of identical size or (better) one SVG
 * from the naval architect drawn twice like here.
 *
 * Geometry: viewBox 0 0 1200 480, stern on the left, bow on the right.
 *   ['r', x, y, w, h, rx, kind, label?]       rect
 *   ['e', cx, cy, rx, ry, kind, label?]       ellipse
 *   ['p', d, kind, label?, lx?, ly?]          path (label at lx/ly)
 * kind → colour in layout mode (see $ba_colors); 'line' = stroke only.
 */
$ba_block = [
    'eyebrow' => 'Interior layout',
    'title'   => 'Designed for Longer Journeys,',
    'title_b' => 'the Seaview 60 Enters European Waters',
    'text'    => 'Drag the divider to compare the designer’s first sketch with the final general arrangement.',
    'left'    => 'Sketch',
    'right'   => 'Layout',
];

$ba_decks = [
    ['id' => 'sun', 'name' => 'Sun Deck', 'shapes' => [
        ['r', 110, 130, 250, 220, 6, 'wood', 'Sun pads'],
        ['r', 130, 160, 95, 170, 14, 'sofa'], ['r', 245, 160, 95, 170, 14, 'sofa'],
        ['e', 470, 240, 64, 64, 'water', 'Jacuzzi'], ['e', 470, 240, 46, 46, 'water'],
        ['r', 570, 135, 160, 56, 28, 'dark', 'Bar'],
        ['e', 592, 214, 11, 11, 'cream'], ['e', 628, 214, 11, 11, 'cream'], ['e', 664, 214, 11, 11, 'cream'], ['e', 700, 214, 11, 11, 'cream'],
        ['r', 560, 250, 180, 100, 44, 'sofa', 'Dining'], ['r', 590, 272, 120, 56, 28, 'wood'],
        ['r', 780, 150, 160, 180, 24, 'interior', 'Helm'],
        ['r', 900, 196, 26, 88, 10, 'dark'], ['e', 860, 215, 15, 15, 'sofa'], ['e', 860, 265, 15, 15, 'sofa'],
        ['p', 'M965,195 L1045,222 L1045,258 L965,285 Z', 'sofa', 'Fore lounge', 960, 318],
    ]],
    ['id' => 'upper', 'name' => 'Upper Deck', 'shapes' => [
        ['r', 110, 130, 220, 220, 6, 'wood', 'Aft deck'],
        ['p', 'M140,165 h160 v22 h-138 v106 h138 v22 h-160 z', 'sofa'], ['r', 180, 200, 110, 80, 36, 'cream'],
        ['r', 338, 130, 10, 220, 2, 'dark'],
        ['r', 360, 130, 320, 220, 10, 'interior', 'Sky lounge'],
        ['p', 'M390,165 h150 v30 h-120 v120 h-30 z', 'sofa'], ['r', 455, 220, 80, 60, 8, 'wood'], ['r', 664, 190, 8, 100, 2, 'dark'],
        ['r', 700, 130, 120, 100, 6, 'cream', 'Galley'], ['r', 710, 192, 100, 26, 4, 'dark'],
        ['r', 700, 250, 120, 100, 6, 'cream', 'Stairs'],
        ['p', 'M715,290 h90 M715,305 h90 M715,320 h90 M715,335 h90', 'line'],
        ['r', 840, 150, 170, 180, 30, 'interior', 'Wheelhouse'],
        ['r', 955, 190, 30, 100, 15, 'dark'], ['e', 905, 215, 16, 16, 'sofa'], ['e', 905, 265, 16, 16, 'sofa'],
    ]],
    ['id' => 'main', 'name' => 'Main Deck', 'shapes' => [
        ['r', 110, 130, 170, 220, 6, 'wood', 'Cockpit'],
        ['r', 122, 165, 30, 175, 12, 'sofa'], ['r', 175, 200, 70, 80, 10, 'cream'],
        ['r', 300, 130, 300, 220, 8, 'interior', 'Saloon'],
        ['p', 'M320,165 h120 v30 h-90 v135 h-30 z', 'sofa'], ['r', 470, 300, 110, 30, 12, 'sofa'], ['e', 430, 250, 40, 40, 'wood'],
        ['r', 620, 130, 150, 220, 8, 'cream', 'Dining'],
        ['r', 655, 175, 80, 140, 40, 'wood'],
        ['e', 641, 200, 9, 9, 'sofa'], ['e', 641, 245, 9, 9, 'sofa'], ['e', 641, 290, 9, 9, 'sofa'],
        ['e', 749, 200, 9, 9, 'sofa'], ['e', 749, 245, 9, 9, 'sofa'], ['e', 749, 290, 9, 9, 'sofa'],
        ['r', 790, 130, 200, 220, 10, 'interior', 'Master suite'],
        ['r', 815, 180, 110, 125, 8, 'bed'], ['r', 900, 190, 18, 45, 6, 'cream'], ['r', 900, 250, 18, 45, 6, 'cream'], ['r', 960, 150, 20, 180, 4, 'wood'],
        ['p', 'M1005,185 L1085,222 L1085,258 L1005,295 Z', 'wood', 'Bow', 1010, 322],
    ]],
    ['id' => 'lower', 'name' => 'Lower Deck', 'shapes' => [
        ['r', 110, 130, 200, 220, 6, 'dark', 'Engine room'],
        ['r', 140, 165, 140, 50, 10, 'interior'], ['r', 140, 275, 140, 50, 10, 'interior'],
        ['r', 330, 130, 150, 220, 6, 'cream', 'Crew'],
        ['r', 345, 160, 120, 50, 6, 'bed'], ['r', 345, 285, 120, 50, 6, 'bed'],
        ['r', 500, 130, 180, 95, 6, 'interior', 'Guest'], ['r', 520, 155, 100, 58, 8, 'bed'],
        ['r', 500, 255, 180, 95, 6, 'interior', 'Guest'], ['r', 520, 280, 100, 58, 8, 'bed'],
        ['r', 700, 130, 200, 220, 8, 'interior', 'VIP cabin'],
        ['r', 730, 180, 110, 125, 8, 'bed'], ['r', 858, 150, 30, 90, 4, 'water'],
        ['p', 'M925,172 L1065,226 L1065,254 L925,308 Z', 'cream', 'Storage', 935, 335],
    ]],
];

$ba_colors = [
    'wood' => '#cfae84', 'sofa' => '#b9c8d8', 'cream' => '#efe7d8', 'water' => '#7fc0d8',
    'dark' => '#34485c', 'interior' => '#e7eef4', 'bed' => '#fbf8f2', 'line' => 'none',
];

$e = static fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

// Hull + bulwark outline shared by every deck (top view)
const BA_HULL = 'M70,100 L720,84 C930,86 1080,160 1150,240 C1080,320 930,394 720,396 L70,380 C58,300 58,180 70,100 Z';
const BA_DECK = 'M88,116 L720,100 C920,102 1058,170 1122,240 C1058,310 920,378 720,380 L88,364 C78,290 78,190 88,116 Z';

/** Render one shape list as SVG markup; $mode = 'sketch' | 'layout'. Same coordinates either way. */
function ba_shapes(array $shapes, string $mode, array $colors, callable $e): string {
    $out = '';
    $labels = '';
    foreach ($shapes as $s) {
        $kind = $s[0] === 'r' ? $s[6] : ($s[0] === 'e' ? $s[5] : $s[2]);
        if ($mode === 'layout') {
            $fill = $colors[$kind] ?? 'none';
            $stroke = $kind === 'line' ? '#8a97a5' : 'rgba(11,42,74,.28)';
            $attr = 'fill="' . $fill . '" stroke="' . $stroke . '" stroke-width="1.2"';
        } else {
            // pencil: no fill, except hatching for wood/dark areas
            $fill = in_array($kind, ['wood', 'dark'], true) ? 'url(#ba-hatch)' : 'none';
            $attr = 'fill="' . $fill . '"';
        }
        $label = null;
        switch ($s[0]) {
            case 'r':
                [, $x, $y, $w, $h, $rx] = $s;
                $out .= "<rect x=\"$x\" y=\"$y\" width=\"$w\" height=\"$h\" rx=\"$rx\" $attr/>";
                if (!empty($s[7])) $label = [$s[7], $x + 10, $y + 22, 'start', $kind];
                break;
            case 'e':
                [, $cx, $cy, $rx, $ry] = $s;
                $out .= "<ellipse cx=\"$cx\" cy=\"$cy\" rx=\"$rx\" ry=\"$ry\" $attr/>";
                if (!empty($s[6])) $label = [$s[6], $cx, $cy + $ry + 18, 'middle', 'light'];
                break;
            case 'p':
                $out .= '<path d="' . $e($s[1]) . "\" $attr/>";
                if (!empty($s[3])) $label = [$s[3], $s[4], $s[5], 'start', 'light'];
                break;
        }
        if ($label) {
            $labels .= '<text x="' . $label[1] . '" y="' . $label[2] . '" text-anchor="' . $label[3] . '"' . ($label[4] === 'dark' ? ' class="on-dark"' : '') . '>' . $e($label[0]) . '</text>';
        }
    }
    return '<g class="ba__shapes">' . $out . '</g><g class="ba__labels">' . $labels . '</g>';
}

function ba_plan(array $deck, string $mode, array $colors, callable $e): string {
    $shapes = ba_shapes($deck['shapes'], $mode, $colors, $e);
    $hull = '<path class="ba__hull" d="' . BA_HULL . '"/><path class="ba__deckline" d="' . BA_DECK . '"/>';
    $extra = $mode === 'sketch'
        // construction lines exist only on the sketch (they don't affect alignment)
        ? '<path class="ba__construct" d="M40,240 H1180 M720,60 V420 M70,60 V420"/>'
        : '';
    $bg = '<rect class="ba__bg" x="-600" y="-600" width="2400" height="1680"/>';
    $body = $mode === 'sketch'
        ? "<g filter=\"url(#ba-pencil)\">$hull$shapes</g><g class=\"ba__ghost\" filter=\"url(#ba-pencil-2)\">$hull" . ba_shapes($deck['shapes'], 'sketch', $colors, $e) . '</g>'
        : $hull . $shapes;
    return '<svg class="ba__svg ba__svg--' . $mode . '" viewBox="20 50 1170 380" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'
        . $e($deck['name'] . ' — ' . $mode) . '"><g class="ba__rot">' . $bg . $extra . $body . '</g></svg>';
}
?>
<section id="before-after" class="demo-sec ba" aria-labelledby="ba-title">
  <span class="demo-label">02 · Before / after deck plan</span>

  <!-- Shared SVG defs: pencil filters + hatching (referenced by every sketch layer) -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
      <filter id="ba-pencil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="ba-pencil-2" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="1" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="G" yChannelSelector="R"/>
      </filter>
      <pattern id="ba-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#6b665c" stroke-width="0.8" opacity=".55"/>
      </pattern>
    </defs>
  </svg>

  <div class="container ba__inner">
    <header class="ba__head">
      <p class="ba__eyebrow"><?= $e($ba_block['eyebrow']) ?></p>
      <h2 class="ba__title" id="ba-title"><?= $e($ba_block['title']) ?><br><strong><?= $e($ba_block['title_b']) ?></strong></h2>
      <p class="ba__lead"><?= $e($ba_block['text']) ?></p>
    </header>

    <div class="ba__tabs" role="tablist" aria-label="Decks">
      <?php foreach ($ba_decks as $i => $d): ?>
      <button class="ba__tab<?= $i === 0 ? ' is-active' : '' ?>" role="tab" id="ba-tab-<?= $e($d['id']) ?>"
              aria-selected="<?= $i === 0 ? 'true' : 'false' ?>" aria-controls="ba-deck-<?= $e($d['id']) ?>"
              tabindex="<?= $i === 0 ? '0' : '-1' ?>"><?= $e($d['name']) ?></button>
      <?php endforeach; ?>
    </div>

    <div class="ba__compare" style="--pos:50%">
      <?php foreach ($ba_decks as $i => $d): ?>
      <div class="ba__deck<?= $i === 0 ? ' is-active' : '' ?>" id="ba-deck-<?= $e($d['id']) ?>" role="tabpanel"
           aria-labelledby="ba-tab-<?= $e($d['id']) ?>"<?= $i === 0 ? '' : ' hidden' ?>>
        <div class="ba__layer ba__layer--sketch"><?= ba_plan($d, 'sketch', $ba_colors, $e) ?></div>
        <div class="ba__layer ba__layer--layout"><?= ba_plan($d, 'layout', $ba_colors, $e) ?></div>
      </div>
      <?php endforeach; ?>

      <span class="ba__chip ba__chip--left" aria-hidden="true"><?= $e($ba_block['left']) ?></span>
      <span class="ba__chip ba__chip--right" aria-hidden="true"><?= $e($ba_block['right']) ?></span>

      <div class="ba__handle" role="slider" tabindex="0"
           aria-label="<?= $e($ba_block['left'] . ' / ' . $ba_block['right'] . ' comparison') ?>"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50% sketch">
        <span class="ba__knob" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>
    </div>
  </div>
</section>
<div class="demo-spacer">↓ next</div>
