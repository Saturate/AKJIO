import { findAndReplace } from 'mdast-util-find-and-replace';
import { abbreviations } from './abbreviations.mjs';

// Escape special regex characters in abbreviation keys
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build regex pattern from abbreviation keys
const abbrPattern = Object.keys(abbreviations)
  .map(escapeRegex)
  .join('|');
const abbrRegex = new RegExp(`\\b(${abbrPattern})\\b`, 'g');

export default function remarkAbbr() {
  return (tree) => {
    findAndReplace(tree, [
      [abbrRegex, (match) => {
        return {
          type: 'mdxJsxTextElement',
          name: 'abbr',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'title',
              value: abbreviations[match]
            }
          ],
          children: [
            {
              type: 'text',
              value: match
            }
          ],
          data: {
            _mdxExplicitJsx: true
          }
        };
      }]
    ], { ignore: ['code', 'inlineCode', 'link', 'linkReference'] });
  };
}
