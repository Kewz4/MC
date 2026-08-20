import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { addExtension, Packr, Unpackr } from 'msgpackr';

const SOURCE_SHA256 = 'f95f4c1121ecfa261dc5fe6aa667d8426a84c2f2acb6fadfaddab161ad945433';

const FRONT_TEXTURES = new Map([
  ['ffdd8484-8f76-4dc6-a746-1771cc8b1d51', {
    path: 'scripts/assets/spline-textures/01-bottle-brand.png',
    sha256: 'adddd50a48395632ebf15bff5db9718696f4c718a8ee5253b4dc0573c3a875eb',
  }],
  ['297f2d7a-c4b0-4863-9c2a-5257f767a0c8', {
    path: 'scripts/assets/spline-textures/02-cool-brand.png',
    sha256: '6820a8f1d37689b5f2643e52426a3c711beca7f302ce8197f480daca5f2641cf',
  }],
  ['0a8da05f-a664-4667-b71d-16c4f8882ddf', {
    path: 'scripts/assets/spline-textures/03-stay-cool-brand.png',
    sha256: '2e6f12305a24a7d24bfe7a08dbe21f77ce215e4f9d293ac625f473f7956e2f6d',
  }],
  ['610cb7e7-85e9-437a-9dce-f5f2e66a11fb', {
    path: 'scripts/assets/spline-textures/04-growth-brand.png',
    sha256: 'aa6ffdbfadc00c044aba2ada1d1fb74a1fa65209a5e962b0f31a6f7408dc8908',
  }],
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
const outputPath = path.resolve(projectRoot, process.argv[3] ?? 'public/assets/3d/stickers-scene-brand-v3.splinecode');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function auditRgbaPng(bytes, label) {
  const signature = Buffer.from('89504e470d0a1a0a', 'hex');
  if (!bytes.subarray(0, 8).equals(signature)) {
    throw new Error(`${label} is not a PNG.`);
  }

  let offset = 8;
  let header;
  const imageDataChunks = [];
  while (offset < bytes.length) {
    const chunkLength = bytes.readUInt32BE(offset);
    const chunkType = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    const chunkData = bytes.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === 'IHDR') {
      header = {
        width: chunkData.readUInt32BE(0),
        height: chunkData.readUInt32BE(4),
        bitDepth: chunkData[8],
        colorType: chunkData[9],
        compression: chunkData[10],
        filter: chunkData[11],
        interlace: chunkData[12],
      };
    } else if (chunkType === 'IDAT') {
      imageDataChunks.push(chunkData);
    }
    offset += 12 + chunkLength;
    if (chunkType === 'IEND') break;
  }

  if (!header) throw new Error(`${label} has no IHDR chunk.`);
  if (header.width <= 0 || header.height <= 0 || header.width !== header.height) {
    throw new Error(`${label} must have valid square dimensions, received ${header.width}x${header.height}.`);
  }
  if (header.bitDepth !== 8 || header.colorType !== 6 || header.compression !== 0 || header.filter !== 0 || header.interlace !== 0) {
    throw new Error(`${label} must be a non-interlaced 8-bit RGBA PNG.`);
  }

  const bytesPerPixel = 4;
  const rowBytes = header.width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(imageDataChunks));
  if (inflated.length !== (rowBytes + 1) * header.height) {
    throw new Error(`${label} decoded to an unexpected byte count.`);
  }

  let sourceOffset = 0;
  let previous = Buffer.alloc(rowBytes);
  let transparentPixels = 0;
  let partialAlphaPixels = 0;
  let opaquePixels = 0;
  for (let y = 0; y < header.height; y += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    const encoded = inflated.subarray(sourceOffset, sourceOffset + rowBytes);
    sourceOffset += rowBytes;
    const decoded = Buffer.allocUnsafe(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const left = x >= bytesPerPixel ? decoded[x - bytesPerPixel] : 0;
      const up = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      let predictor;
      if (filterType === 0) predictor = 0;
      else if (filterType === 1) predictor = left;
      else if (filterType === 2) predictor = up;
      else if (filterType === 3) predictor = Math.floor((left + up) / 2);
      else if (filterType === 4) predictor = paeth(left, up, upperLeft);
      else throw new Error(`${label} uses unsupported PNG filter ${filterType}.`);
      decoded[x] = (encoded[x] + predictor) & 0xff;
    }
    for (let x = 3; x < rowBytes; x += bytesPerPixel) {
      const alpha = decoded[x];
      if (alpha === 0) transparentPixels += 1;
      else if (alpha === 255) opaquePixels += 1;
      else partialAlphaPixels += 1;
    }
    previous = decoded;
  }

  if (transparentPixels === 0 || opaquePixels === 0) {
    throw new Error(`${label} must contain both transparent and opaque pixels.`);
  }
  return {
    width: header.width,
    height: header.height,
    bitDepth: header.bitDepth,
    colorType: 'RGBA',
    transparentPixels,
    partialAlphaPixels,
    opaquePixels,
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
      if (events.has(event.id)) throw new Error(`Duplicate Spline event id: ${event.id}`);
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

function findMaterialLayers(node) {
  if (node.data?.type !== 'Mesh') {
    throw new Error(`Expected ${node.id} to be a Mesh, received ${node.data?.type ?? 'unknown'}`);
  }
  const material = node.data.materials?.find((candidate) => candidate && typeof candidate === 'object');
  const colorLayer = material?.layers?.find((layer) => layer.data?.type === 'color');
  const textureLayer = material?.layers?.find((layer) => layer.data?.type === 'texture' && layer.data.texture?.image);
  if (!colorLayer || !textureLayer) {
    throw new Error(`Editable color/texture layers were not found on ${node.data.name} (${node.id}).`);
  }
  return { colorLayer, textureLayer };
}

function assertWhite(color, label) {
  for (const channel of ['r', 'g', 'b']) {
    if (color[channel] !== 1) throw new Error(`${label} ${channel} is not pure white.`);
  }
}

const sourceBytes = await readFile(inputPath);
const sourceChecksum = sha256(sourceBytes);
if (sourceChecksum !== SOURCE_SHA256) {
  throw new Error(`Refusing to modify an unexpected source scene. Expected ${SOURCE_SHA256}, received ${sourceChecksum}`);
}
if (inputPath === outputPath) throw new Error('The output must not overwrite the source scene.');

const textureInputs = new Map();
for (const [meshId, texture] of FRONT_TEXTURES) {
  const relativeTexturePath = texture.path;
  const absoluteTexturePath = path.resolve(projectRoot, relativeTexturePath);
  const bytes = await readFile(absoluteTexturePath);
  const textureChecksum = sha256(bytes);
  if (textureChecksum !== texture.sha256) {
    throw new Error(`Refusing to embed an unexpected texture for ${meshId}. Expected ${texture.sha256}, received ${textureChecksum}`);
  }
  textureInputs.set(meshId, {
    bytes,
    relativeTexturePath,
    sha256: textureChecksum,
    png: auditRgbaPng(bytes, relativeTexturePath),
  });
}

const unpackr = new Unpackr({ structuredClone: true });
const packr = new Packr({ structuredClone: true });
const sourceDocument = unpackr.unpack(sourceBytes);
const document = unpackr.unpack(sourceBytes);
if (!Buffer.from(packr.pack(sourceDocument)).equals(sourceBytes)) {
  throw new Error('Spline codec registration is not lossless; refusing to generate a modified scene.');
}

const sourceEvents = collectEvents(sourceDocument);
const sourceStartEvents = JSON.stringify(collectStartEventSnapshot(sourceDocument));
const injectedMeshes = new Set();
traverseObjects(document.scene.objects, (node) => {
  const textureInput = textureInputs.get(node.id);
  if (!textureInput) return;
  const { colorLayer, textureLayer } = findMaterialLayers(node);
  Object.assign(colorLayer.data.color, { r: 1, g: 1, b: 1 });
  textureLayer.data.texture.image.data = `data:image/png;base64,${textureInput.bytes.toString('base64')}`;
  injectedMeshes.add(node.id);
});
for (const meshId of FRONT_TEXTURES.keys()) {
  if (!injectedMeshes.has(meshId)) throw new Error(`Front sticker mesh was not found: ${meshId}`);
}

const documentEvents = collectEvents(document);
for (const id of CONDITIONAL_EVENT_IDS) {
  const entry = documentEvents.get(id);
  if (!entry) throw new Error(`Conditional event was not found: ${id}`);
  if (entry.event.data?.type !== 'Conditional') {
    throw new Error(`Expected ${id} to be Conditional, received ${entry.event.data?.type ?? 'unknown'}`);
  }
  entry.event.data.disabled = true;
}

const outputBytes = packr.pack(document);
const verificationDocument = unpackr.unpack(outputBytes);
const verificationEvents = collectEvents(verificationDocument);
const verifiedTextures = [];
traverseObjects(verificationDocument.scene.objects, (node) => {
  const expected = textureInputs.get(node.id);
  if (!expected) return;
  const { colorLayer, textureLayer } = findMaterialLayers(node);
  assertWhite(colorLayer.data.color, `${node.data.name} (${node.id})`);
  const prefix = 'data:image/png;base64,';
  const dataUri = textureLayer.data.texture.image.data;
  if (typeof dataUri !== 'string' || !dataUri.startsWith(prefix)) {
    throw new Error(`${node.data.name} (${node.id}) does not contain an embedded PNG data URI.`);
  }
  const embeddedBytes = Buffer.from(dataUri.slice(prefix.length), 'base64');
  if (!embeddedBytes.equals(expected.bytes)) {
    throw new Error(`${node.data.name} (${node.id}) embedded texture differs from its deterministic input.`);
  }
  verifiedTextures.push({
    id: node.id,
    name: node.data.name,
    source: expected.relativeTexturePath,
    bytes: embeddedBytes.byteLength,
    sha256: sha256(embeddedBytes),
    png: auditRgbaPng(embeddedBytes, `${node.data.name} (${node.id}) embedded texture`),
    baseColor: '#FFFFFF',
  });
});
if (verifiedTextures.length !== FRONT_TEXTURES.size) {
  throw new Error(`Expected ${FRONT_TEXTURES.size} verified textures, received ${verifiedTextures.length}.`);
}

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
  if (!outputEvent) throw new Error(`Event was removed during repack: ${id}`);
  if (!CONDITIONAL_EVENT_IDS.has(id) && outputEvent.data?.disabled !== sourceEvent.data?.disabled) {
    throw new Error(`Non-target event disabled state changed: ${id}`);
  }
}
if (JSON.stringify(collectStartEventSnapshot(verificationDocument)) !== sourceStartEvents) {
  throw new Error('One or more native Start events changed during scene generation.');
}

await writeFile(outputPath, outputBytes);
const writtenBytes = await readFile(outputPath);
if (!writtenBytes.equals(Buffer.from(outputBytes))) {
  throw new Error('Written scene does not match the verified in-memory output.');
}

console.log(JSON.stringify({
  input: path.relative(projectRoot, inputPath),
  inputBytes: sourceBytes.byteLength,
  inputSha256: sourceChecksum,
  output: path.relative(projectRoot, outputPath),
  outputBytes: writtenBytes.byteLength,
  outputSha256: sha256(writtenBytes),
  verifiedTextures: verifiedTextures.sort((left, right) => left.id.localeCompare(right.id)),
  disabledConditionalIds,
  preservedStartEventIds: collectStartEventSnapshot(verificationDocument).map(({ event }) => event.id).sort(),
}, null, 2));
