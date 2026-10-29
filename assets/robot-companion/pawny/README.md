# Uploaded character preview

`character.glb` derives from the user's `sample_2026-10-28T234950.433.glb`, generated with Microsoft's TRELLIS.2 from their supplied Pawny reference. It is not the original film production model. Embedded colour and metallic/roughness textures are preserved.

The derived GLB adds Body and Head joints with a smooth neck transition. The original upload has one fused mesh and no separate eyeballs, eyelid rig or independently modelled folding armour. At runtime, `character-detail.js` builds separate spherical eyes, irises, pupils and deforming eyelids, attached to two additional eye pivots. These runtime details are separate from the GLB file.

The preview implements independent eye tracking and blinking, gentle head tracking, a greeting nod, a whole-body hop and a turn. It does not implement walking, waving or capsule unfolding.

The original uploaded asset is retained unchanged. No reference photographs are included in this directory. The profile README, portfolio homepage and earlier companion pages are unchanged by this preview.

Geometry preparation uses the MIT-licensed meshoptimizer simplifier, with strong UV preservation. Runtime uses the existing MIT-licensed Three.js r160 bundle. `character-loader.js` reads this known GLB layout and assembles the source rig plus the runtime eye details. `software-renderer.js` rasterizes the same 3D geometry, eye rotations, eyelid deformation and head motion onto a transparent canvas when WebGL is unavailable. It preserves texture orientation and the metallic/roughness map channels.

## Hand and material revision

`character-refined.glb` replaces the raised right hand with a closed, locally sculpted mesh. It retains the uploaded model's four-digit layout, adds a cupped palm, tapered and flexed fingers, and a closed bevelled wrist cuff. The hand has one connected, watertight surface. The new hand colour is sampled from the supplied skin and balanced toward the cheek palette; the two embedded texture image files remain unchanged.

Organic skin, amber eyes, copper armour, hand and cuff have separate material groups. The skin is nonmetallic, organic seam normals are smoothed, and the renderer constrains surface roughness to reduce metallic sparkle. Anisotropic filtering is enabled where the GPU supports it. The generated source's coarse armour geometry and texture detail still limit the final finish; this revision does not reconstruct the original production asset.

## Independent eyes and eyelid finish

The runtime eye pivots turn the actual iris and pupil geometry independently of the head. Eye direction is calculated in each socket's local space so that it compensates for head movement. Eyes-only tracking is the default. `Release head` enables a smaller, slower head turn; `Hold head` isolates eye movement again. `Face view` provides a close-up. Pointer movement and touch movement both update the gaze target.

Upper and lower eyelids deform over the spherical eyes for blinks. Their skin texture is sampled from the supplied model's cheeks, with a feathered outer edge. The old fused iris triangles are retired at runtime, and the old angular socket rim is seated behind the new eyelids. The original uploaded GLB and its two embedded texture files are not overwritten. The new irises have radial colour detail and the corneal layer uses softer studio reflections.

WebGL uses transparent rendering, environment lighting and soft shadows. In the software fallback, eye-only frames reuse a cached body render; head, body or camera changes invalidate that cache. Reduced-motion settings disable idle movement and automatic blinking while keeping explicit controls available.

Validation covers stationary-head pupil movement, gaze compensation during head turns, complete eyelid closure, finite geometry, mobile framing and identical cached/full-rebuild output. The existing refined GLB passed the Khronos glTF validator with zero errors and warnings. Its source sculpt and texture resolution remain the main limits on realism.

## Gentler expression and relaxed hands

The current runtime revision opens the eyes slightly, enlarges the irises and pupils, warms the amber colour and raises the mouth corners with a small native mesh deformation. A normal transform follows the facial deformation. Independent eye tracking and full eyelid closure remain active.

`hand-relaxed.json` contains two new four-digit hand meshes. The raised hand has shorter fingers, a clearer opposable thumb and a wrist angle that follows the supplied reference more horizontally across the chest. The three long fingertip pads are positioned against the actual armour surface with a small clearance. The hanging hand replaces the fused pointed source shape with a cupped palm and softly curled fingers. Both meshes are single connected, closed surfaces with consistent outward winding.

The hand colours retain mottled albedo sampled from the supplied character's cheek texture. Skin relief, knuckles and shallow creases are part of the geometry and vertex colour, rather than a uniform glove colour. The old raised-hand primitive and hanging-hand region are removed from the runtime body mesh. The existing source GLB is retained unchanged. `Hand view` provides a close-up of the raised hand; it is mutually exclusive with `Face view`.
