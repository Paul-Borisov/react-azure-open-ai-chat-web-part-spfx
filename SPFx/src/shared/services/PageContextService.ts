import { WebPartContext } from '@microsoft/sp-webpart-base';
import LogService from 'shared/services/LogService';

export default class PageContextService {
  private static instance: PageContextService = null;
  private context: WebPartContext = null;

  private constructor(context: WebPartContext) {
    this.context = context;
    LogService.verbose(null, 'Page context service initialised', context);
  }

  // Call this from any web part whose components will require
  // use of this service.
  public static init(webPartContext: WebPartContext): void {
    if (PageContextService.instance === null || !this.context.pageContext) {
      PageContextService.instance = new PageContextService(webPartContext);
    }
  }

  public static dispose(): void {
    PageContextService.instance = null;
  }

  public static get context(): WebPartContext {
    if (!this.instance) {
      throw new Error('Page context service has not been initialised');
    }
    return this.instance.context;
  }

  public static get pageContext(): any {
    if (!this.instance) {
      throw new Error('Page context service has not been initialised');
    }
    return this.instance.context && this.instance.context.pageContext;
  }

  public static get webUrlServerRelative(): string {
    const url: string =
      (PageContextService.context.pageContext && PageContextService.context.pageContext.web.serverRelativeUrl) || '';
    return PageContextService.trimTrailingSlash(url);
  }

  public static get siteUrlServerRelative(): string {
    const url: string =
      (PageContextService.context.pageContext && PageContextService.context.pageContext.site.serverRelativeUrl) || '';
    return PageContextService.trimTrailingSlash(url);
  }

  public static get webUrlAbsolute(): string {
    return (PageContextService.context.pageContext && PageContextService.context.pageContext.web.absoluteUrl) || '';
  }

  public static get siteUrlAbsolute(): string {
    return (PageContextService.context.pageContext && PageContextService.context.pageContext.site.absoluteUrl) || '';
  }

  public static get user(): any {
    return PageContextService.context.pageContext ? PageContextService.context.pageContext.user : {};
  }

  public static get siteLocale(): string {
    return PageContextService.context.pageContext.cultureInfo.currentCultureName;
  }

  public static get userLocale(): string {
    return PageContextService.context.pageContext.cultureInfo.currentUICultureName;
  }

  private static trimTrailingSlash(url: string): string {
    // Ensure url doesn't end with a slash, e.g. when at root site collection
    if (url) {
      const indexOfFinalChar: number = url.length - 1;
      if (url[indexOfFinalChar] === '/') {
        url = url.substr(0, indexOfFinalChar);
      }
    }
    return url;
  }
}
