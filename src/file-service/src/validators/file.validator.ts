import z from "zod";

export const IdParamsSchema = z.strictObject({
  id: z.coerce.number().positive().int()
})


export const QueryParamsGetFileSchema = z.object({
  // format attendu : <width>x<height>
  resize: z.string().regex(/^\d+(x\d+)?$/).transform((value) => {
    // découpe la string autour de "x" pour extraire width et height
    const [width, height] = value.split('x').map(Number);
    return { width, height };
  }).optional(),

  quality: z.coerce.number().min(1).max(100).optional(),
  rotate: z.coerce.number().int().max(360).min(-360).optional(),
  blur: z.coerce.number().int().min(0).optional(),
  format: z.enum(['webp', 'avif', 'png', 'jpeg']).optional(),
  negate: z.enum(['true', 'false']).transform((value) => {
    return value === 'true'
  }).optional(),

  // format attendu : "#" suivi d'une couleur en hexa sur 3 ou 6 caractères
  tint: z.string().regex(/^#[0-9A-Fa-f]{3,6}$/).optional(),
  
  // format attendu : <left>,<top>,<with>,<height>
  crop: z.string().regex(/^\d+,\d+,\d+,\d+$/).transform((value) => {
    const [left, top, width, height] = value.split(',').map(Number)
    return {
      left,
      top,
      width,
      height
    }
  }).optional(),
})