using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;
using System.IdentityModel.Tokens.Jwt;

namespace ChatWebApi;

public class User {
  public string? Id { get; set; }
  public string? Name { get; set; }
  public string? UserPrincipalName { get; set; }
}

public static class ChatMessageEndpoints {
  private static bool checkUserPermissions = true;

  private static User? GetUser(HttpContext context) {
    try {
      string bearer = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "", StringComparison.InvariantCultureIgnoreCase);
      if( string.IsNullOrEmpty(bearer) ) return null;

      var handler = new JwtSecurityTokenHandler();
      var token = handler.ReadJwtToken(bearer);
      string? userId = token?.Claims?.Where(c => c.Type == "oid")?.FirstOrDefault()?.Value;
      string? name = token?.Claims?.Where(c => c.Type == "name")?.FirstOrDefault()?.Value;
      string? upn = token?.Claims?.Where(c => c.Type == "upn")?.FirstOrDefault()?.Value;
      return new User(){ Id = userId, Name = name, UserPrincipalName = upn };
    } catch {
      return null;
    }
  }

  private static void CheckUserPermissions(string userName, HttpContext context, string? operation = null) {
    if (!checkUserPermissions) return;

    var user = GetUser(context); string? userId = user?.Id;
    if (userId == null || userName != userId) {
      throw new InvalidOperationException(string.Format("{0} data of another user is not allowed", operation ?? "Unauthorized access to"));
    }
  }

  public static void MapChatMessageEndpoints(this IEndpointRouteBuilder routes, bool checkUserPermissions) {
    var group = routes.MapGroup("/api/ChatMessage").WithTags(nameof(ChatMessage));
    ChatMessageEndpoints.checkUserPermissions = checkUserPermissions;

    group.MapGet("/list/{username}", async (string username, DataContext db, HttpContext context) => {
      CheckUserPermissions(username, context);
      return await db.ChatMessages.Where(r => r.Username == username && r.Enabled == true).OrderByDescending(r => r.Created).ToListAsync();
    })
    .WithName("ListChatMessagesByUsername")
    .WithOpenApi();

    group.MapGet("/deleted/{username}", async (string username, DataContext db, HttpContext context) => {
      CheckUserPermissions(username, context);
      return await db.ChatMessages.Where(model => model.Username == username && model.Enabled != true).OrderByDescending(r => r.Created).ToListAsync();
    })
    .WithName("ListDeletedChatMessagesByUsername")
    .WithOpenApi();

    group.MapGet("/list/shared", async (DataContext db, HttpContext context) => {
      if (checkUserPermissions) {
        var userId = GetUser(context)?.Id;
        return await db.ChatMessages.Where(r => r.Enabled == true && r.Shared == true
          && (r.SharedWith == null || r.Username == userId || (userId != null && r.SharedWith.Contains(userId))) ).OrderByDescending(r => r.Created).ToListAsync();
      } else {
        return await db.ChatMessages.Where(r => r.Enabled == true && r.Shared == true ).OrderByDescending(r => r.Created).ToListAsync();
      }
    })
    .WithName("ListSharedChatMessages")
    .WithOpenApi();

    group.MapPost("/", async (ChatMessage chatMessage, DataContext db, HttpContext context) => {
      if (checkUserPermissions) {
        var user = GetUser(context);
        chatMessage.Username = user?.Id;
        if (chatMessage.DisplayName == null) chatMessage.DisplayName = user?.Name;
      }
      if (chatMessage.Created == null) chatMessage.Created = DateTime.Now.ToUniversalTime();
      if (chatMessage.Modified == null) chatMessage.Modified = DateTime.Now.ToUniversalTime();
      if (chatMessage.Enabled == null) chatMessage.Enabled = true;
      if (chatMessage.DisplayName == "") chatMessage.DisplayName = null;
      //if (chatMessage.Shared == null) chatMessage.Shared = false; // Should be NULL if the chat was never shared after its creation

      db.ChatMessages.Add(chatMessage);
      await db.SaveChangesAsync();
      return TypedResults.Created($"/api/ChatMessage/{chatMessage.Id}", chatMessage);
    })
    .WithName("CreateChatMessage")
    .WithOpenApi();

    group.MapPut("/{id}", async Task<Results<Ok, NotFound>> (Guid id, ChatMessage chatMessage, DataContext db, HttpContext context) => {
      var row = db.ChatMessages.Find(id);
      if (row == null) return TypedResults.NotFound();

      CheckUserPermissions(row.Username ?? "", context);

      var modified = chatMessage.Message != null 
        ? (chatMessage.Modified == null ? DateTime.Now : chatMessage.Modified)
        : (chatMessage.Modified == null ? row.Modified : chatMessage.Modified);

      var sharedWith = chatMessage.SharedWith == null ? row.SharedWith : chatMessage.SharedWith == string.Empty ? null : chatMessage.SharedWith;

      var affected = await db.ChatMessages
          .Where(model => model.Id == id)
          .ExecuteUpdateAsync(setters => setters
            //.SetProperty(m => m.Id, chatMessage.Id)
            .SetProperty(m => m.Name, chatMessage.Name ?? row.Name)
            .SetProperty(m => m.Username, row.Username)
            .SetProperty(m => m.Message, chatMessage.Message ?? row.Message)
            .SetProperty(m => m.Created, chatMessage.Created ?? row.Created)
            .SetProperty(m => m.Modified, modified) // DateTime.Now.ToUniversalTime() is not accepted here (and no need)
            .SetProperty(m => m.Enabled, chatMessage.Enabled ?? row.Enabled)
            .SetProperty(m => m.Shared, chatMessage.Shared ?? row.Shared)
            .SetProperty(m => m.DisplayName, chatMessage.DisplayName == "" ? null : row.DisplayName)
            .SetProperty(m => m.SharedWith, sharedWith)
          );

      return affected == 1 ? TypedResults.Ok() : TypedResults.NotFound();
    })
    .WithName("UpdateChatMessage")
    .WithOpenApi();

    group.MapDelete("/{id}", async Task<Results<Ok, NotFound>> (Guid id, DataContext db, HttpContext context) => {
      var row = db.ChatMessages.Find(id);
      if( row == null ) return TypedResults.NotFound();

      CheckUserPermissions(row.Username ?? "", context);

      row.Enabled = false;
      row.Modified = DateTime.Now.ToUniversalTime();
      db.ChatMessages.Attach(row);
      db.Entry(row).State = EntityState.Modified;
      var affected = await db.SaveChangesAsync();

      return affected == 1 ? TypedResults.Ok() : TypedResults.NotFound();
    })
    .WithName("DeleteChatMessage")
    .WithOpenApi();
  }
}
