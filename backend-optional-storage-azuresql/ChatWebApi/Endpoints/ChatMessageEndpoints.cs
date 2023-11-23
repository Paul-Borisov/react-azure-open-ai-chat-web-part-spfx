using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ChatWebApi;

public static class ChatMessageEndpoints {
  public static void MapChatMessageEndpoints(this IEndpointRouteBuilder routes) {
    var group = routes.MapGroup("/api/ChatMessage").WithTags(nameof(ChatMessage));

    group.MapGet("/", async (DataContext db) => {
      return await db.ChatMessages.OrderByDescending(r => r.Created).ToListAsync();
    })
    .WithName("GetAllChatMessages")
    .WithOpenApi();
    
    group.MapGet("/{id}", async Task<Results<Ok<ChatMessage>, NotFound>> (Guid id, DataContext db) => {
      return await db.ChatMessages.AsNoTracking()
          .FirstOrDefaultAsync(model => model.Id == id)
          is ChatMessage model
              ? TypedResults.Ok(model)
              : TypedResults.NotFound();
    })
    .WithName("GetChatMessageById")
    .WithOpenApi();

    group.MapGet("/list/{username}", async (string username, DataContext db) => {
      return await db.ChatMessages.Where(r => r.Username == username && r.Enabled == true).OrderByDescending(r => r.Created).ToListAsync();
    })
    .WithName("ListChatMessagesByUsername")
    .WithOpenApi();

    group.MapGet("/deleted/{username}", async (string username, DataContext db) => {
      return await db.ChatMessages.Where(model => model.Username == username && model.Enabled != true).OrderByDescending(r => r.Created).ToListAsync();
    })
    .WithName("ListDeletedChatMessagesByUsername")
    .WithOpenApi();

    group.MapPost("/", async (ChatMessage chatMessage, DataContext db) => {
      if (chatMessage.Created == null) chatMessage.Created = DateTime.Now.ToUniversalTime();
      if (chatMessage.Modified == null) chatMessage.Modified = DateTime.Now.ToUniversalTime();
      if (chatMessage.Enabled == null) chatMessage.Enabled = true;

      db.ChatMessages.Add(chatMessage);
      await db.SaveChangesAsync();
      return TypedResults.Created($"/api/ChatMessage/{chatMessage.Id}", chatMessage);
    })
    .WithName("CreateChatMessage")
    .WithOpenApi();

    group.MapPut("/{id}", async Task<Results<Ok, NotFound>> (Guid id, ChatMessage chatMessage, DataContext db) => {
      var row = db.ChatMessages.Find(id);
      if (row == null) return TypedResults.NotFound();

      var affected = await db.ChatMessages
          .Where(model => model.Id == id)
          .ExecuteUpdateAsync(setters => setters
            //.SetProperty(m => m.Id, chatMessage.Id)
            .SetProperty(m => m.Name, chatMessage.Name ?? row.Name)
            .SetProperty(m => m.Username, chatMessage.Username ?? row.Username)
            .SetProperty(m => m.Message, chatMessage.Message ?? row.Message)
            .SetProperty(m => m.Created, chatMessage.Created ?? row.Created)
            .SetProperty(m => m.Modified, chatMessage.Message != null ? DateTime.Now : row.Modified) // DateTime.Now.ToUniversalTime() is not accepted here (and no need)
            .SetProperty(m => m.Enabled, chatMessage.Enabled ?? row.Enabled)
          );

      return affected == 1 ? TypedResults.Ok() : TypedResults.NotFound();
    })
    .WithName("UpdateChatMessage")
    .WithOpenApi();

    group.MapDelete("/{id}", async Task<Results<Ok, NotFound>> (Guid id, DataContext db) => {
      var row = db.ChatMessages.Find(id);
      if( row == null ) return TypedResults.NotFound();

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
