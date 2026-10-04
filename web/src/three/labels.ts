import { CanvasTexture, Sprite, SpriteMaterial, SRGBColorSpace } from 'three';

/** A piece of text as a sprite that always faces the camera. `height` is its height in scene units. */
export function textSprite(text: string, color: string, height: number, bold = false): Sprite {
  const px = 64;
  const font = `${bold ? '700 ' : ''}${px}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = font;
    canvas.width = Math.ceil(ctx.measureText(text).width) + 16;
    canvas.height = px + 16;
    ctx.font = font; // the canvas resets its state when it is resized
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 8, canvas.height / 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new Sprite(material);
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1);
  return sprite;
}
