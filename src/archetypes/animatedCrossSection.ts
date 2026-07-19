import type { Archetype, ModuleContext, ArchetypeHandle } from './types';
import type { ModuleInstance } from '../config/schema';
import { CrossSectionDeck } from './crossSection';
import { renderContext, renderAssist, renderControls } from './panels';

// Standalone animated 2D cross-section module. In hs-01 the cross-section is
// module-0's LINKED deck (driven by globe-motion-overlay); this archetype is the
// STANDALONE form, first exercised by the landforms lesson (river/glacier/coastal
// profiles). Reuses the shared SECTION_RENDERERS via CrossSectionDeck — a new
// lesson adds a named renderer + data, not a new archetype.
export interface CrossSectionParams {
  scenes: string[];   // named renderers this module offers (legend switches them)
  default: string;    // initial scene key
}

interface Handle extends ArchetypeHandle {
  deck: CrossSectionDeck;
}

export const animatedCrossSection: Archetype<CrossSectionParams> = {
  key: 'animated-cross-section',

  buildVisuals(ctx: ModuleContext, params: CrossSectionParams): Handle {
    const deck = new CrossSectionDeck(ctx, params.default);
    return { layerKeys: [], deck };
  },

  buildPanel(ctx, module: ModuleInstance<CrossSectionParams>, handle: Handle): void {
    renderContext(ctx, module, {
      activeLegendKey: handle.deck.secType,
      onLegendClick: (key) => { handle.deck.setScene(key); },
    });
    renderAssist(ctx, module);
  },

  buildControls(ctx, module: ModuleInstance<CrossSectionParams>, handle: Handle): void {
    renderControls(ctx, module, (act) => { this.onAction(ctx, act, handle, module.params); });
  },

  onEnter(ctx, handle: Handle, params: CrossSectionParams): void {
    ctx.panels.deck.root.classList.add('show');
    handle.deck.setScene(params.default);
    handle.deck.start();
  },

  onExit(ctx, handle: Handle): void {
    handle.deck.stop();
    ctx.panels.deck.root.classList.remove('show');
  },

  onAction(_ctx, _act, _handle, _params): void {
    // scene switching is via the legend; NARRATE ('speak') is handled in renderControls
  },
};
