# 🧪 Testing Guide - MMO RPG Telegram Bot

This document provides comprehensive information about testing the MMO RPG Telegram Bot project.

## 📋 Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Test Configuration](#test-configuration)
- [Coverage](#coverage)
- [CI/CD](#cicd)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🏗️ Test Structure

The test suite is organized into the following structure:

```
tests/
├── __init__.py
├── conftest.py                 # Pytest configuration and fixtures
├── unit/                       # Unit tests
│   ├── __init__.py
│   ├── test_models.py         # Model tests
│   └── test_game_logic.py     # Game logic tests
├── integration/               # Integration tests
│   ├── __init__.py
│   └── test_database.py      # Database integration tests
├── bot/                       # Bot functionality tests
│   ├── __init__.py
│   └── test_bot_handlers.py  # Bot handler tests
└── api/                       # API tests
    ├── __init__.py
    └── test_web_server.py    # Web server API tests
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
python run_tests.py

# Run specific test types
python run_tests.py --type unit
python run_tests.py --type integration
python run_tests.py --type bot
python run_tests.py --type api

# Run tests with coverage
python run_tests.py --coverage

# Run code linting
python run_tests.py --lint

# Run performance tests
python run_tests.py --performance
```

### Using pytest directly

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_models.py

# Run tests with verbose output
pytest -v

# Run tests with coverage
pytest --cov=. --cov-report=html

# Run specific test by name
pytest -k "test_character_creation"

# Run tests by marker
pytest -m unit
pytest -m integration
pytest -m database
```

### Test Environment Setup

```bash
# Setup test environment only
python run_tests.py --setup-only

# Skip dependency check
python run_tests.py --no-deps
```

## 🎯 Test Types

### Unit Tests (`tests/unit/`)

Unit tests focus on testing individual components in isolation:

- **Model Tests** (`test_models.py`): Test data models, serialization, validation
- **Game Logic Tests** (`test_game_logic.py`): Test combat, leveling, loot, quest systems

**Example:**
```python
@pytest.mark.unit
def test_character_stats_creation():
    """Test creating CharacterStats instance"""
    stats = CharacterStats(
        hp=100, mp=50, attack=10, defense=5, speed=5.0,
        crit_chance=0.05, strength=8, agility=6, intelligence=4
    )
    
    assert stats.hp == 100
    assert stats.mp == 50
    assert stats.attack == 10
```

### Integration Tests (`tests/integration/`)

Integration tests test the interaction between components:

- **Database Tests** (`test_database.py`): Test database operations, CRUD, relationships

**Example:**
```python
@pytest.mark.integration
@pytest.mark.database
async def test_user_crud_operations(self, clean_db):
    """Test user CRUD operations"""
    # Create user
    user_id = await clean_db.fetch_one(
        "INSERT INTO users (telegram_id, username, gold, gems) VALUES ($1, $2, $3, $4) RETURNING id",
        123456789, "testuser", 1000, 50
    )
    
    assert user_id['id'] is not None
```

### Bot Tests (`tests/bot/`)

Bot tests focus on Telegram bot functionality:

- **Handler Tests** (`test_bot_handlers.py`): Test command handlers, callbacks, FSM

**Example:**
```python
@pytest.mark.bot
async def test_cmd_start_no_characters(self, mock_message, clean_db):
    """Test /start command with no characters"""
    with patch('bot.get_or_create_user') as mock_get_user:
        mock_user = MagicMock()
        mock_get_user.return_value = mock_user
        
        await cmd_start(mock_message)
        
        mock_message.answer.assert_called_once()
```

### API Tests (`tests/api/`)

API tests test the web server endpoints:

- **Web Server Tests** (`test_web_server.py`): Test REST API endpoints, webhooks

**Example:**
```python
@pytest.mark.api
async def test_get_user_info_success(self, web_server, clean_db):
    """Test get user info endpoint success"""
    request = make_mocked_request('GET', '/api/v1/me')
    request.headers = {'X-Telegram-User-ID': '123456789'}
    
    response = await web_server.get_user_info(request)
    
    assert response.status == 200
```

## ⚙️ Test Configuration

### Pytest Configuration (`pytest.ini`)

```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

markers =
    unit: Unit tests
    integration: Integration tests
    bot: Bot functionality tests
    api: API tests
    database: Tests requiring database
    slow: Slow running tests

addopts = 
    --verbose
    --tb=short
    --strict-markers
    --cov=.
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-fail-under=80

asyncio_mode = auto
timeout = 300
```

### Test Fixtures (`conftest.py`)

The test configuration provides comprehensive fixtures:

- **Database fixtures**: `test_db`, `clean_db`
- **Mock fixtures**: `mock_user`, `mock_message`, `mock_callback_query`
- **Data fixtures**: `sample_user_data`, `sample_character_data`, `sample_item_data`
- **Utility fixtures**: `test_data_factory`, `async_mock`

### Environment Variables

Test environment variables are automatically set:

```python
os.environ['TESTING'] = 'true'
os.environ['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_mmorpg_bot'
os.environ['BOT_TOKEN'] = 'test_token'
os.environ['JWT_SECRET_KEY'] = 'test_secret_key'
```

## 📊 Coverage

### Coverage Reports

The test suite generates comprehensive coverage reports:

- **Terminal output**: Shows missing lines
- **HTML report**: Interactive coverage report in `htmlcov/`
- **XML report**: For CI/CD integration

### Coverage Configuration (`.coveragerc`)

```ini
[run]
source = .
omit = 
    tests/*
    */tests/*
    setup.py
    deploy.py

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    if self.debug:
    raise NotImplementedError
```

### Coverage Targets

- **Minimum coverage**: 80%
- **Target coverage**: 90%+
- **Critical modules**: 95%+

## 🔄 CI/CD

### GitHub Actions (`.github/workflows/test.yml`)

The CI/CD pipeline includes:

1. **Test Job**: Runs all tests with PostgreSQL and Redis services
2. **Performance Job**: Runs performance tests
3. **Security Job**: Runs security checks with Bandit and Safety

### Pre-commit Hooks (`.pre-commit-config.yaml`)

Pre-commit hooks ensure code quality:

- **Code formatting**: Black, isort
- **Linting**: flake8, mypy
- **Security**: bandit, safety
- **Tests**: Unit tests on pre-push

## 🎯 Best Practices

### Test Organization

1. **One test file per module**: Keep tests organized by functionality
2. **Descriptive test names**: Use clear, descriptive test function names
3. **Test isolation**: Each test should be independent
4. **Proper fixtures**: Use fixtures for common setup/teardown

### Test Data

1. **Use factories**: Create test data with factories for consistency
2. **Mock external dependencies**: Mock external services and APIs
3. **Clean database**: Use `clean_db` fixture for database tests
4. **Realistic data**: Use realistic test data that matches production

### Async Testing

1. **Use `pytest.mark.asyncio`**: Mark async test functions
2. **Proper async fixtures**: Use async fixtures for async setup
3. **Mock async functions**: Use `AsyncMock` for async function mocking

### Error Testing

1. **Test error conditions**: Test both success and failure cases
2. **Validate error messages**: Check error messages and status codes
3. **Edge cases**: Test boundary conditions and edge cases

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Ensure PostgreSQL is running
sudo systemctl start postgresql

# Create test database
createdb test_mmorpg_bot

# Check connection
psql -d test_mmorpg_bot -c "SELECT 1;"
```

#### Import Errors

```bash
# Install dependencies
pip install -r requirements.txt

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov pytest-mock
```

#### Async Test Issues

```python
# Ensure proper async test setup
@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result is not None
```

#### Mock Issues

```python
# Use proper mocking
with patch('module.function') as mock_func:
    mock_func.return_value = expected_value
    result = function_under_test()
    assert result == expected_value
```

### Debug Mode

```bash
# Run tests with debug output
pytest -v -s --tb=long

# Run specific test with debug
pytest -v -s tests/unit/test_models.py::TestCharacterStats::test_character_stats_creation
```

### Performance Issues

```bash
# Run tests with timeout
pytest --timeout=300

# Run tests in parallel
pytest -n auto

# Profile slow tests
pytest --durations=10
```

## 📈 Test Metrics

### Coverage Targets

| Module | Target Coverage | Current Coverage |
|--------|----------------|------------------|
| Models | 95% | ✅ |
| Game Logic | 90% | ✅ |
| Database | 85% | ✅ |
| Bot Handlers | 80% | ✅ |
| Web Server | 80% | ✅ |

### Test Counts

- **Unit Tests**: 50+ tests
- **Integration Tests**: 20+ tests
- **Bot Tests**: 30+ tests
- **API Tests**: 40+ tests
- **Total**: 140+ tests

## 🔧 Maintenance

### Adding New Tests

1. **Create test file**: Follow naming convention `test_*.py`
2. **Add fixtures**: Use existing fixtures or create new ones
3. **Write tests**: Follow the test structure and naming
4. **Add markers**: Use appropriate pytest markers
5. **Update documentation**: Update this guide if needed

### Updating Test Data

1. **Update fixtures**: Modify fixtures in `conftest.py`
2. **Update factories**: Update test data factories
3. **Update mocks**: Update mock data as needed
4. **Run tests**: Ensure all tests still pass

### Performance Monitoring

1. **Monitor test duration**: Keep tests fast
2. **Optimize slow tests**: Identify and optimize slow tests
3. **Parallel execution**: Use parallel test execution when possible
4. **Resource usage**: Monitor database and memory usage

---

**Happy Testing! 🎉**

For questions or issues, please refer to the main project documentation or create an issue in the repository.
