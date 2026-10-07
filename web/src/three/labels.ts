import { CanvasTexture, Sprite, SpriteMaterial, SRGBColorSpace } from 'three';

/** A piece of text as a sprite that always faces the camera. `height` is the height of one line in scene units; a line break starts a new line. */
export function textSprite(text: string, color: string, height: number, bold = false): Sprite {
  const px = 64;
  const lines = text.split('\n');
  const font = `${bold ? '700 ' : ''}${px}px "Clarity City", system-ui, -apple-system, "Segoe UI", sans-serif`;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const lineHeight = px + 16;
  if (ctx) {
    ctx.font = font;
    canvas.width = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width))) + 16;
    canvas.height = lineHeight * lines.length;
    ctx.font = font; // the canvas resets its state when it is resized
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, lineHeight * (i + 0.5)));
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new Sprite(material);
  const unit = height / lineHeight;
  sprite.scale.set(canvas.width * unit, canvas.height * unit, 1);
  return sprite;
}

/** A label that fits a slot: a long one breaks at the space nearest its middle, and what is still too wide shrinks. */
export function fitLabel(text: string, slot: number, color: string, height: number, bold = false): Sprite {
  const max = slot * 0.96;
  let sprite = textSprite(text, color, height, bold);
  if (sprite.scale.x > max && !text.includes('\n') && text.includes(' ')) {
    const middle = text.length / 2;
    let cut = -1;
    for (let i = 0; i < text.length; i += 1) if (text[i] === ' ' && (cut < 0 || Math.abs(i - middle) < Math.abs(cut - middle))) cut = i;
    sprite.material.map?.dispose();
    sprite.material.dispose();
    sprite = textSprite(`${text.slice(0, cut)}\n${text.slice(cut + 1)}`, color, height, bold);
  }
  if (sprite.scale.x > max) {
    const k = max / sprite.scale.x;
    sprite.scale.set(sprite.scale.x * k, sprite.scale.y * k, 1);
  }
  return sprite;
}
