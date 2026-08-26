import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addExtension, Packr, Unpackr } from 'msgpackr';

const SOURCE_SHA256 = 'f95f4c1121ecfa261dc5fe6aa667d8426a84c2f2acb6fadfaddab161ad945433';

const FRONT_MESH_COLORS = new Map([
  ['ffdd8484-8f76-4dc6-a746-1771cc8b1d51', '#CB9933'],
  ['297f2d7a-c4b0-4863-9c2a-5257f767a0c8', '#CC112C'],
  ['0a8da05f-a664-4667-b71d-16c4f8882ddf', '#FFFFFF'],
  ['610cb7e7-85e9-437a-9dce-f5f2e66a11fb', '#101820'],
]);

const CONDITIONAL_EVENT_IDS = new Set([
  '921efcaf-6dc4-4524-b9ba-75b79c64b5dd',
  'ec8580e0-6c8c-4ed9-92e2-5f50939fe643',
  '7204c242-df24-45b7-b14a-b08c6de05c0d',
  '08e6636e-6d71-45d4-8680-04f9bcc50bf3',
]);

// Spline registers these six msgpackr extensions before decoding .splinecode.
// Matching their prototypes and codecs makes an untouched decode/repack byte-identical.
class SceneMap {}
class SceneList extends Array {}
class SceneTree extends Array {}
class ObjectReference {
  constructor(id) {
    this.id = id;
  }
}
class DataReference {
  constructor(data) {
    this.data = data;
  }
}
class SceneRecord {}

[
  {
    Class: SceneMap,
    type: 1,
    write: (value) => ({ ...value }),
    read: (value) => Object.setPrototypeOf(value, SceneMap.prototype),
  },
  {
    Class: SceneList,
    type: 2,
    write: (value) => [...value],
    read: (value) => Object.setPrototypeOf(value, SceneList.prototype),
  },
  {
    Class: SceneTree,
    type: 3,
    write: (value) => [...value],
    read: (value) => Object.setPrototypeOf(value, SceneTree.prototype),
  },
  {
    Class: ObjectReference,
    type: 4,
    write: (value) => value.id,
    read: (value) => new ObjectReference(value),
  },
  {
    Class: DataReference,
    type: 5,
    write: (value) => value.data,
    read: (value) => new DataReference(value),
  },
  {
    Class: SceneRecord,
    type: 6,
    write: (value) => ({ ...value }),
    read: (value) => Object.setPrototypeOf(value, SceneRecord.prototype),
  },
].forEach(addExtension);

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = path.resolve(projectRoot, process.argv[2] ?? 'public/assets/3d/stickers-scene-v1.splinecode');
const outputPath = path.resolve(projectRoot, process.argv[3] ?? 'public/assets/3d/stickers-scene-brand-v2.splinecode');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  if (!/^[\da-f]{6}$/i.test(normalized)) {
    throw new Error(`Invalid six-digit hex color: ${hex}`);
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  };
}

function traverseObjects(nodes, visit) {
  for (const node of nodes) {
    visit(node);
    traverseObjects(node.children ?? [], visit);
  }
}

function collectEvents(document) {
  const events = new Map();
  traverseObjects(document.scene.objects, (node) => {
    for (const event of node.data?.events ?? []) {
      if (events.has(event.id)) {
        throw new Error(`Duplicate Spline event id: ${event.id}`);
      }
      events.set(event.id, { nodeId: node.id, event });
    }
  });
  return events;
}

function collectStartEventSnapshot(document) {
  return [...collectEvents(document).values()]
    .filter(({ event }) => event.data?.type === 'Start')
    .map(({ nodeId, event }) => ({ nodeId, event }))
    .sort((left, right) => left.event.id.localeCompare(right.event.id));
}

function findFrontColorLayer(node) {
  if (node.data?.type !== 'Mesh') {
    throw new Error(`Expected ${node.id} to be a Mesh, received ${node.data?.type ?? 'unknown'}`);
  }

  const material = node.data.materials?.find((candidate) => candidate && typeof candidate === 'object');
  const colorLayer = material?.layers?.find((layer) => layer.data?.type === 'color');
  if (!colorLayer) {
    throw new Error(`No editable color layer found on ${node.data.name} (${node.id})`);
  }
  return colorLayer;
}

function assertColor(actual, expected, label) {
  for (const channel of ['r', 'g', 'b']) {
    if (Math.abs(actual[channel] - expected[channel]) > 1e-12) {
      throw new Error(`${label} ${channel} mismatch: expected ${expected[channel]}, received ${actual[channel]}`);
    }
  }
}

