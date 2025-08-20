import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-csl";

const bibSection = document.getElementById('bibliography');
if (bibSection) {
  fetch(bibSection.getAttribute("data-bibfile")).then((response) => response.text()).then((bibData) => {
    let citations = getCitations();
    let [entries, entriesHtml] = buildBibliography(citations, bibData);
    mergeBiblio(entriesHtml);
    replaceInText(entries);
  });
}

function getCitations() {
  const citationKeys = new Set();
  const nodes = document.querySelectorAll('[data-cite]');

  nodes.forEach(node => {
    let citations = node.getAttribute('data-cite').split(',');
    citations.forEach(citation => citationKeys.add(citation.trim()));
  });

  return Array.from(citationKeys);
}

function buildBibliography(citations, bibData) {
  const bib = new Cite(bibData);
  const entries = {};
  const citations_good = [];

  citations.forEach(cite => {
    try {
      const label = bib.format('citation', { template: 'apa', entry: cite }).slice(1, -1);
      const full_citation = bib.format('bibliography', { template: 'apa', format: 'html', entry: cite });
      entries[cite] = [label, full_citation];
      citations_good.push(cite);
    } catch {
      console.log("Citation not found in bibliography file: ", cite);
    }
  });

  const entriesHtml = bib.format('bibliography', { template: 'apa', format: 'html', entry: citations_good, asEntryArray: true });
  return [entries, entriesHtml];
}

function mergeBiblio(entriesHtml) {
  const bibSection = document.getElementById('bibliography');
  const perpage = bibSection.getAttribute('data-perpage') || 5;

  let section;
  entriesHtml.forEach((entry, index) => {
    if (index % perpage === 0) {
      section = document.createElement("section");
      section.classList.add('bibliography-section');
      let h = document.createElement("h1");
      h.textContent = "References";
      section.appendChild(h);
      bibSection.appendChild(section);
    }
    let div = document.createElement("div");
    div.classList.add('bibliography-entry');
    div.innerHTML = entry[1];
    section.appendChild(div);
  });
}

function inTextStyle(node) {
  node.classList.add('citation-intext');
  node.setAttribute("href", '#/bibliography');
}

function replaceInText(entries) {
  const nodes = document.querySelectorAll('[data-cite]');
  nodes.forEach(function (node) {
    let refs = node.getAttribute('data-cite').split(',').map(s => s.trim());
    let refs_entry = refs.map(ref => entries[ref] ? entries[ref][0] : '??');

    if (node.getAttribute('data-citet') !== null) {
      let out = refs_entry.map(ref => {
        let nameYear = ref === '??' ? ['?', '?'] : ref.split(', ');
        return `${nameYear[0]} (${nameYear[1]})`;
      }).join('; ');
      node.textContent = out;
      inTextStyle(node);
    } else if (node.getAttribute('data-citealt') !== null) {
      let out = refs_entry.join('; ');
      node.textContent = out;
      inTextStyle(node);
    } else if (node.getAttribute('data-citefull') !== null) {
      let out = refs.map(ref => refs_entry[ref] !== '??' ? entries[ref][1] : '??');
      node.innerHTML = out;
    } else { // data-citep or unspecified
      let out = refs_entry.join('; ');
      node.textContent = '(' + out + ')';
      inTextStyle(node);
    }
  });
}
