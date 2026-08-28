"""Add chrono-works + calendar-works to spec componentTree + runtimeExplosion; keep strict validation green."""
import json, copy

spec = json.load(open('object-sculpt-spec.json', encoding='utf-8'))
tree = spec['componentTree']
movement = next(c for c in tree if c['id'] == 'movement-plate')
dial = next(c for c in tree if c['id'] == 'dial-plate')

def detail_child(base, cid, name, why, intent, dims, pos, parent, socket, mat='mat-case-brushed', importance=0.6):
    c = copy.deepcopy(base)
    c['id'] = cid
    c['name'] = name
    c['level'] = 'micro'
    c['role'] = 'calibre-part'
    c['importance'] = importance
    c['confidence'] = 0.4
    c['primitive'] = 'extrude'
    c['topologyClass'] = 'assembled-solid'
    c['topologyRationale'] = why
    c['geometryDescriptor'] = dict(base['geometryDescriptor'])
    c['geometryDescriptor']['topologyIntent'] = intent
    c['parent'] = parent
    c['attachment'] = {
        'parentSocket': socket, 'localStart': [pos[0], pos[1], -0.3],
        'localEnd': list(pos), 'contactType': 'socket', 'embedDepth': 0.03, 'gapTolerance': 0.01}
    c['dimensions'] = {'width': dims[0], 'height': dims[1], 'depth': dims[2],
                       'units': 'world (1 unit = 10 mm)', 'confidence': 0.4}
    c['transform'] = {'position': [0, 0, 0], 'rotation': [0, 0, 0], 'scale': [1, 1, 1]}
    ap = copy.deepcopy(base['actionProfile'])
    ap['animationRole'] = 'rotating-part'
    ap['destruction']['fractureGroup'] = cid
    c['actionProfile'] = ap
    c['material'] = mat
    c['materialLayers'] = [mat, 'mat-case-polished']
    c['localFeatures'] = []
    c['details'] = []
    c['fidelityTier'] = 'form-refinement'
    return c

new_comps = [
    detail_child(movement, 'chrono-works', 'Chronograph Works (column wheel + levers)',
                 'Blue-steel 16-post column wheel, S-shaped operating levers from pusher interiors, brake hammer, clutch bridge; convention-derived chronograph command layer.',
                 'column wheel r0.16 with 8 posts + ratchet base, 2 Shape-extruded levers, L hammer, clutch bridge (src/model/movement.ts chrono group)',
                 (1.4, 1.2, 0.2), (0.55, 0.35, -0.1), 'movement-plate', 'movement-plate-face', 'mat-case-polished', 0.7),
    detail_child(dial, 'calendar-works', 'Perpetual Calendar Works (under dial)',
                 'Champagne 31-tooth date ring, 12-lobe month cam, 48T program wheel, correction levers, jewels + screws; hidden beneath the dial, revealed when it rises.',
                 '31-tooth ring r1.05-1.30, gold monthly cam, program wheel, 2 polished levers (src/model/calendar.ts)',
                 (2.6, 2.6, 0.12), (0, 0, 0.05), 'dial-plate', 'dial-underside', 'mat-dial-sunburst', 0.7),
]
existing = {c['id'] for c in tree}
for c in new_comps:
    if c['id'] not in existing:
        anchor = 'movement-plate' if c['parent'] == 'movement-plate' else 'dial-plate'
        idx = next(i for i, t in enumerate(tree) if t['id'] == anchor) + 1
        tree.insert(idx, c)

comps = spec['runtimeExplosion']['components']
comps['chrono-works'] = {'axis': [-0.12, 0.38, 0.92], 'distance': 0.78, 'order': 19, 'label': 'COLUMN WHEEL', 'description': 'Chronograph command'}
comps['calendar-works'] = {'axis': [0, 0.1, 1], 'distance': 0.18, 'order': 21, 'label': 'CALENDAR WORKS', 'description': 'Perpetual calendar module'}
spec['runtimeExplosion']['stagger']['windows']['21'] = [0.56, 0.13]

json.dump(spec, open('object-sculpt-spec.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print('spec: added', [c['id'] for c in new_comps], '| total components:', len(tree))
