using System.ComponentModel.DataAnnotations;

namespace ChatWebApi;

public partial class ChatMessage
{
    [Key]
    public Guid Id { get; set; }

    public string? Name { get; set; }

    public string? Username { get; set; }

    public string? Message { get; set; }

    public DateTime? Created { get; set; }

    public DateTime? Modified { get; set; }

    public bool? Enabled { get; set; }
}
