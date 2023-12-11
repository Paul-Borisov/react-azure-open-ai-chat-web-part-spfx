const replaceable = [
  { search: /\*\*([^*]+)\*\*/g, replace: '<b>$1</b>' }, // bold text
  { search: /\[([^\]]+)\]\(([^)]+)\)/g, replace: '<a href="$2" target="_blank" data-interception="off">$1</a>' }, // links
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
