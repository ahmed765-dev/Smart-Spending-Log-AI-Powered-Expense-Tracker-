import { DotNetCodeFile, PipelineExecutionStep } from '../types';

export const DOTNET_CONCEPTS: Record<string, { title: string; description: string; docsUrl?: string }> = {
  DependencyInjection: {
    title: 'Dependency Injection (DI)',
    description: 'A software design pattern used to achieve Inversion of Control (IoC) between classes and their dependencies. ASP.NET Core has built-in support for DI using AddScoped, AddSingleton, and AddTransient.',
  },
  EFCore: {
    title: 'Entity Framework Core (EF Core)',
    description: 'An open-source, lightweight, extensible object-relational mapper (ORM) for .NET. It lets developers work with a database using C# object entities instead of raw SQL queries.',
  },
  LINQ: {
    title: 'Language Integrated Query (LINQ)',
    description: 'A powerful C# feature that provides structured data querying capabilities directly inside C# code for collections, arrays, SQL databases via EF Core, and XML.',
  },
  AsyncAwait: {
    title: 'Async / Await Pattern',
    description: 'Non-blocking asynchronous programming keywords in C# using Task and Task<T>. Allows ASP.NET Web API controllers to handle high concurrency without blocking server threads.',
  },
  DTO: {
    title: 'Data Transfer Objects (DTOs)',
    description: 'Objects used to transfer data between software subsystems (e.g. HTTP Request body -> Controller -> Service). Prevents exposing database domain entity internals directly to client consumers.',
  },
  Controllers: {
    title: 'ASP.NET Core Web API Controllers',
    description: 'Classes derived from ControllerBase equipped with [ApiController] and [Route] attributes to map incoming HTTP requests (GET, POST, PUT, DELETE) to C# action methods.',
  },
  MLNet: {
    title: 'ML.NET & Prediction Engine',
    description: 'Microsoft\'s open-source machine learning framework for .NET. Allows embedding custom ML models (TF-IDF, Multiclass Classification) directly in C# apps without Python dependencies.',
  },
};

