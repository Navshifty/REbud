/*
  Analysis items arrive either as plain strings (sample data) or as
  { text, evidence } objects from the research pipeline. These helpers let
  a section render both without branching at every call site.
*/

/** Text of an item that may be a plain string or a { text, evidence } object. */
export function itemText(item) {
  return item && typeof item === "object" ? item.text : item;
}

/** Evidence array of an item, or [] when it carries none. */
export function itemEvidence(item) {
  return item && typeof item === "object" && Array.isArray(item.evidence) ? item.evidence : [];
}
