// https://www.markdownguide.org/basic-syntax/
const replaceable = [
  { search: /\*\*([^*]+)\*\*/g, replace: '<b>$1</b>' }, // bold text
  { search: /__([^_]+)__/g, replace: '<b>$1</b>' }, // bold text
  { search: /\*\*\*([^*]+)\*\*\*/g, replace: '<b><i>$1</i></b>' }, // bold and italic text
  { search: /___([^_]+)___/g, replace: '<b><i>$1</i></b>' }, // bold and italic text
  { search: /\[([^\]]+)\]\(([^)]+)\)/g, replace: '<a href="$2" target="_blank" data-interception="off">$1</a>' }, // links
  { search: /######\s([^#\n]+)/g, replace: '<h6>$1</h6>' }, // h6
  { search: /#####\s([^#\n]+)/g, replace: '<h5>$1</h5>' }, // h5
  { search: /####\s([^#\n]+)/g, replace: '<h4>$1</h4>' }, // h4
  { search: /###\s([^#\n]+)/g, replace: '<h3>$1</h3>' }, // h3
  { search: /##\s([^#\n]+)/g, replace: '<h2>$1</h2>' }, // h2
  { search: /#\s([^#\n]+)/g, replace: '<h1>$1</h1>' }, // h1
];

export default class MarkdownHelper {
  public static hasMarkdownBlocks(text: string): boolean {
    return text?.indexOf('```') > -1;
  }

  public static replaceMarkdownElements(text: string): string {
    let adjustedText = text;
    let replaced = false;
    replaceable.forEach((obj) => {
      if (obj.search.test(adjustedText)) {
        replaced = true;
        adjustedText = adjustedText.replace(obj.search, obj.replace);
      }
    });

    return replaced ? adjustedText : text;
  }
}
