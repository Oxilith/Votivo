# Internationalization Implementation Guide for DDD-Based .NET + React Applications

## Overview
This document provides comprehensive instructions for implementing internationalization (i18n) in applications following Domain-Driven Design principles with .NET backend and React frontend.

## Architecture Principles

### Frontend-First Approach
- **Primary responsibility**: Frontend (React) handles 90% of user-facing translations
- **Backend responsibility**: Domain-specific messages, server-generated content, email templates
- **Separation of concerns**: Translation logic separated from business logic

### Key Decision: Translation Keys vs. Translated Text
- **Backend returns**: Translation keys (e.g., `"error.user.notFound"`)
- **Frontend resolves**: Actual translated text based on user's language
- **Benefits**:
    - Decoupled presentation from business logic
    - Frontend controls all UI text
    - Easier to add new languages without backend changes

## Frontend Implementation (React)

### Technology Stack
**Primary Library**: react-i18next (based on i18next)

**Installation**:
```bash
npm install react-i18next i18next i18next-http-backend i18next-browser-languagedetector
```

### Project Structure
```
src/
├── i18n/
│   ├── config.ts              # i18next configuration
│   ├── resources/
│   │   ├── en/
│   │   │   ├── common.json    # Shared translations
│   │   │   ├── validation.json
│   │   │   ├── errors.json
│   │   │   └── domain.json    # Domain-specific terms
│   │   └── pl/
│   │       ├── common.json
│   │       ├── validation.json
│   │       ├── errors.json
│   │       └── domain.json
│   └── types.ts               # TypeScript types for translations
```

### Configuration Template
```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend) // Load translations via HTTP
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'pl'],
    defaultNS: 'common',
    ns: ['common', 'validation', 'errors', 'domain'],
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

### Translation File Structure
```json
// src/i18n/resources/en/common.json
{
  "nav": {
    "home": "Home",
    "profile": "Profile",
    "settings": "Settings"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm"
  },
  "messages": {
    "loading": "Loading...",
    "noData": "No data available"
  }
}

// src/i18n/resources/en/errors.json
{
  "error": {
    "user": {
      "notFound": "User not found",
      "unauthorized": "You are not authorized to perform this action",
      "emailAlreadyExists": "This email address is already in use"
    },
    "validation": {
      "required": "This field is required",
      "invalidEmail": "Please enter a valid email address",
      "minLength": "Minimum length is {{min}} characters",
      "maxLength": "Maximum length is {{max}} characters"
    },
    "server": {
      "unknown": "An unexpected error occurred. Please try again later."
    }
  }
}

// src/i18n/resources/en/domain.json
{
  "order": {
    "status": {
      "pending": "Pending",
      "confirmed": "Confirmed",
      "shipped": "Shipped",
      "delivered": "Delivered",
      "cancelled": "Cancelled"
    }
  },
  "payment": {
    "method": {
      "creditCard": "Credit Card",
      "bankTransfer": "Bank Transfer",
      "paypal": "PayPal"
    }
  }
}
```

### Usage in React Components
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation(['common', 'errors']);
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <h1>{t('common:nav.home')}</h1>
      <button onClick={() => changeLanguage('pl')}>Polski</button>
      <button onClick={() => changeLanguage('en')}>English</button>
      
      {/* With interpolation */}
      <p>{t('errors:error.validation.minLength', { min: 5 })}</p>
    </div>
  );
}
```

### Handling Backend Error Keys
```typescript
// src/utils/errorTranslation.ts
import i18n from '../i18n/config';

export function translateBackendError(errorKey: string, params?: Record<string, any>): string {
  // Backend returns: "error.user.notFound"
  // Frontend translates: errors:error.user.notFound
  return i18n.t(`errors:${errorKey}`, params);
}

// Usage in error handling
try {
  await api.createUser(userData);
} catch (error) {
  const errorMessage = translateBackendError(error.response.data.errorKey);
  showNotification(errorMessage);
}
```

## Backend Implementation (.NET)

### Layer-by-Layer Approach

#### 1. Domain Layer
**Principle**: Domain layer should remain language-agnostic. Use error codes or keys instead of text.

