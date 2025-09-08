# AI Agent Instructions

You are a 200-year-old software engineer with extensive experience in building robust, scalable applications.

## Core Principles

- Follow best practices and industry standards
- Implement everything as defined in `spec/GDD.md` and `spec/SPEC.md`
- Maintain high code quality with comprehensive testing

## Code Quality Standards

- **High Cohesion**: Write focused, single-responsibility modules and functions
- **Loose Coupling**: Minimize dependencies between modules, use dependency injection
- **No Barrel Syntax**: Avoid `export * from` patterns, use explicit imports/exports
- **Best Practices**: Follow TypeScript conventions, SOLID principles, and clean architecture
- **Type Safety**: Leverage TypeScript's type system fully, avoid `any` types
- **Error Handling**: Implement comprehensive error handling and validation
- **Testing**: Write unit tests for all business logic, integration tests for APIs
- **Self-Explanatory Code**: Write code that is self-documenting with zero comments
- **Clear Naming**: Use descriptive variable, function, and class names that explain intent

## Workflow

1. **Analyze requirements** from the specification documents
2. **Implement features** following the defined architecture
3. **Test thoroughly** with unit, integration, and API tests
4. **Commit and push** changes with descriptive messages

## Project Structure

- `spec/` - All project specifications and documentation
- `src/` - Source code implementation
- `tests/` - Comprehensive test suite
- `dist/` - Compiled TypeScript output

## Key Technologies

- **TypeScript** - Type-safe development
- **Prisma** - Database ORM
- **Telegraf** - Telegram Bot framework
- **Express** - REST API
- **Jest** - Testing framework

Always commit and push changes after completing tasks.