export const DOTNET_CODE_FILES: DotNetCodeFile[] = [
  {
    id: 'program-cs',
    filename: 'Program.cs',
    filepath: 'SmartSpendingApi/Program.cs',
    language: 'csharp',
    title: 'ASP.NET Core Host & Dependency Injection Container',
    conceptBadge: 'Program.cs / DI',
    description: 'Configures the web application builder, registers services into the DI container, sets up EF Core SQLite, and configures HTTP request pipeline middleware.',
    code: `var builder = WebApplication.CreateBuilder(args);

// 1. Add ASP.NET Core Controllers and OpenAPI/Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Register Entity Framework Core DbContext (SQLite database)
builder.Services.AddDbContext<ExpenseDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=expenses.db"));

// 3. Register Machine Learning Category Prediction Engine as Singleton
builder.Services.AddSingleton<IPredictionService, MLPredictionService>();

// 4. Configure CORS for React Front-End
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// 5. Middleware Pipeline Setup
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();

// 6. Map API Route Endpoints
app.MapControllers();

app.Run();`,
    lineAnnotations: {
      1: {
        title: 'WebApplication Builder',
        explanation: 'Initializes the WebApplicationBuilder which sets up configuration sources (appsettings.json, environment variables), logging, and service collection.',
        conceptKey: 'Controllers'
      },
      4: {
        title: 'AddControllers()',
        explanation: 'Registers controller services into the Dependency Injection container enabling MVC/Web API routing.',
        conceptKey: 'Controllers'
      },
      9: {
        title: 'EF Core DbContext Registration',
        explanation: 'Registers ExpenseDbContext with Scoped lifetime. Scoped services are created once per HTTP request and disposed when the request finishes.',
        conceptKey: 'EFCore'
      },
      14: {
        title: 'Singleton IPredictionService',
        explanation: 'Registers MLPredictionService as a Singleton. Singleton services are created once for the entire application lifetime, keeping the ML model loaded in RAM for fast sub-millisecond predictions.',
        conceptKey: 'DependencyInjection'
      },
      28: {
        title: 'Middleware Execution Order',
        explanation: 'ASP.NET Core request pipeline executes middleware in sequence: Developer Exception / Swagger -> HTTPS Redirection -> CORS -> Auth -> Controller Routing.',
        conceptKey: 'Controllers'
      },
      36: {
        title: 'MapControllers()',
        explanation: 'Uses attribute routing from [Route] attributes defined inside ApiController classes to route requests to methods.',
        conceptKey: 'Controllers'
      }
    }
  },
  {
    id: 'transaction-cs',
    filename: 'Transaction.cs',
    filepath: 'SmartSpendingApi/Models/Transaction.cs',
    language: 'csharp',
    title: 'Domain Model (Entity Class)',
    conceptBadge: 'C# Entity / EF Core',
    description: 'Represents the Transaction table schema in the database. Uses C# properties with DataAnnotations for validation and DB mapping.',
    code: `using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSpendingApi.Models;

[Table("Transactions")]
public class Transaction
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 100000.00)]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(50)]
    public string PredictedCategory { get; set; } = string.Empty;

    public bool IsManuallyCorrected { get; set; } = false;

    public float ConfidenceScore { get; set; }

    public string? Merchant { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign Key to Category
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
}`,
    lineAnnotations: {
      6: {
        title: '[Table("Transactions")] Attribute',
        explanation: 'Directs EF Core to map this class to the "Transactions" database table.',
        conceptKey: 'EFCore'
      },
      8: {
        title: '[Key] & DatabaseGenerated',
        explanation: 'Marks Id as the Primary Key and instructs SQLite/SQL Server to automatically generate auto-incrementing integer IDs.',
        conceptKey: 'EFCore'
      },
      17: {
        title: 'Decimal Precision Data Type',
        explanation: 'Specifies decimal(18,2) column type in SQL to avoid floating-point rounding errors when dealing with financial amounts.',
        conceptKey: 'EFCore'
      },
      28: {
        title: 'Nullable Properties in C#',
        explanation: 'The question mark (string?, Category?) denotes nullable reference types in C# 8+, indicating these properties can store null.',
        conceptKey: 'EFCore'
      }
    }
  },
  {
    id: 'dbcontext-cs',
    filename: 'ExpenseDbContext.cs',
    filepath: 'SmartSpendingApi/Data/ExpenseDbContext.cs',
    language: 'csharp',
    title: 'Entity Framework Core DbContext',
    conceptBadge: 'EF Core DbContext',
    description: 'The session with the database. Exposes DbSet<T> properties representing database tables and configures entity mappings.',
    code: `using Microsoft.EntityFrameworkCore;
using SmartSpendingApi.Models;

namespace SmartSpendingApi.Data;

public class ExpenseDbContext : DbContext
{
    public ExpenseDbContext(DbContextOptions<ExpenseDbContext> options)
        : base(options)
    {
    }

    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed initial categories
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Dining Out", BudgetLimit = 400.00m },
            new Category { Id = 2, Name = "Groceries", BudgetLimit = 600.00m },
            new Category { Id = 3, Name = "Utilities", BudgetLimit = 300.00m },
            new Category { Id = 4, Name = "Transport", BudgetLimit = 200.00m },
            new Category { Id = 5, Name = "Entertainment", BudgetLimit = 250.00m }
        );

        // Indexes for performance
        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.CreatedAt);
    }
}`,
    lineAnnotations: {
      6: {
        title: 'DbContext Inheritance',
        explanation: 'ExpenseDbContext inherits from Microsoft.EntityFrameworkCore.DbContext, providing Change Tracker, Query Translation, and Connection Management.',
        conceptKey: 'EFCore'
      },
      13: {
        title: 'DbSet<T> Collections',
        explanation: 'DbSet<Transaction> allows querying and saving Transaction records via LINQ methods (e.g. _context.Transactions.Where(...)).',
        conceptKey: 'EFCore'
      },
      16: {
        title: 'OnModelCreating Fluent API',
        explanation: 'Used to configure advanced database relationships, data seeding, and custom indexes using EF Core\'s Fluent API.',
        conceptKey: 'EFCore'
      }
    }
  },
  {
    id: 'controller-cs',
    filename: 'TransactionsController.cs',
    filepath: 'SmartSpendingApi/Controllers/TransactionsController.cs',
    language: 'csharp',
    title: 'RESTful API Controller',
    conceptBadge: 'ASP.NET Core Web API',
    description: 'Handles HTTP endpoints for creating, retrieving, and updating expenses. Demonstrates Dependency Injection, DTO mapping, LINQ, and Async/Await.',
    code: `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartSpendingApi.Data;
using SmartSpendingApi.Dtos;
using SmartSpendingApi.Models;
using SmartSpendingApi.Services;

namespace SmartSpendingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ExpenseDbContext _context;
    private readonly IPredictionService _mlService;
    private readonly ILogger<TransactionsController> _logger;

    // Dependency Injection via Constructor
    public TransactionsController(
        ExpenseDbContext context, 
        IPredictionService mlService,
        ILogger<TransactionsController> logger)
    {
        _context = context;
        _mlService = mlService;
        _logger = logger;
    }

    // POST: api/transactions
    [HttpPost]
    public async Task<ActionResult<TransactionResponseDto>> LogExpense(
        [FromBody] CreateTransactionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // 1. Run Machine Learning Prediction Engine
        var prediction = await _mlService.PredictCategoryAsync(dto.Description, dto.Amount);

        // 2. Map DTO to Domain Entity
        var transaction = new Transaction
        {
            Description = dto.Description,
            Amount = dto.Amount,
            PredictedCategory = prediction.Category,
            ConfidenceScore = prediction.Confidence,
            CreatedAt = DateTime.UtcNow
        };

        // 3. Save to SQL Database asynchronously via EF Core
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Logged transaction #{Id} as {Category}", 
            transaction.Id, transaction.PredictedCategory);

        return CreatedAtAction(
            nameof(GetTransactionById), 
            new { id = transaction.Id }, 
            transaction);
    }

    // GET: api/transactions
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions(
        [FromQuery] string? category, [FromQuery] int page = 1)
    {
        IQueryable<Transaction> query = _context.Transactions
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(t => t.PredictedCategory == category);
        }

        var results = await query
            .Skip((page - 1) * 20)
            .Take(20)
            .ToListAsync();

        return Ok(results);
    }
}`,
    lineAnnotations: {
      9: {
        title: '[ApiController] & [Route]',
        explanation: 'Enables automatic model validation errors (400 Bad Request) and sets up the base URL route to "api/transactions".',
        conceptKey: 'Controllers'
      },
      18: {
        title: 'Constructor Dependency Injection',
        explanation: 'ASP.NET Core automatically injects ExpenseDbContext, IPredictionService, and ILogger when creating a controller instance per request.',
        conceptKey: 'DependencyInjection'
      },
      30: {
        title: '[FromBody] Parameter Binding',
        explanation: 'Binds the incoming JSON HTTP request payload to the CreateTransactionDto object and validates its attributes.',
        conceptKey: 'DTO'
      },
      38: {
        title: 'ML Prediction Service Call',
        explanation: 'Calls the injected prediction engine asynchronously to obtain AI category classification and confidence score.',
        conceptKey: 'MLNet'
      },
      52: {
        title: 'EF Core Async Save',
        explanation: 'SaveChangesAsync() generates an INSERT INTO SQL statement and sends it to the database asynchronously, releasing the ASP.NET thread to handle other traffic.',
        conceptKey: 'AsyncAwait'
      },
      68: {
        title: 'LINQ Queryable & AsNoTracking()',
        explanation: 'AsNoTracking() optimizes read-only queries by turning off EF Core change tracking overhead. Deferred execution builds the SQL query before execution.',
        conceptKey: 'LINQ'
      }
    }
  },
  {
    id: 'prediction-service-cs',
    filename: 'MLPredictionService.cs',
    filepath: 'SmartSpendingApi/Services/MLPredictionService.cs',
    language: 'csharp',
    title: 'ML.NET Machine Learning Service',
    conceptBadge: 'ML.NET / C# AI',
    description: 'Implements the IPredictionService interface. Loads the trained ML.NET zip pipeline and produces category predictions with confidence scores.',
    code: `using Microsoft.ML;
using Microsoft.ML.Data;

namespace SmartSpendingApi.Services;

public class TransactionData
{
    public string Description { get; set; } = string.Empty;
    public float Amount { get; set; }
}

public class CategoryPrediction
{
    [ColumnName("PredictedLabel")]
    public string Category { get; set; } = string.Empty;

    public float[] Score { get; set; } = Array.Empty<float>();
}

public class MLPredictionService : IPredictionService
{
    private readonly MLContext _mlContext;
    private readonly PredictionEngine<TransactionData, CategoryPrediction> _predictionEngine;

    public MLPredictionService()
    {
        _mlContext = new MLContext(seed: 42);

        // Load pre-trained ML.NET model pipeline from model.zip asset
        string modelPath = Path.Combine(AppContext.BaseDirectory, "MLModels", "model.zip");
        ITransformer trainedModel = _mlContext.Model.Load(modelPath, out _);

        // Create thread-safe PredictionEngine pool
        _predictionEngine = _mlContext.Model.CreatePredictionEngine<TransactionData, CategoryPrediction>(trainedModel);
    }

    public Task<(string Category, float Confidence)> PredictCategoryAsync(string description, decimal amount)
    {
        var input = new TransactionData
        {
            Description = description,
            Amount = (float)amount
        };

        lock (_predictionEngine)
        {
            var result = _predictionEngine.Predict(input);
            float maxConfidence = result.Score.Length > 0 ? result.Score.Max() : 0.85f;
            return Task.FromResult((result.Category, maxConfidence));
        }
    }
}`,
    lineAnnotations: {
      18: {
        title: 'MLContext in ML.NET',
        explanation: 'MLContext is the starting point for all ML.NET operations (data loading, pipeline construction, training, evaluation, model persistence).',
        conceptKey: 'MLNet'
      },
      26: {
        title: 'Model Loading',
        explanation: 'Loads the compiled binary ML pipeline containing TF-IDF N-Gram tokenizers and LightGBM Multiclass Classifier.',
        conceptKey: 'MLNet'
      },
      38: {
        title: 'Fast Sub-Millisecond Prediction',
        explanation: 'PredictionEngine evaluates feature inputs against the ML model directly in RAM, achieving sub-millisecond classification response times.',
        conceptKey: 'MLNet'
      }
    }
  },
  {
    id: 'dtos-cs',
    filename: 'TransactionDtos.cs',
    filepath: 'SmartSpendingApi/Dtos/TransactionDtos.cs',
    language: 'csharp',
    title: 'Data Transfer Objects (DTOs)',
    conceptBadge: 'C# DTOs / Validation',
    description: 'DTOs encapsulate request payloads and response contracts, enforcing incoming validation rules with C# DataAnnotations.',
    code: `using System.ComponentModel.DataAnnotations;

namespace SmartSpendingApi.Dtos;

public record CreateTransactionDto(
    [Required(ErrorMessage = "Transaction description is required.")]
    [StringLength(150, MinimumLength = 3)]
    string Description,

    [Range(0.01, 50000.00, ErrorMessage = "Amount must be greater than $0.00.")]
    decimal Amount,

    string? ExplicitCategory
);

public record TransactionResponseDto(
    int Id,
    string Description,
    decimal Amount,
    string Category,
    float Confidence,
    DateTime CreatedAt
);`,
    lineAnnotations: {
      5: {
        title: 'C# Record Type',
        explanation: 'C# 9+ Record positional types provide immutable value semantics, concise syntax, and built-in equality comparison—ideal for DTOs.',
        conceptKey: 'DTO'
      },
      6: {
        title: 'Validation Attributes',
        explanation: '[Required], [StringLength], and [Range] attributes automatically run during ASP.NET Core model binding, returning HTTP 400 if validation fails.',
        conceptKey: 'DTO'
      }
    }
  }
];