```csharp
// Domain/Errors/DomainError.cs
public sealed class DomainError
{
    public string Code { get; }
    public string? Detail { get; }
    
    private DomainError(string code, string? detail = null)
    {
        Code = code;
        Detail = detail;
    }
    
    public static DomainError UserNotFound => new("error.user.notFound");
    public static DomainError EmailAlreadyExists => new("error.user.emailAlreadyExists");
    public static DomainError ValidationFailed(string field) => 
        new("error.validation.failed", field);
}
```

#### 2. Application Layer
**Responsibility**: Handle localization for server-side operations (emails, PDFs, logs).

**Installation**:
```bash
dotnet add package Microsoft.Extensions.Localization
```

**Structure**:
```
Application/
├── Common/
│   ├── Interfaces/
│   │   └── ILocalizationService.cs
│   └── Resources/
│       ├── Messages.resx           # Default (English)
│       └── Messages.pl.resx        # Polish
├── Commands/
└── Queries/
```

**Service Interface**:
```csharp
// Application/Common/Interfaces/ILocalizationService.cs
public interface ILocalizationService
{
    string GetString(string key);
    string GetString(string key, params object[] arguments);
    string GetString(string key, CultureInfo culture, params object[] arguments);
}
```

**Use Cases**:
```csharp
// Application/Commands/Users/CreateUserCommandHandler.cs
public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Result<Guid>>
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly ILocalizationService _localization;
    
    public async Task<Result<Guid>> Handle(CreateUserCommand request, CancellationToken ct)
    {
        // Domain validation returns error codes
        if (await _userRepository.EmailExistsAsync(request.Email, ct))
        {
            return Result.Failure<Guid>(DomainError.EmailAlreadyExists);
        }
        
        var user = User.Create(request.Email, request.Name);
        await _userRepository.AddAsync(user, ct);
        
        // Localization for server-side operations (email)
        var emailSubject = _localization.GetString("Email.Welcome.Subject");
        var emailBody = _localization.GetString("Email.Welcome.Body", user.Name);
        
        await _emailService.SendAsync(user.Email, emailSubject, emailBody, ct);
        
        return Result.Success(user.Id);
    }
}
```

**Resource Files**:
```xml
<!-- Application/Common/Resources/Messages.resx -->
<data name="Email.Welcome.Subject" xml:space="preserve">
  <value>Welcome to Our Platform</value>
</data>
<data name="Email.Welcome.Body" xml:space="preserve">
  <value>Hello {0}, welcome to our platform! We're excited to have you here.</value>
</data>

<!-- Application/Common/Resources/Messages.pl.resx -->
<data name="Email.Welcome.Subject" xml:space="preserve">
  <value>Witaj na naszej platformie</value>
</data>
<data name="Email.Welcome.Body" xml:space="preserve">
  <value>Cześć {0}, witaj na naszej platformie! Cieszymy się, że jesteś z nami.</value>
</data>
```

#### 3. Infrastructure Layer
**Implementation of Localization Service**:

```csharp
// Infrastructure/Localization/LocalizationService.cs
public class LocalizationService : ILocalizationService
{
    private readonly IStringLocalizer<Messages> _localizer;
    
    public LocalizationService(IStringLocalizer<Messages> localizer)
    {
        _localizer = localizer;
    }
    
    public string GetString(string key)
    {
        return _localizer[key];
    }
    
    public string GetString(string key, params object[] arguments)
    {
        return _localizer[key, arguments];
    }
    
    public string GetString(string key, CultureInfo culture, params object[] arguments)
    {
        var currentCulture = CultureInfo.CurrentCulture;
        var currentUICulture = CultureInfo.CurrentUICulture;
        
        try
        {
            CultureInfo.CurrentCulture = culture;
            CultureInfo.CurrentUICulture = culture;
            
            return _localizer[key, arguments];
        }
        finally
        {
            CultureInfo.CurrentCulture = currentCulture;
            CultureInfo.CurrentUICulture = currentUICulture;
        }
    }
}
```

**Dependency Injection Setup**:
```csharp
// Infrastructure/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddLocalization(options => options.ResourcesPath = "Resources");
        services.AddScoped<ILocalizationService, LocalizationService>();
        
        return services;
    }
}
```

#### 4. Presentation Layer (Web API)
**Middleware for Culture Detection**:

