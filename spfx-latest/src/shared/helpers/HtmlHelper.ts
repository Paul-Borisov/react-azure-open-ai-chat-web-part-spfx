export default class HtmlHelper {
  public static hasHtmlTags(text: string): boolean {
    return /<\/?[^>]+>/.test(text);
  }

  // &gt;p&lt; => <p>
  public static htmlDecode(html: string): string {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = html;
    return textArea.value;
  }

  // <p> > &gt;p&lt;
  public static htmlEncode(html: string): string {
    const textArea = document.createElement('textarea');
    textArea.innerText = html;
    return textArea.innerHTML.split('<br>').join('\n');
  }

  // method to decode html returned by a rich text field
  public static stripHtml(html: string): string {
    if (!html) {
      return '';
    }
    // Additional fix: <\/p><p ...may contain styles...> > <\/p><p[^>]*>
    const doc = new DOMParser().parseFromString(html.replace(/<\/p><p[^>]*>/gi, '</p> <p>'), 'text/html');
    //const doc = new DOMParser().parseFromString(html.replace(/<\/p><p>/g, '</p> <p>'), 'text/html');
    return doc.body.textContent || '';
  }

  public static stripScripts(html: string): string {
    return this.stripTags(html, /<script[^>]*>[^<>]*(<\/?script[^>]*>)?/gi);
  }

  public static stripStyles(html: string): string {
    return this.stripTags(html, /<style[^>]*>[^<>]*(<\/?style[^>]*>)?/gi);
  }

  private static stripTags(html: string, re: RegExp): string {
    if (!html) {
      return '';
    }
    return re.test(html) ? html.replace(re, '') : html;
  }
}
