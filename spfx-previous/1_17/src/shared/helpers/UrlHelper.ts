export default class UrlHelper {
  private static getUrlParts(url: string) {
    const a = document.createElement('a');
    a.href = url;

    return {
      href: a.href,
      host: a.host,
      hostname: a.hostname,
      port: a.port,
      pathname: a.pathname,
      protocol: a.protocol,
      hash: a.hash,
      search: a.search,
    };
  }

  public static getServerRelativeUrl(url: string) {
    return this.getUrlParts(url).pathname.replace(/\/+$/, '');
  }
}
