import '@mui/material/styles';

/**
 * Module augmentation — extends MUI's Palette with GameHub's platform accent
 * colors. These are CONTENT-driven (they tag real data: account platform,
 * PS-Plus badge), not UI chrome. Chrome is the teal primary.
 */
declare module '@mui/material/styles' {
  interface Palette {
    playStation: Palette['primary'];
    xbox: Palette['primary'];
    pc: Palette['primary'];
    gold: Palette['primary'];
  }
  interface TypeBackground {
    surfaceOffWhite: string;
  }
  interface PaletteOptions {
    playStation?: PaletteOptions['primary'];
    xbox?: PaletteOptions['primary'];
    pc?: PaletteOptions['primary'];
    gold?: PaletteOptions['primary'];
  }
}
