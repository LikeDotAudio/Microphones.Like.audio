/* One mutable object holding what the three panes are currently showing.
 * Renderers read it; event handlers write it and then call a render. */

export const state = {
  index: null,
  byBrand: new Map(),      // slug -> brand record from index.json
  brandData: new Map(),    // slug -> full records, lazily fetched
  query: "",
  patterns: new Set(),     // selected polar-pattern keys, OR-ed together
  scope: null,             // brand the middle pane lists; null = the whole catalogue
  tag: null,               // active site tag, chosen from the Tags view
  tagList: null,           // [{name, count, mics}] once tags.json has loaded
  tagMembers: new Map(),   // tag -> Set("<brand>/<model>")
  tagQuery: "",
  tagSort: "count",
  brand: null,             // brand of the selected mic
  model: null,
  type: "all",
  form: "all",
  price: "any",
  traits: new Set(),       // tube / multi / stereo, AND-ed together
  currentOnly: false,
  sort: "name",
  limit: 0,                // cards rendered so far in the model list
};