const sourceBytes = await readFile(inputPath);
const sourceChecksum = sha256(sourceBytes);
if (sourceChecksum !== SOURCE_SHA256) {
  throw new Error(`Refusing to modify an unexpected source scene. Expected ${SOURCE_SHA256}, received ${sourceChecksum}`);
}
if (inputPath === outputPath) {
  throw new Error('The output must be a new versioned file; refusing to overwrite the source scene.');
}

const unpackr = new Unpackr({ structuredClone: true });
const packr = new Packr({ structuredClone: true });
const sourceDocument = unpackr.unpack(sourceBytes);
const document = unpackr.unpack(sourceBytes);

const sourceRoundTrip = packr.pack(sourceDocument);
if (!Buffer.from(sourceRoundTrip).equals(sourceBytes)) {
  throw new Error('Spline codec registration is not lossless; refusing to generate a modified scene.');
}

const sourceEvents = collectEvents(sourceDocument);
const sourceStartEvents = JSON.stringify(collectStartEventSnapshot(sourceDocument));
const recoloredMeshes = new Set();

traverseObjects(document.scene.objects, (node) => {
  const hex = FRONT_MESH_COLORS.get(node.id);
  if (!hex) return;

  const colorLayer = findFrontColorLayer(node);
  Object.assign(colorLayer.data.color, hexToRgb(hex));
  recoloredMeshes.add(node.id);
});

for (const id of FRONT_MESH_COLORS.keys()) {
  if (!recoloredMeshes.has(id)) {
    throw new Error(`Front sticker mesh was not found: ${id}`);
  }
}

const documentEvents = collectEvents(document);
for (const id of CONDITIONAL_EVENT_IDS) {
  const entry = documentEvents.get(id);
  if (!entry) {
    throw new Error(`Conditional event was not found: ${id}`);
  }
  if (entry.event.data?.type !== 'Conditional') {
    throw new Error(`Expected ${id} to be Conditional, received ${entry.event.data?.type ?? 'unknown'}`);
  }
  entry.event.data.disabled = true;
}

const outputBytes = packr.pack(document);
const verificationDocument = unpackr.unpack(outputBytes);
const verificationEvents = collectEvents(verificationDocument);

const verifiedColors = [];
traverseObjects(verificationDocument.scene.objects, (node) => {
  const hex = FRONT_MESH_COLORS.get(node.id);
  if (!hex) return;

  const color = findFrontColorLayer(node).data.color;
  assertColor(color, hexToRgb(hex), `${node.data.name} (${node.id})`);
  verifiedColors.push({ id: node.id, name: node.data.name, hex });
});

const disabledConditionalIds = [...verificationEvents.values()]
  .filter(({ event }) => event.data?.type === 'Conditional' && event.data.disabled)
  .map(({ event }) => event.id)
  .sort();
const expectedDisabledIds = [...CONDITIONAL_EVENT_IDS].sort();
if (JSON.stringify(disabledConditionalIds) !== JSON.stringify(expectedDisabledIds)) {
  throw new Error(`Unexpected disabled Conditional events: ${disabledConditionalIds.join(', ')}`);
}

for (const [id, { event: sourceEvent }] of sourceEvents) {
  const outputEvent = verificationEvents.get(id)?.event;
  if (!outputEvent) {
    throw new Error(`Event was removed during repack: ${id}`);
  }
  if (!CONDITIONAL_EVENT_IDS.has(id) && outputEvent.data?.disabled !== sourceEvent.data?.disabled) {
    throw new Error(`Non-target event disabled state changed: ${id}`);
  }
}

const outputStartEvents = JSON.stringify(collectStartEventSnapshot(verificationDocument));
if (outputStartEvents !== sourceStartEvents) {
  throw new Error('One or more native Start events changed during scene generation.');
}

await writeFile(outputPath, outputBytes);
const writtenBytes = await readFile(outputPath);
if (!Buffer.from(writtenBytes).equals(Buffer.from(outputBytes))) {
  throw new Error('Written scene does not match the verified in-memory output.');
}

console.log(JSON.stringify({
  input: path.relative(projectRoot, inputPath),
  inputBytes: sourceBytes.byteLength,
  inputSha256: sourceChecksum,
  output: path.relative(projectRoot, outputPath),
  outputBytes: writtenBytes.byteLength,
  outputSha256: sha256(writtenBytes),
  verifiedColors: verifiedColors.sort((left, right) => left.id.localeCompare(right.id)),
  disabledConditionalIds,
  preservedStartEventIds: collectStartEventSnapshot(verificationDocument).map(({ event }) => event.id).sort(),
}, null, 2));
