<?php
/**
 * Ownership — "the journey continues" wave steps.
 * Pinned + scrubbed: the wave stroke draws left→right,
 * stage nodes activate exactly when the drawn stroke reaches them, caption crossfades. Mobile = vertical wave.
 * Geometry is generated in assets/js/wave-steps.js (depends on orientation).
 */
$ws = [
    'eyebrow'  => 'Ownership',
    // Heading = sans + italic-serif accent words (Figma "Intro · Our yachts" pattern)
    'title_a'  => 'Once the decision is',
    'title_a_em' => 'made,',
    'title_b'  => 'the journey',
    'title_b_em' => 'continues.',
    'subtitle' => 'Here’s what happens after you choose — one step at a time.',
    'steps'    => [
        ['label' => 'Decision',  'icon' => 'compass', 'text' => 'You choose your Heysea. Our team confirms the specification, timeline and every custom detail with you before anything is signed.'],
        ['label' => 'Purchase',  'icon' => 'doc',     'text' => 'Clear contracts, staged payments and a dedicated project manager — every milestone is documented and shared with you in real time.'],
        ['label' => 'Delivery',  'icon' => 'boat',    'text' => 'Sea trials, handover and crew familiarisation at the port of your choice. We stay on board until you feel completely at home.'],
        ['label' => 'Aftercare', 'icon' => 'wrench',  'text' => 'Warranty, global service partners and seasonal check-ups keep your yacht ready for the next horizon — for as long as you own her.'],
    ],
];
// Minimal stroke icons (24×24, currentColor). In production → sprite / ACF image field.
$ws_icons = [
    'compass' => '<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4z"/>',
    'doc'     => '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    'boat'    => '<path d="M3 15h18l-2.5 4h-13z"/><path d="M12 4v9M12 5l5 7h-5"/>',
    'wrench'  => '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.1L4 16.8 7.2 20l5.2-5.2a4 4 0 0 0 5.1-5.3l-2.4 2.4-2.6-.6-.6-2.6z"/>',
];
$e = static fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
?>
<section id="wave-steps" class="demo-sec ws" aria-labelledby="ws-title">
  <span class="demo-label">07 · Wave steps</span>
  <div class="ws-pin">
    <div class="container ws-inner">
      <header class="ws-head">
        <p class="ws-eyebrow"><?= $e($ws['eyebrow']) ?></p>
        <h2 class="ws-title" id="ws-title"><?= $e($ws['title_a']) ?> <em><?= $e($ws['title_a_em']) ?></em> <span><?= $e($ws['title_b']) ?> <em><?= $e($ws['title_b_em']) ?></em></span></h2>
        <p class="ws-sub"><?= $e($ws['subtitle']) ?></p>
      </header>

      <div class="ws-wave">
        <svg class="ws-svg" aria-hidden="true" focusable="false">
          <path class="ws-track"/>
          <path class="ws-progress"/>
        </svg>
        <ol class="ws-nodes">
          <?php foreach ($ws['steps'] as $i => $st): ?>
            <li class="ws-node" data-index="<?= $i ?>">
              <span class="ws-node__circle">
                <svg class="ws-node__icon" viewBox="0 0 24 24" aria-hidden="true"><?= $ws_icons[$st['icon']] ?? '' ?></svg>
                <svg class="ws-node__check" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9"/></svg>
              </span>
              <span class="ws-node__body">
                <span class="ws-node__label"><?= $e($st['label']) ?></span>
                <span class="ws-node__text"><?= $e($st['text']) ?></span>
              </span>
            </li>
          <?php endforeach; ?>
        </ol>
      </div>

      <!-- Desktop caption: one at a time (crossfade), decorative duplicate — screen readers get .ws-node__text in the list above. -->
      <div class="ws-captions" aria-hidden="true">
        <?php foreach ($ws['steps'] as $i => $st): ?>
          <p class="ws-caption<?= $i === 0 ? ' is-active' : '' ?>" data-index="<?= $i ?>"><?= $e($st['text']) ?></p>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>
