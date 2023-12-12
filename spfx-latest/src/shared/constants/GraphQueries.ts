import { IODataQuery } from 'shared/model/IODataQuery';

export default class GraphQueries {
  public static readonly myWorkingWithColleagues: IODataQuery = {
    version: 'v1.0',
    endpoint: '/me/people', // Permission: People.Read
    top: 2500,
    select: 'id,displayName,jobTitle,userPrincipalName,personType,imAddress',
    filter: "personType/class eq 'Person'",
  };
  public static readonly users: IODataQuery = {
    version: 'v1.0',
    top: 999,
    endpoint: '/users', // Permission: User.Read.All or Directory.Read.All (for future extensions)
    select: 'id,displayName,jobTitle,userPrincipalName,imAddresses',
    filter: "userType eq 'Member' and accountEnabled eq true",
  };
}
