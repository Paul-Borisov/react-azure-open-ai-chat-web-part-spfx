using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    public bool? Shared { get; set; }

    public string? DisplayName { get; set; }

    public string? SharedWith { get; set; }
}
