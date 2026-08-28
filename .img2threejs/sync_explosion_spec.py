"""Mirror the final runtime EXPLOSION map + EXPLODE_WINDOWS into the spec (max-detail iteration)."""
import json

spec = json.load(open('object-sculpt-spec.json', encoding='utf-8'))
comps = spec['runtimeExplosion']['components']

FINAL = {
    'crystal':            ([-0.22, 0.55, 0.80], 2.75, 1, 'CRYSTAL', 'Domed sapphire glazing'),
    'bezel':              ([-0.18, 0.16, 0.97], 2.3, 2, 'BEZEL', 'Concave polished front ring'),
    'rehaut-ring':        ([0, 0.02, 1], 1.95, 3, 'REHAUT', 'Inner trim ring'),
    'pinion-cap':         ([0, 0, 1], 1.72, 4, '', 'Center cap'),
    'hand-chrono':        ([0.24, 0.12, 0.96], 1.62, 5, 'SECONDS', 'Chronograph seconds needle'),
    'hand-minute':        ([-0.22, 0.16, 0.96], 1.48, 6, 'MINUTE', 'Leaf minute hand'),
    'hand-hour':          ([0.18, -0.22, 0.96], 1.32, 7, 'HOUR', 'Leaf hour hand'),
    'subhand-left':       ([0, 0, 1], 1.18, 8, '', 'Small seconds hand'),
    'subhand-right':      ([0, 0, 1], 1.18, 8, '', '30-min counter hand'),
    'hand-date':          ([0, 0, 1], 1.18, 8, '', 'Date hand'),
    'hour-markers':       ([0, 0, 1], 1.05, 9, 'MARKERS', 'Applied baton indexes'),
    'dial-apertures':     ([0, 0, 1], 0.85, 10, 'DAY / MONTH', 'Calendar aperture set'),
    'dial-round-windows': ([0, 0, 1], 0.92, 10, '', 'Day/night + leap year'),
    'subdials':           ([0, 0, 1], 0.72, 11, 'SUBDIAL', 'Recessed counter wells'),
    'date-subdial':       ([0, -0.45, 0.89], 0.7, 11, 'DATE RING', 'Perpetual date arc'),
    'moonphase':          ([0.35, -0.15, -0.925], 2.3, 12, 'MOONPHASE', 'Navy lacquer moon disc'),
    'dial-plate':         ([0, 0, 1], 0.4, 13, 'DIAL', 'Sunburst gradient plate'),
    'movement-plate':     ([0.25, -0.23, -0.94], 3.6, 14, 'MOVEMENT', 'Mechanical calibre'),
    'gear-train':         ([0.22, 0.14, 0.96], 0.62, 19, 'GEAR TRAIN', 'Going train, cut teeth'),
    'balance-wheel':      ([0.05, -0.35, 0.94], 0.7, 19, 'BALANCE', 'Balance wheel + hairspring'),
    'mainspring-barrel':  ([0.35, -0.12, 0.93], 0.55, 19, 'BARREL', 'Mainspring barrel'),
    'chrono-works':       ([-0.12, 0.38, 0.92], 1.1, 19, 'COLUMN WHEEL', 'Chronograph command layer'),
    'movement-screws':    ([0.15, -0.3, -0.94], 0.7, 20, '', 'Bridge screws'),
    'calendar-works':     ([0.27, 0.32, -0.91], 2.3, 21, 'CALENDAR WORKS', 'Perpetual calendar module'),
    'case-back':          ([0.72, -0.5, -0.48], 5.4, 15, 'CASE BACK', 'Screw-down rear cover'),
    'crown':              ([0.97, 0.24, 0], 1.6, 16, 'CROWN', 'Fluted winding crown'),
    'pusher-upper':       ([0.866, 0.5, 0], 0.75, 17, 'UPPER PUSHER', 'Chronograph start/stop'),
    'pusher-lower':       ([0.866, -0.5, 0], 0.55, 17, 'LOWER PUSHER', 'Chronograph reset'),
    'strap-upper':        ([0, 1, 0], 1.0, 18, 'STRAP', 'Braided calfskin, upper'),
    'strap-lower':        ([0, -1, 0], 1.0, 18, '', 'Braided calfskin, lower'),
}
for cid, (axis, dist, order, label, desc) in FINAL.items():
    comps[cid] = {'axis': axis, 'distance': dist, 'order': order, 'label': label, 'description': desc}

spec['runtimeExplosion']['stagger']['windows'] = {
    '1': [0.0, 0.16], '2': [0.05, 0.16], '3': [0.12, 0.15],
    '9': [0.2, 0.15], '10': [0.25, 0.15], '11': [0.3, 0.15],
    '4': [0.42, 0.1], '5': [0.44, 0.12], '6': [0.46, 0.12], '7': [0.49, 0.12], '8': [0.5, 0.1],
    '13': [0.5, 0.15],
    '16': [0.62, 0.13], '17': [0.66, 0.13],
    '15': [0.74, 0.13], '14': [0.82, 0.14], '12': [0.85, 0.12], '21': [0.87, 0.11],
    '18': [0.86, 0.12], '19': [0.88, 0.11], '20': [0.92, 0.08],
}

json.dump(spec, open('object-sculpt-spec.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print('runtimeExplosion synced:', len(FINAL), 'components,', len(spec['runtimeExplosion']['stagger']['windows']), 'windows')
