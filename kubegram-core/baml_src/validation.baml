function GenerateValidationTestCases(
  paths: OpenApiPathEntry[]
) -> ValidationTestCasesResponse {
  client KubegramFallback
  prompt #"
    You are an API testing expert. Given the following OpenAPI path definitions,
    generate one representative HTTP test request per path+method combination.

    **Instructions:**
    1. For each path entry, consider each HTTP method listed
    2. Generate a realistic test case that would exercise that endpoint
    3. Use appropriate headers (Content-Type, Accept) based on the operation
    4. For POST/PUT/PATCH, include a realistic JSON body
    5. Set expectedStatus to the most common success status (200, 201, 204, etc.)

    **OpenAPI Paths:**
    {% for path in paths %}
    - Path: {{ path.path }}
      Methods: {{ path.methods }}
    {% endfor %}

    {{ ctx.output_format }}
  "#
}

function AnalyzeValidationResults(
  testCases: TestCaseSummary[],
  testResults: TestResultSummary[],
  stats: ValidationStats
) -> ValidationAnalysisResponse {
  client KubegramFallback
  prompt #"
    You are a Kubernetes infrastructure validation expert.
    Analyze the following API validation test results and provide a concise summary.

    **Instructions:**
    1. Cover overall health of the infrastructure
    2. Highlight any failed tests and likely causes
    3. Provide recommended actions if failures exist
    4. Keep the summary to 3-5 sentences

    **Test Cases:**
    {% for tc in testCases %}
    - {{ tc.method }} {{ tc.path }} (expects {{ tc.expectedStatus }})
    {% endfor %}

    **Test Results:**
    {% for result in testResults %}
    - {{ result.correlationId }}: {% if result.success %}PASS{% else %}FAIL{% endif %} (status {{ result.actualStatus }}, {{ result.responseTimeMs }}ms)
      {% if result.error %}Error: {{ result.error }}{% endif %}
    {% endfor %}

    **Summary Stats:**
    - Total: {{ stats.total }}
    - Passed: {{ stats.passed }}
    - Failed: {{ stats.failed }}
    - Skipped: {{ stats.skipped }}

    {{ ctx.output_format }}
  "#
}