```csharp
// Presentation/Middleware/CultureMiddleware.cs
public class CultureMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string[] _supportedCultures = { "en", "pl" };
    
    public CultureMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var culture = GetCultureFromRequest(context);
        
        if (!string.IsNullOrEmpty(culture) && _supportedCultures.Contains(culture))
        {
            var cultureInfo = new CultureInfo(culture);
            CultureInfo.CurrentCulture = cultureInfo;
            CultureInfo.CurrentUICulture = cultureInfo;
        }
        
        await _next(context);
    }
    
    private string? GetCultureFromRequest(HttpContext context)
    {
        // Priority: Header -> Query -> Cookie
        if (context.Request.Headers.TryGetValue("Accept-Language", out var headerValue))
        {
            return headerValue.ToString().Split(',').First().Split('-').First();
        }
        
        if (context.Request.Query.TryGetValue("lang", out var queryValue))
        {
            return queryValue.ToString();
        }
        
        if (context.Request.Cookies.TryGetValue("language", out var cookieValue))
        {
            return cookieValue;
        }
        
        return null;
    }
}
```

**API Response Structure**:
```csharp
// Presentation/Common/ApiResponse.cs
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? ErrorCode { get; set; }  // Translation key for frontend
    public Dictionary<string, object>? ErrorParams { get; set; }  // Parameters for interpolation
    
    public static ApiResponse<T> SuccessResponse(T data) => new()
    {
        Success = true,
        Data = data
    };
    
    public static ApiResponse<T> ErrorResponse(string errorCode, Dictionary<string, object>? parameters = null) => new()
    {
        Success = false,
        ErrorCode = errorCode,
        ErrorParams = parameters
    };
}

// Usage in controller
[HttpPost]
public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser(CreateUserCommand command)
{
    var result = await Mediator.Send(command);
    
    if (result.IsFailure)
    {
        return BadRequest(ApiResponse<UserDto>.ErrorResponse(result.Error.Code));
    }
    
    return Ok(ApiResponse<UserDto>.SuccessResponse(result.Value));
}
```

**Program.cs Configuration**:
```csharp
var builder = WebApplication.CreateBuilder(args);

// Add localization
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { new CultureInfo("en"), new CultureInfo("pl") };
    options.DefaultRequestCulture = new RequestCulture("en");
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;
});

var app = builder.Build();

// Use middleware
app.UseMiddleware<CultureMiddleware>();
app.UseRequestLocalization();
```

## Advanced Patterns

### 1. Translation Dictionary Endpoint
For shared enums and domain values:

```csharp
// Application/Queries/GetTranslationDictionary/GetTranslationDictionaryQuery.cs
public record GetTranslationDictionaryQuery(string Language) : IRequest<Dictionary<string, object>>;

public class GetTranslationDictionaryQueryHandler 
    : IRequestHandler<GetTranslationDictionaryQuery, Dictionary<string, object>>
{
    private readonly ILocalizationService _localization;
    
    public async Task<Dictionary<string, object>> Handle(
        GetTranslationDictionaryQuery request, 
        CancellationToken ct)
    {
        var culture = new CultureInfo(request.Language);
        
        return new Dictionary<string, object>
        {
            ["orderStatuses"] = GetOrderStatusTranslations(culture),
            ["paymentMethods"] = GetPaymentMethodTranslations(culture),
            ["countries"] = GetCountryTranslations(culture)
        };
    }
    
    private Dictionary<string, string> GetOrderStatusTranslations(CultureInfo culture)
    {
        return Enum.GetValues<OrderStatus>()
            .ToDictionary(
                status => status.ToString(),
                status => _localization.GetString($"Domain.OrderStatus.{status}", culture)
            );
    }
}
```

### 2. CQRS Read Models with Translations
```csharp
// Application/Queries/GetOrders/OrderDto.cs
public class OrderDto
{
    public Guid Id { get; set; }
    public string StatusCode { get; set; }  // "pending", "confirmed", etc.
    // Frontend will translate using domain:order.status.{statusCode}
}
```

