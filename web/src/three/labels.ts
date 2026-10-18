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

/**
 * A flag and, next to it, a place in a ranking, as a sprite that always faces the camera. The flag is an image: the sprite shows the place at
 * once and gets the flag when the image has loaded. `height` is the height of the label in scene units.
 */
export function flagRankSprite(flag: string, rank: number | null, color: string, height: number): Sprite {
  const px = 64;
  const flagW = Math.round(px * 1.33);
  const font = `700 ${px}px "Clarity City", system-ui, -apple-system, "Segoe UI", sans-serif`;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const text = rank === null ? '' : String(rank);
  const gap = text ? 16 : 0;
  const pad = 8;
  const lineHeight = px + 16;
  let textW = 0;
  if (ctx) {
    ctx.font = font;
    textW = text ? Math.ceil(ctx.measureText(text).width) : 0;
  }
  canvas.width = pad * 2 + flagW + gap + textW;
  canvas.height = lineHeight;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const draw = (image?: HTMLImageElement) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) ctx.drawImage(image, pad, (lineHeight - px) / 2, flagW, px);
    if (text) {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(text, pad + flagW + gap, lineHeight / 2);
    }
    texture.needsUpdate = true;
  };
  draw();
  if (typeof Image !== 'undefined') {
    const image = new Image();
    image.onload = () => draw(image);
    image.src = flag;
  }
  const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new Sprite(material);
  const unit = height / lineHeight;
  sprite.scale.set(canvas.width * unit, canvas.height * unit, 1);
  return sprite;
}
