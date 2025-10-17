# Test Suite for Tailor Management System

This directory contains comprehensive tests for the tailor management system, with a focus on the `useLookup` hook and its helper functions.

## Test Structure

```
__tests__/
├── hooks/
│   ├── useLookup.test.ts              # Original basic tests
│   ├── useLookup.comprehensive.test.ts # Comprehensive hook tests
│   └── useLookupUtils.test.ts         # Utility function tests
├── helpers/
│   └── lookup/
│       ├── apiHelpers.test.ts         # API helper function tests
│       └── fieldTypes.test.ts         # Field type detection tests
└── README.md                          # This file
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Test only the useLookup hook
npm test useLookup

# Test only helper functions
npm test helpers

# Test specific file
npm test apiHelpers.test.ts
```

## Test Coverage

### useLookup Hook Tests (`useLookup.comprehensive.test.ts`)

**Initialization Tests:**
- ✅ Empty state initialization
- ✅ Props initialization
- ✅ Default values

**Field Type Detection Tests:**
- ✅ Number field detection
- ✅ Date field detection
- ✅ Status field detection
- ✅ Measurement type field detection
- ✅ Lookup field detection
- ✅ Object lookup field detection
- ✅ Array field detection
- ✅ Internal field skipping

**API Request Handling Tests:**
- ✅ Measurement type lookup
- ✅ Factory lookup
- ✅ Regular entity lookup
- ✅ Error handling
- ✅ Fallback mechanisms

**Request Queue Management Tests:**
- ✅ Queue processing
- ✅ Concurrent request limiting
- ✅ Request prioritization

**Data Analysis Tests:**
- ✅ Form structure analysis
- ✅ Nested object detection
- ✅ Field type inference

**Utility Function Tests:**
- ✅ Field name formatting
- ✅ Status value formatting
- ✅ Status options retrieval
- ✅ Field type checking
- ✅ Display field determination
- ✅ Data array extraction
- ✅ Current entity detection

**Form Data Handling Tests:**
- ✅ Submit field filtering
- ✅ Empty form data generation
- ✅ Data transformation

**Cell Rendering Tests:**
- ✅ Basic value rendering
- ✅ Complex object rendering
- ✅ Array value rendering
- ✅ Null value handling

**State Management Tests:**
- ✅ Lookup reset
- ✅ Options update
- ✅ Error handling
- ✅ State synchronization

**Error Handling Tests:**
- ✅ API error handling
- ✅ Network error handling
- ✅ Retry mechanisms
- ✅ Graceful degradation

**Performance Tests:**
- ✅ Request caching
- ✅ Cache cleanup
- ✅ Memory management

### API Helpers Tests (`apiHelpers.test.ts`)

**Data Extraction Tests:**
- ✅ Array response handling
- ✅ Object response handling
- ✅ Entity-specific field extraction
- ✅ Invalid response handling

**Item Mapping Tests:**
- ✅ Catalog item mapping
- ✅ Factory item mapping
- ✅ Generic item mapping
- ✅ Custom display field handling
- ✅ Fallback label generation

**Response Processing Tests:**
- ✅ Valid response processing
- ✅ Invalid response handling
- ✅ Null item filtering

**API Request Tests:**
- ✅ Successful requests
- ✅ Error handling
- ✅ Authentication handling

**Factory Lookup Tests:**
- ✅ Multiple endpoint attempts
- ✅ Success handling
- ✅ Error handling

**Entity Lookup Tests:**
- ✅ Successful lookup
- ✅ Catalog fallback
- ✅ Authentication fallback
- ✅ Brand filtering
- ✅ Error handling

### Field Types Tests (`fieldTypes.test.ts`)

**Number Field Detection:**
- ✅ All number field patterns
- ✅ Case insensitivity
- ✅ Negative cases

**Date Field Detection:**
- ✅ All date field patterns
- ✅ Case insensitivity
- ✅ Negative cases

**Status Field Detection:**
- ✅ All status field patterns
- ✅ Case insensitivity
- ✅ Negative cases

**Measurement Type Detection:**
- ✅ Exact pattern matching
- ✅ Combined word patterns
- ✅ Case insensitivity
- ✅ Negative cases

**Object Field Detection:**
- ✅ Name field detection
- ✅ ID field detection
- ✅ Case insensitivity
- ✅ Negative cases

**Entity Inference:**
- ✅ ID field parsing
- ✅ Different formats
- ✅ Complex names
- ✅ Invalid fields

**Array Lookup Detection:**
- ✅ Lookup field detection
- ✅ Multiple value validation
- ✅ Invalid input handling
- ✅ Empty array handling

**Constants Validation:**
- ✅ Pattern completeness
- ✅ Regex validation
- ✅ Pattern accuracy

## Mock Strategy

### API Service Mocking
- Mock `fetchAPI` function with Jest
- Simulate successful and failed responses
- Test different response formats

### Helper Function Mocking
- Mock all helper functions for isolated testing
- Control return values for different scenarios
- Test error conditions

### React Hook Testing
- Use `@testing-library/react-hooks`
- Test state changes and side effects
- Mock external dependencies

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Mocking**: External dependencies are properly mocked
3. **Coverage**: All major code paths are tested
4. **Error Cases**: Both success and failure scenarios are covered
5. **Performance**: Tests include performance-related scenarios
6. **Maintainability**: Tests are well-organized and documented

## Test Data

### Sample API Responses
```javascript
// Successful response
{
  data: [
    { _id: '1', name: 'Item 1' },
    { _id: '2', name: 'Item 2' }
  ]
}

// Error response
{
  error: 'Network error',
  data: null
}
```

### Sample Form Data
```javascript
// Customer form
{
  name: 'John Doe',
  email: 'john@example.com',
  customerId: '123',
  items: [
    { _id: '1', name: 'Item 1' },
    { _id: '2', name: 'Item 2' }
  ]
}
```

## Continuous Integration

The test suite is designed to run in CI/CD pipelines with:
- Fast execution (< 30 seconds)
- Reliable results
- Good error reporting
- Coverage reporting

## Debugging Tests

### Common Issues
1. **Mock not working**: Check mock setup and imports
2. **Async issues**: Use `act()` and `waitFor()`
3. **State updates**: Ensure proper state management
4. **Timing issues**: Use proper async/await patterns

### Debug Commands
```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with debug
npm test -- --testNamePattern="should detect number fields"

# Run with no coverage for faster debugging
npm test -- --coverage=false
```

## Future Enhancements

1. **Integration Tests**: Add tests for component integration
2. **E2E Tests**: Add end-to-end testing with Playwright
3. **Performance Tests**: Add performance benchmarking
4. **Visual Tests**: Add visual regression testing
5. **Accessibility Tests**: Add a11y testing