### 3. Validation Messages
```csharp
// Application/Commands/Users/CreateUserCommandValidator.cs
public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithErrorCode("error.validation.required")  // Key for frontend
            .EmailAddress()
            .WithErrorCode("error.validation.invalidEmail");
            
        RuleFor(x => x.Password)
            .MinimumLength(8)
            .WithErrorCode("error.validation.minLength")
            .WithState(x => new { min = 8 });  // Parameters for interpolation
    }
}
```

## Best Practices

### DO's
✅ Return translation keys from backend, not translated text  
✅ Use namespaces to organize translations (common, errors, domain)  
✅ Keep domain layer language-agnostic  
✅ Use localization in Application layer for server-side operations (emails, PDFs)  
✅ Implement lazy loading for translation files in React  
✅ Use TypeScript for type-safe translation keys  
✅ Cache translation dictionaries on frontend  
✅ Provide interpolation parameters from backend when needed  
✅ Use consistent key naming conventions (e.g., `error.entity.problem`)

### DON'Ts
❌ Don't translate in Domain entities  
❌ Don't return translated text from API endpoints for UI  
❌ Don't mix translation keys with hardcoded text  
❌ Don't store translations in database (use files)  
❌ Don't use string concatenation for translations  
❌ Don't forget pluralization rules (i18next handles this)  
❌ Don't translate technical logs or developer messages

## Migration Strategy

### Phase 1: Setup Infrastructure
1. Install frontend dependencies (react-i18next)
2. Install backend dependencies (Microsoft.Extensions.Localization)
3. Configure middleware and DI
4. Create translation file structure

### Phase 2: Extract Hard-coded Text
1. Identify all UI text in components
2. Extract to translation files with keys
3. Replace hardcoded text with `t()` function calls

### Phase 3: Backend Error Codes
1. Convert error messages to error codes
2. Update API responses to return codes instead of messages
3. Map error codes in frontend translation files

### Phase 4: Server-side Content
1. Identify email templates, PDF content
2. Create resource files for server-side translations
3. Implement localization service usage

### Phase 5: Testing
1. Test language switching
2. Verify all error scenarios
3. Test interpolation and pluralization
4. Validate server-side content (emails in both languages)

## Testing Considerations

### Frontend Tests
```typescript
// Mock i18next in tests
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));
```

### Backend Tests
```csharp
// Mock localization service
var mockLocalization = new Mock<ILocalizationService>();
mockLocalization
    .Setup(x => x.GetString(It.IsAny<string>()))
    .Returns((string key) => key);  // Return key as-is for testing
```

## Performance Optimization

1. **Frontend**: Use lazy loading for translation namespaces
2. **Frontend**: Cache translations in localStorage
3. **Frontend**: Use React.memo for components with translations
4. **Backend**: Cache localized strings in memory
5. **Backend**: Use compiled resource files (.resources)

## Security Considerations

- Sanitize interpolation parameters to prevent XSS
- Validate language codes from user input
- Don't expose sensitive information in error keys
- Use Content-Security-Policy for loaded translation files

## Example Repository Structure

```
Solution/
├── src/
│   ├── Domain/
│   │   └── Errors/
│   │       └── DomainError.cs
│   ├── Application/
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   │   └── ILocalizationService.cs
│   │   │   └── Resources/
│   │   │       ├── Messages.resx
│   │   │       └── Messages.pl.resx
│   │   ├── Commands/
│   │   └── Queries/
│   ├── Infrastructure/
│   │   └── Localization/
│   │       └── LocalizationService.cs
│   ├── Presentation/
│   │   ├── Middleware/
│   │   │   └── CultureMiddleware.cs
│   │   └── Controllers/
│   └── Web/ (React)
│       ├── src/
│       │   ├── i18n/
│       │   │   ├── config.ts
│       │   │   └── resources/
│       │   │       ├── en/
│       │   │       └── pl/
│       │   └── components/
│       └── public/
│           └── locales/  (for production)
└── INTERNATIONALIZATION_GUIDE.md (this file)
```

## Summary

This implementation strategy ensures:
- **Separation of Concerns**: Frontend handles UI translations, backend handles business logic
- **DDD Compliance**: Domain remains language-agnostic
- **Scalability**: Easy to add new languages
- **Performance**: Minimal overhead with caching
- **Developer Experience**: Type-safe translations, clear error handling
- **User Experience**: Instant language switching without page reload

Follow these guidelines consistently across the codebase for maintainable internationalization.