export const PIPELINE_STEPS: PipelineExecutionStep[] = [
  {
    stepNumber: 1,
    stageName: 'Incoming HTTP Request',
    component: 'Client Browser / Postman',
    codeSnippet: 'POST /api/transactions\nContent-Type: application/json\n\n{ "description": "Starbucks Coffee", "amount": 5.50 }',
    lineHighlight: 1,
    description: 'The React front-end sends an HTTP POST request containing raw transaction JSON to the server endpoint.',
    csharpDetails: 'ASP.NET Core WebHost parses the raw TCP stream and extracts HTTP headers & JSON body content.'
  },
  {
    stepNumber: 2,
    stageName: 'Middleware Processing & CORS',
    component: 'Program.cs Middleware Pipeline',
    codeSnippet: 'app.UseHttpsRedirection();\napp.UseCors("AllowReactApp");\napp.UseAuthorization();\napp.MapControllers();',
    lineHighlight: 28,
    description: 'Middleware handles security checks, validates CORS headers, and routes the request URL to the correct Controller.',
    csharpDetails: 'Middleware delegates execution down the HTTP pipeline stack. If CORS fails, it short-circuits with HTTP 403.'
  },
  {
    stepNumber: 3,
    stageName: 'Controller Action & DTO Binding',
    component: 'TransactionsController.cs',
    codeSnippet: '[HttpPost]\npublic async Task<ActionResult<TransactionResponseDto>> LogExpense([FromBody] CreateTransactionDto dto)',
    lineHighlight: 27,
    description: 'The [ApiController] model binder parses the JSON payload into a C# CreateTransactionDto record and executes validation.',
    csharpDetails: 'If Description is missing or Amount <= 0, ASP.NET automatically returns HTTP 400 Bad Request with ValidationProblemDetails.'
  },
  {
    stepNumber: 4,
    stageName: 'ML.NET Category Prediction',
    component: 'MLPredictionService.cs',
    codeSnippet: 'var prediction = await _mlService.PredictCategoryAsync(dto.Description, dto.Amount);',
    lineHighlight: 38,
    description: 'The controller passes text to the injected ML.NET PredictionEngine which runs TF-IDF vectorization and classifies text as "Dining Out".',
    csharpDetails: 'ML.NET evaluates TF-IDF N-grams against the LightGBM classifier tree, producing a predicted category and 94.2% confidence score.'
  },
  {
    stepNumber: 5,
    stageName: 'Entity Mapping & EF Core Unit of Work',
    component: 'ExpenseDbContext.cs',
    codeSnippet: 'var transaction = new Transaction { ... };\n_context.Transactions.Add(transaction);\nawait _context.SaveChangesAsync();',
    lineHighlight: 52,
    description: 'The controller instantiates a Transaction entity and adds it to EF Core Change Tracker. SaveChangesAsync() generates SQL INSERT.',
    csharpDetails: 'EF Core converts entity state to SQL: "INSERT INTO Transactions (Description, Amount, PredictedCategory) VALUES (@p0, @p1, @p2)"'
  },
  {
    stepNumber: 6,
    stageName: 'HTTP 201 Created Response',
    component: 'TransactionsController.cs',
    codeSnippet: 'return CreatedAtAction(nameof(GetTransactionById), new { id = transaction.Id }, transaction);',
    lineHighlight: 58,
    description: 'The controller returns HTTP 201 Created status with Location header and JSON payload back to the client.',
    csharpDetails: 'Response includes HTTP Status 201 Created, new entity Id, predicted category, and confidence score.'
  }
];
