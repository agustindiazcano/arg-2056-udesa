# Last Context

## State
- Branch: `task/andes-uniform-models`.
- Added optimized 3D GLB assets under `web/public/models/` (`san-martin.glb`, `soldier-blue.glb`, `soldier-red.glb`, `musket.glb`) from `test/`.
- Mounted flintlock musket diagonally across the soldier's back (`attachMusketToBack` to `mixamorig:Spine2`).
- Implemented `web/src/scenes/andes/uniformModels.ts`, `stageThreeRuntime.ts` (tree-shaken dynamic chunk), and `CharacterStage3D.tsx` with reduced-motion static render optimization, orbit rotation, and zoom controls.
- Added `"Ver uniformes"` button in `web/src/app/Header.tsx` opening `web/src/app/UniformsModal.tsx` (`90vh` height, zoom controls and wheel zoom) showing the 3 3D models.
- Updated `web/src/scenes/andes/AndesIntro.tsx` so San Martín and 5 soldiers (3 blue, 2 red) appear walking right above `"Cruce de los Andes"` / `1817` in the celeste sky.
- Updated `web/src/intro/Intro.tsx` to display San Martín escorted by 2 grenadiers over the Argentina map when hovering `"Cruce de los Andes"`.
- Added `"Modelos detallados"` toggle in `web/src/scenes/andes/index.tsx` and `MapLibreRenderer.tsx` / `figures3d.ts` to switch the Andes infantry to 3D GLB models.
- Updated slide 4 title in `web/src/tour/slideTitles.ts` to `"El costo de acceder a la IA"`.
- Added 3D model screenshots (`docs/assets/models/*.jpg`), table of contents index, `.glb` repository links, and Meshy AI free-to-use licensing note in `README.md`.
- All GitHub Actions CI checks (`terrain`, `data`, `python`, `web` with 244 test files / 2308 unit tests, and `e2e` with all 80 Playwright tests) are 100% green.

## Next step
- Human review and approval of Pull Request. Never merge or push to `main`.
