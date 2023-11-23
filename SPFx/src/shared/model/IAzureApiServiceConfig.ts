export interface IAzureApiServiceConfig {
  //appId: Default is dfa12615-1c04-43ff-b004-8dda0d32d3e6 - openai Azure App,
  //which has the permission user_impersonate defined in WorkplaceByMetaWebparts\config\package-solution.json
  appId?: string;
  endpointBaseUrl?: string;
  endpointBaseUrl4?: string;
  endpointBaseUrlForWebApi?: string;
  apiKey?: string;
  isDisabled?: boolean;
}
