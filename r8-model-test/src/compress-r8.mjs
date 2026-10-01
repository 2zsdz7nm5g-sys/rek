import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, meshopt, draco, reorder, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
  'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule() });
const SRC = '../../fbx/r8-fbx-clean-raw.glb';
// A: meshopt + quantization (positions 14-bit = 0.27 mm over 4.4 m; normals 10-bit; UVs 12-bit)
{ const doc = await io.read(SRC);
  await doc.transform(dedup(), prune(), reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  await io.write('../../fbx/r8-rek-studio.meshopt.glb', doc); }
// B: Draco (same precision)
{ const doc = await io.read(SRC);
  await doc.transform(dedup(), prune(), draco({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, method: 'edgebreaker' }));
  await io.write('../../fbx/r8-rek-studio.draco.glb', doc); }
const chk = await io.read('../../fbx/r8-rek-studio.meshopt.glb');
let tris = 0; for (const m of chk.getRoot().listMeshes()) for (const p of m.listPrimitives()) tris += p.getIndices().getCount() / 3;
console.log('meshopt file: meshes', chk.getRoot().listMeshes().length, 'materials', chk.getRoot().listMaterials().length, 'triangles', tris);
