"""Add calibre sub-components to spec + runtimeExplosion; keep strict validation green."""
import json, copy

spec = json.load(open('object-sculpt-spec.json', encoding='utf-8'))
tree = spec['componentTree']
movement = next(c for c in tree if c['id'] == 'movement-plate')

movement['topologyRationale'] = (
    'Mechanical calibre stack-in for the exploded story: brushed main plate + bridges with '
    'jewels, going train with cut-tooth spur gears, balance wheel + hairspring, mainspring '
    'barrel, hex bridge screws. Convention-derived (movement invisible in reference).')
movement['geometryDescriptor']['topologyIntent'] = (
    'module build (src/model/movement.ts): plate r1.52 + rounded-outline bridge extrusions; '
    '4 Shape-extruded spur gears (28/22/18/24 teeth) with arbors; torus balance + Archimedean '
    'hairspring tube; barrel drum + spiral groove + click wheel; 8 instanced hex screws')

def calibre_child(cid, name, why, intent, dims, pos, mat='mat-case-brushed', importance=0.6):
    c = copy.deepcopy(movement)
    c['id'] = cid
    c['name'] = name
    c['level'] = 'micro'
    c['role'] = 'calibre-part'
    c['importance'] = importance
    c['confidence'] = 0.4
    c['primitive'] = 'extrude'
    c['topologyClass'] = 'assembled-solid'
    c['topologyRationale'] = why
    c['geometryDescriptor'] = dict(movement['geometryDescriptor'])
    c['geometryDescriptor']['topologyIntent'] = intent
    c['parent'] = 'movement-plate'
    c['attachment'] = {
        'parentSocket': 'movement-plate-face', 'localStart': [pos[0], pos[1], -0.3],
        'localEnd': list(pos), 'contactType': 'socket', 'embedDepth': 0.03, 'gapTolerance': 0.01}
    c['dimensions'] = {'width': dims[0], 'height': dims[1], 'depth': dims[2],
                       'units': 'world (1 unit = 10 mm)', 'confidence': 0.4}
    c['transform'] = {'position': [0, 0, 0], 'rotation': [0, 0, 0], 'scale': [1, 1, 1]}
    ap = copy.deepcopy(movement['actionProfile'])
    ap['animationRole'] = 'rotating-part' if cid in ('gear-train', 'balance-wheel') else 'explode-layer'
    ap['destruction']['fractureGroup'] = cid
    c['actionProfile'] = ap
    c['material'] = mat
    c['materialLayers'] = [mat, 'mat-case-polished']
    c['localFeatures'] = []
    c['details'] = []
    c['fidelityTier'] = 'form-refinement'
    return c

new_comps = [
    calibre_child('gear-train', 'Going Train (4 spur gears)',
                  'Repeated cut-tooth spur gears (Shape extrusions) on polished arbors; convention-derived calibre detail.',
                  '4 gears r0.42/0.30/0.24/0.34 with 28/22/18/24 trapezoidal teeth + arbors', (1.2, 1.2, 0.15), (0.1, 0.1, -0.15), importance=0.7),
    calibre_child('balance-wheel', 'Balance Wheel + Hairspring',
                  'Torus rim + spokes + staff with Archimedean spiral hairspring tube; the visual oscillator.',
                  'torus r0.3 rim, 3 spokes, 3.5-turn hairspring tube above', (0.7, 0.7, 0.2), (-0.7, -0.62, -0.12), 'mat-case-polished', 0.7),
    calibre_child('mainspring-barrel', 'Mainspring Barrel',
                  'Drum cylinder with spiral groove hint + click wheel; power-reserve layer of the calibre stack.',
                  'drum r0.38 h0.12 + gold spiral + 14-tooth click wheel', (0.8, 0.8, 0.16), (0.55, -0.05, -0.2)),
    calibre_child('movement-screws', 'Bridge Screws (8x hex)',
                  'Instanced hex-head screws fastening plate and bridges; nuts-and-bolts read in the exploded view.',
                  'InstancedMesh hex cylinder r0.03 h0.035, 5 perimeter + 3 bridge instances', (0.06, 0.06, 0.035), (1.35, 0, -0.24), 'mat-case-polished', 0.5),
]
existing = {c['id'] for c in tree}
idx = next(i for i, c in enumerate(tree) if c['id'] == 'movement-plate') + 1
for c in reversed(new_comps):
    if c['id'] not in existing:
        tree.insert(idx, c)

comps = spec['runtimeExplosion']['components']
comps['movement-plate'] = {'axis': [0, 0, -1], 'distance': 1.05, 'order': 14, 'label': 'MOVEMENT', 'description': 'Mechanical calibre'}
comps['gear-train'] = {'axis': [0, 0, 1], 'distance': 0.5, 'order': 19, 'label': 'GEAR TRAIN', 'description': 'Going train, cut teeth'}
comps['balance-wheel'] = {'axis': [0, 0, 1], 'distance': 0.72, 'order': 19, 'label': 'BALANCE', 'description': 'Balance wheel + hairspring'}
comps['mainspring-barrel'] = {'axis': [0, 0, 1], 'distance': 0.38, 'order': 19, 'label': 'BARREL', 'description': 'Mainspring barrel'}
comps['movement-screws'] = {'axis': [0, 0, -1], 'distance': 0.5, 'order': 20, 'label': '', 'description': 'Bridge screws'}
spec['runtimeExplosion']['stagger']['windows']['19'] = [0.86, 0.12]
spec['runtimeExplosion']['stagger']['windows']['20'] = [0.9, 0.1]

json.dump(spec, open('object-sculpt-spec.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print('spec: calibre components added:', [c['id'] for c in new_comps])
