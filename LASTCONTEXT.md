# Current state
- Branch: `task/andes-uniform-models`.
- Added optimized 3D `.glb` assets under `web/public/models/` (`san-martin.glb`, `soldier-blue.glb`, `soldier-red.glb`, `musket.glb`) from `test/`.
- Implemented `web/src/scenes/andes/uniformModels.ts` (`attachMusketToBack` mounts the flintlock musket onto `mixamorig:Spine2` on the back of both soldiers; `ANDES_INTRO_MARCH_FORMATION`; `INTRO_HOVER_ESCORT_FORMATION`; `UNIFORM_MODELS`; `loadUniformAssets`).
- Implemented `web/src/scenes/andes/CharacterStage3D.tsx` with eager asset preloading, orbit rotation, and zoom-in/zoom-out (`zoomScale` + wheel zoom) without adding `three` to the initial bundle.
- Added `"Ver uniformes"` button in `web/src/app/Header.tsx` opening `web/src/app/UniformsModal.tsx` (`90vh` height, `"Alejar zoom −"` / `"Acercar zoom +"` buttons and wheel zoom) with the 3 3D models.
- Updated `web/src/scenes/andes/AndesIntro.tsx` and `andesIntro.css` so San Martín and the 5 soldiers (3 blue, 2 red) appear earlier, larger, and walking right above the `"Cruce de los Andes"` / `1817` title in the celeste sky.
- Updated `web/src/intro/Intro.tsx` to show San Martín escorted by 2 grenadiers on the right over the Argentina map when hovering `"Cruce de los Andes"`.
- Added `"Modelos detallados"` toggle in `web/src/scenes/andes/index.tsx` and `MapLibreRenderer.tsx` / `figures3d.ts` so the Andes crossing infantry uses the 3D GLB models when enabled.
- Next: push to `origin/task/andes-uniform-models`, verify GitHub Actions CI is green, and open the PR.
