using Microsoft.EntityFrameworkCore;

namespace ChatWebApi;

public partial class DataContext : DbContext {
  public DataContext(DbContextOptions<DataContext> options) : base(options) { }

  public virtual DbSet<ChatMessage> ChatMessages { get; set; }

  /*protected override void OnModelCreating(ModelBuilder modelBuilder) {
    modelBuilder.Entity<ChatMessage>(entity => {
      entity.HasIndex(e => e.Name, "IX_ChatMessages_name");

      entity.HasIndex(e => e.Username, "IX_ChatMessages_username");

      entity.HasIndex(e => e.created, "IX_ChatMessages_created");

      entity.HasIndex(e => e.enabled, "IX_ChatMessages_enabled");

      entity.HasIndex(e => e.modified, "IX_ChatMessages_modified");

      entity.HasIndex(e => e.sharedwith, "IX_ChatMessages_sharedwith");

      entity.Property(e => e.Id)
          .ValueGeneratedNever()
          .HasColumnName("id");
      entity.Property(e => e.Name)
          .HasMaxLength(255)
          .HasColumnName("name");
      entity.Property(e => e.Username)
          .HasMaxLength(36)
          .HasColumnName("username");
      entity.Property(e => e.Message).HasColumnName("message");
      entity.Property(e => e.Created)
          .HasDefaultValueSql("(getdate())")
          .HasColumnType("datetime")
          .HasColumnName("created");
      entity.Property(e => e.Modified)
          .HasDefaultValueSql("(getdate())")
          .HasColumnType("datetime")
          .HasColumnName("modified");
      entity.Property(e => e.Enabled)
          .HasDefaultValueSql("((1))")
          .HasColumnName("enabled");
      entity.Property(e => e.Shared)
          .HasDefaultValueSql("((0))")
          .HasColumnName("shared");
      entity.Property(e => e.DisplayName) // Not in use, kept for convenience
          .HasMaxLength(50)
          .HasColumnName("displayname");
      entity.Property(e => e.SharedWith)
          .HasMaxLength(555)
          .HasColumnName("sharedwith");
    });

    OnModelCreatingPartial(modelBuilder);
  }

  partial void OnModelCreatingPartial(ModelBuilder modelBuilder);*/
}
